import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { registerSchema, type RegisterFormData } from "@/utils/validators";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface RegisterFormProps {
  onSuccess?: (email: string, devOtp?: string) => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser, isRegisterLoading } = useAuth();
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");

  const nextStep = async () => {
    const valid = await trigger(["firstName", "lastName", "email"]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError("");
      const result = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      onSuccess?.(data.email, result?.devOtp);
    } catch (err: any) {
      setError(err?.data?.error?.message || err?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-md p-3 font-body text-sm">
          {error}
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex gap-2 mb-2">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-amber" : "bg-border-light"}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-amber" : "bg-border-light"}`} />
      </div>

      {step === 1 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Button type="button" fullWidth onClick={nextStep}>
            Continue
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordStrength password={passwordValue} />
          </div>

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isRegisterLoading}
              className="flex-1 gap-2"
            >
              <UserPlus size={18} />
              Create Account
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
