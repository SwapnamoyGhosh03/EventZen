import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, isAuthenticated, portalPath } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={portalPath} replace />;
  }

  return <>{children}</>;
}
