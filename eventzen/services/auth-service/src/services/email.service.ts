import nodemailer from 'nodemailer';
import { config } from '../config';
import logger from '../utils/logger';

let smtpTransporter: nodemailer.Transporter | null = null;

function getSmtpTransporter(): nodemailer.Transporter {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return smtpTransporter;
}

async function createEtherealTransporter(): Promise<nodemailer.Transporter> {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

const OTP_HTML = (firstName: string, otp: string) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 28px; color: #1a1a1a; margin: 0;">
        Event<span style="color: #d4a843;">Zen</span>
      </h1>
    </div>
    <div style="background: #f9f7f2; border-radius: 12px; padding: 32px; text-align: center;">
      <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 8px;">
        Verify your email
      </h2>
      <p style="color: #6b6b6b; font-size: 14px; margin: 0 0 24px;">
        Hi ${firstName}, use this code to complete your registration:
      </p>
      <div style="background: white; border: 2px solid #d4a843; border-radius: 8px; padding: 16px; display: inline-block; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">
          ${otp}
        </span>
      </div>
      <p style="color: #999; font-size: 12px; margin: 0;">
        This code expires in 10 minutes. Do not share it with anyone.
      </p>
    </div>
  </div>
`;

/**
 * Sends the OTP email. Returns true if the email was delivered (SMTP or Ethereal),
 * false if all transports failed. Callers use this to decide whether to expose
 * the OTP in the API response as a fallback.
 */
export async function sendOtpEmail(to: string, otp: string, firstName: string): Promise<boolean> {
  const mailOptions = {
    from: config.smtp.from,
    to,
    subject: `${otp} is your EventZen verification code`,
    html: OTP_HTML(firstName, otp),
  };

  // Try real SMTP first if credentials are configured
  if (config.smtp.user && config.smtp.pass) {
    try {
      const transport = getSmtpTransporter();
      await transport.sendMail(mailOptions);
      logger.info(`OTP email sent via SMTP to ${to}`);
      return true;
    } catch (smtpError) {
      // Reset transporter on failure so it's recreated on next attempt
      smtpTransporter = null;
      logger.warn(`SMTP send failed for ${to} — falling back to Ethereal`, {
        error: (smtpError as Error).message,
      });
    }
  }

  // Fallback: Ethereal preview email (works without real SMTP credentials)
  // Returns false because Ethereal does NOT deliver to the user's actual inbox —
  // the caller will include devOtp in the response so the user can see the code.
  try {
    const ethereal = await createEtherealTransporter();
    const info = await ethereal.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[DEV] OTP email preview (Ethereal): ${previewUrl}`);
    }
    logger.info(`OTP email sent via Ethereal to ${to} — devOtp will be shown in UI`);
  } catch (etherealError) {
    logger.error(`All email transports failed for ${to} — OTP will be returned in API response`, {
      error: (etherealError as Error).message,
    });
  }
  return false;
}
