import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole | UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");

  if (!token || !userJson) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userJson);

    if (allowedRole) {
      const rolesArray = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
      if (!rolesArray.includes(user.role)) {
        if (user.role === "admin") {
          return <Navigate to="/admin" replace />;
        }
        if (user.role === "provider") {
          return <Navigate to="/provider" replace />;
        }
        return <Navigate to="/customer" replace />;
      }
    }
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
