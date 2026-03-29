import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { profileSchema, type ProfileFormData } from "@/utils/validators";
import { useAuthContext } from "@/context/AuthContext";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuthContext();
  const { logout } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data).unwrap();
    } catch {
      // handled by toast
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-6">
          Account Settings
        </h1>

        {/* Profile */}
        <Card hover={false} padding="lg" className="mb-6">
          <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
            Profile Information
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Last Name"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>
            <Input
              label="Email"
              value={user?.email || ""}
              disabled
              helperText="Email cannot be changed"
            />
            <Input
              label="Phone"
              placeholder="(555) 123-4567"
              {...register("phone")}
            />
            <Button type="submit" isLoading={isLoading} className="gap-2">
              <Save size={16} />
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card hover={false} padding="lg" className="border-burgundy/20">
          <h2 className="font-heading text-lg font-semibold text-burgundy mb-2">
            Danger Zone
          </h2>
          <p className="font-body text-sm text-dark-gray mb-4">
            Sign out of your account on this device.
          </p>
          <Button variant="accent" onClick={logout}>
            Sign Out
          </Button>
        </Card>
      </div>
    </PageTransition>
  );
}
