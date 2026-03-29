import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import OtpVerification from "@/components/auth/OtpVerification";
import { useAuthContext } from "@/context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [verified, setVerified] = useState(false);
  const { isAuthenticated, portalPath } = useAuthContext();

  if (isAuthenticated) {
    return <Navigate to={portalPath} replace />;
  }

  const handleRegisterSuccess = (email: string, otp?: string) => {
    setOtpEmail(email);
    setDevOtp(otp);
  };

  const handleOtpVerified = () => {
    setVerified(true);
    setOtpEmail(null);
    setDevOtp(undefined);
  };

  const handleBackToRegister = () => {
    setOtpEmail(null);
    setDevOtp(undefined);
  };

  return (
    <PageTransition>
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center section-cream px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-near-black mb-2">
              Welcome to Event<span className="text-amber">Zen</span>
            </h1>
            <p className="font-body text-dark-gray">
              {otpEmail
                ? "One more step to verify your email"
                : mode === "login"
                  ? "Sign in to manage your events"
                  : "Create your account to get started"}
            </p>
          </div>

          {/* Card */}
          <motion.div
            key={otpEmail ? "otp" : mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] as const }}
            className="bg-white border border-border-light rounded-xl p-8 shadow-warm-sm"
          >
            {otpEmail ? (
              <OtpVerification
                email={otpEmail}
                onSuccess={handleOtpVerified}
                onBack={handleBackToRegister}
                devOtp={devOtp}
              />
            ) : verified ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-sage/10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">&#9989;</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-near-black mb-2">
                  Email Verified!
                </h3>
                <p className="font-body text-dark-gray mb-4">
                  Your account is ready. You can now sign in.
                </p>
                <button
                  onClick={() => {
                    setVerified(false);
                    setMode("login");
                  }}
                  className="font-body text-sm text-amber hover:text-amber-dark transition-colors font-medium"
                >
                  Sign in now
                </button>
              </div>
            ) : (
              <>
                {/* Mode Toggle */}
                <div className="flex mb-6 bg-cream rounded-lg p-1">
                  <button
                    onClick={() => setMode("login")}
                    className={`flex-1 py-2.5 rounded-md font-accent text-sm font-semibold uppercase tracking-wider transition-all ${
                      mode === "login"
                        ? "bg-white text-near-black shadow-warm-sm"
                        : "text-muted-gray"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setMode("register")}
                    className={`flex-1 py-2.5 rounded-md font-accent text-sm font-semibold uppercase tracking-wider transition-all ${
                      mode === "register"
                        ? "bg-white text-near-black shadow-warm-sm"
                        : "text-muted-gray"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {mode === "login" ? (
                  <LoginForm />
                ) : (
                  <RegisterForm onSuccess={handleRegisterSuccess} />
                )}
              </>
            )}
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
