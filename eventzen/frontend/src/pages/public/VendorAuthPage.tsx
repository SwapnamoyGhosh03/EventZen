import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { LogIn, ArrowLeft, Package, Shield, BarChart3, Calendar } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { loginSchema, type LoginFormData } from "@/utils/validators";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/context/AuthContext";

export default function VendorAuthPage() {
  const { login, isLoginLoading } = useAuth();
  const { isAuthenticated, portalPath } = useAuthContext();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  if (isAuthenticated) {
    return <Navigate to={portalPath} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError("");
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.data?.message || "Invalid credentials. Please try again.");
    }
  };

  const features = [
    { icon: Calendar, label: "Manage Events", desc: "Create and organize events end-to-end" },
    { icon: Package, label: "Vendor Tools", desc: "Track contracts, deliverables & invoices" },
    { icon: BarChart3, label: "Analytics", desc: "Real-time reports and financial insights" },
    { icon: Shield, label: "Secure Access", desc: "Enterprise-grade role-based security" },
  ];

  return (
    <PageTransition>
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
        <div className="w-full max-w-4xl flex flex-col lg:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Left panel — branding */}
          <div className="lg:w-5/12 bg-gradient-to-br from-[#0f3460] to-[#1a1a2e] p-8 lg:p-10 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-lg bg-amber/20 flex items-center justify-center">
                  <Package size={22} className="text-amber" />
                </div>
                <div>
                  <p className="font-heading text-lg font-bold leading-tight">
                    Event<span className="text-amber">Zen</span>
                  </p>
                  <p className="text-[10px] font-accent uppercase tracking-[2px] text-white/50">
                    Vendor Portal
                  </p>
                </div>
              </div>

              <h2 className="font-heading text-xl lg:text-2xl font-bold mb-3 leading-snug">
                Your all-in-one vendor management hub
              </h2>
              <p className="font-body text-sm text-white/60 mb-8">
                Access your dashboard, manage contracts, and track financials — all in one place.
              </p>

              <div className="space-y-4">
                {features.map((f) => (
                  <div key={f.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <f.icon size={16} className="text-amber" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium">{f.label}</p>
                      <p className="font-body text-xs text-white/50">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="font-body text-[11px] text-white/30 mt-8 hidden lg:block">
              Secured by EventZen Enterprise Auth
            </p>
          </div>

          {/* Right panel — login form */}
          <div className="lg:w-7/12 p-8 lg:p-10 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="font-heading text-2xl font-bold text-near-black mb-1">
                  Vendor Sign In
                </h1>
                <p className="font-body text-sm text-muted-gray">
                  Enter your credentials to access the vendor portal
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-md p-3 font-body text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Work Email"
                  type="email"
                  placeholder="vendor@company.com"
                  error={errors.email?.message}
                  {...register("email")}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register("password")}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-amber rounded" />
                    <span className="font-body text-sm text-dark-gray">Keep me signed in</span>
                  </label>
                  <Link
                    to="/auth/forgot-password"
                    className="font-body text-sm text-amber hover:text-amber-dark transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" fullWidth isLoading={isLoginLoading} className="gap-2">
                  <LogIn size={18} />
                  Sign In to Portal
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border-light">
                <p className="font-body text-xs text-muted-gray text-center mb-4">
                  Not a vendor yet? Customers can apply from their dashboard.
                </p>
                <Link
                  to="/auth"
                  className="flex items-center justify-center gap-2 font-body text-sm text-dark-gray hover:text-near-black transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to main login
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
