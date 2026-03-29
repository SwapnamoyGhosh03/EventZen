import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/utils/validators";
import { useResetPasswordMutation } from "@/store/api/authApi";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [success, setSuccess] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPassword({ token, password: data.password }).unwrap();
      setSuccess(true);
    } catch {
      // handled by form
    }
  };

  return (
    <PageTransition>
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center section-cream px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-border-light rounded-xl p-8 shadow-warm-sm">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-sage/10 rounded-full flex items-center justify-center">
                  <Lock size={28} className="text-sage" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-near-black mb-2">
                  Password Reset!
                </h2>
                <p className="font-body text-dark-gray mb-4">
                  Your password has been successfully updated.
                </p>
                <Link to="/auth">
                  <Button variant="primary">Sign In</Button>
                </Link>
              </div>
            ) : (
              <>
                <h2 className="font-heading text-2xl font-bold text-near-black mb-2">
                  Reset Password
                </h2>
                <p className="font-body text-dark-gray mb-6">
                  Enter your new password below.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Repeat password"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />
                  <Button type="submit" fullWidth isLoading={isLoading}>
                    Reset Password
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
