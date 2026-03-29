import nodemailer from 'nodemailer';
import { config } from '../config';
import logger from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    logger.info('Email transporter configured with SMTP');
  } else {
    // Use Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info('Email transporter configured with Ethereal (test mode)');
  }

  return transporter;
}

export async function sendOtpEmail(to: string, otp: string, firstName: string): Promise<void> {
  try {
    const transport = await getTransporter();

    const info = await transport.sendMail({
      from: config.smtp.from,
      to,
      subject: `${otp} is your EventZen verification code`,
      html: `
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
      `,
    });

    // Log preview URL for Ethereal test emails
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`Email preview URL: ${previewUrl}`);
    }

    logger.info(`OTP email sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send OTP email', { error });
    // Don't throw — OTP is also logged to console as fallback
  }
}
