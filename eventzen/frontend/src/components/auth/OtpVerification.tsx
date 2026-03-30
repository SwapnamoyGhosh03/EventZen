import { useState, useRef, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { useVerifyOtpMutation, useResendOtpMutation } from "@/store/api/authApi";

interface OtpVerificationProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
  devOtp?: string;
}

export default function OtpVerification({ email, onSuccess, onBack, devOtp: initialDevOtp }: OtpVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    try {
      setError("");
      await verifyOtp({ email, otp: code }).unwrap();
      onSuccess();
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.data?.message || "Invalid OTP. Please try again.");
    }
  };

  const handleResend = async () => {
    try {
      setError("");
      setResendMsg("");
      const result = await resendOtp({ email }).unwrap();
      setResendMsg("A new code has been sent to your email");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      if (result?.devOtp) {
        setDevOtp(result.devOtp);
      }
    } catch (err: any) {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-amber/10 rounded-full flex items-center justify-center">
        <ShieldCheck size={32} className="text-amber" />
      </div>

      <div>
        <h3 className="font-heading text-xl font-semibold text-near-black mb-1">
          Verify your email
        </h3>
        <p className="font-body text-sm text-dark-gray">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-near-black">{email}</span>
        </p>
      </div>

      {devOtp && (
        <div className="bg-amber/10 border border-amber/30 rounded-md p-3 font-body text-sm text-near-black">
          <p className="text-xs text-amber font-semibold uppercase tracking-wide mb-1">Email delivery unavailable — use this code</p>
          Your OTP is: <span className="font-bold tracking-widest text-amber text-lg">{devOtp}</span>
        </div>
      )}

      {error && (
        <div className="bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-md p-3 font-body text-sm">
          {error}
        </div>
      )}

      {resendMsg && (
        <div className="bg-sage/10 border border-sage/20 text-sage rounded-md p-3 font-body text-sm">
          {resendMsg}
        </div>
      )}

      {/* OTP Input Boxes */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`
              w-12 h-14 text-center text-xl font-bold rounded-lg border-2
              transition-all duration-200 outline-none
              font-body text-near-black
              ${digit ? "border-amber bg-amber/5" : "border-border-light bg-white"}
              focus:border-amber focus:ring-2 focus:ring-amber/20
            `}
          />
        ))}
      </div>

      <Button
        fullWidth
        onClick={handleVerify}
        isLoading={isLoading}
        className="gap-2"
      >
        <ShieldCheck size={18} />
        Verify & Continue
      </Button>

      <div className="space-y-2">
        <p className="font-body text-xs text-muted-gray">
          Didn't receive the code?
        </p>
        {countdown > 0 ? (
          <p className="font-body text-sm text-dark-gray">
            Resend in <span className="font-medium text-amber">{countdown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="font-body text-sm text-amber hover:text-amber-dark transition-colors font-medium disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </div>

      <button
        onClick={onBack}
        className="font-body text-sm text-muted-gray hover:text-near-black transition-colors"
      >
        Use a different email
      </button>
    </div>
  );
}
