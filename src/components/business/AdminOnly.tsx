import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { LogoSkeleton } from "@/components/BrandedSkeleton";

/** Restricts a route to app owners/admins. */
const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (loading || (user && isLoading)) {
    return <LogoSkeleton className="min-h-screen border-0 bg-transparent" />;
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default AdminOnly;
