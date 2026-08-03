import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";

/** Restricts a route to app owners/admins. */
const AdminOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (loading || (user && isLoading)) {
    return <div className="min-h-screen bg-zinc-950" />;
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default AdminOnly;