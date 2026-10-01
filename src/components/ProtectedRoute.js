import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// allowedRole ممكن تكون دور واحد ("customer") أو مصفوفة (["customer", "broker"])
export default function ProtectedRoute({ allowedRole, children }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  if (allowedRole && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}