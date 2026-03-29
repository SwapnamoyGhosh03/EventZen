import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Package } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { loginSchema, type LoginFormData } from "@/utils/validators";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function LoginForm() {
  const { login, isLoginLoading } = useAuth();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError("");
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.data?.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-md p-3 font-body text-sm">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
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
          <span className="font-body text-sm text-dark-gray">Remember me</span>
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
        Sign In
      </Button>

      {/* Vendor SSO-style login link */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-light" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 font-body text-xs text-muted-gray uppercase tracking-wider">
            or
          </span>
        </div>
      </div>

      <Link
        to="/auth/vendor"
        className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-lg border-[1.5px] border-[#0f3460] bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] text-white font-body text-sm font-medium hover:from-[#16213e] hover:to-[#0f3460] transition-all duration-300 shadow-sm hover:shadow-md"
      >
        <Package size={18} />
        Sign in as Vendor / Organizer
      </Link>
    </form>
  );
}
