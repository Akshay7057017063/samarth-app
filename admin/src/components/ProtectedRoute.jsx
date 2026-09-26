import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { admin, isAuthenticated } = useAuth();

  if (!isAuthenticated || !admin) {
    return <Navigate to="/login" replace />;
  }

  if (admin.role !== "admin" && admin.role !== "superadmin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;