import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../auth/AdminAuthContext";

export function AdminGuard() {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
