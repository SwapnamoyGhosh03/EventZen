import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

export default function PortalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, portalPath } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={portalPath} replace />;
}
