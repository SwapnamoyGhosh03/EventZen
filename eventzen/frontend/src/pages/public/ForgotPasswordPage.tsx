import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/utils/validators";
import { useForgotPasswordMutation } from "@/store/api/authApi";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data).unwrap();
      setSent(true);
    } catch {
      // Show sent regardless for security
      setSent(true);
    }
  };

  return (
    <PageTransition>
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center section-cream px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-border-light rounded-xl p-8 shadow-warm-sm">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 font-body text-sm text-muted-gray hover:text-amber transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>

            {sent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber/10 rounded-full flex items-center justify-center">
                  <Mail size={28} className="text-amber" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-near-black mb-2">
                  Check Your Email
                </h2>
                <p className="font-body text-dark-gray">
                  If an account exists with that email, we&apos;ve sent password
                  reset instructions.
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-heading text-2xl font-bold text-near-black mb-2">
                  Forgot Password?
                </h2>
                <p className="font-body text-dark-gray mb-6">
                  Enter your email and we&apos;ll send you reset instructions.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <Button type="submit" fullWidth isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
