import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
const { admin, isAuthenticated } = useAuth();

if (!isAuthenticated || !admin) {
return <Navigate to="/login" replace />;
}

const role = String(admin.role || "")
.trim()
.toLowerCase();

if (
role !== "admin" &&
role !== "superadmin"
) {
return <Navigate to="/login" replace />;
}

return <Outlet />;
};

export default ProtectedRoute;
