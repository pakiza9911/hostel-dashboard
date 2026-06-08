import { Navigate } from "react-router-dom";
import { useAuth } from "../stores/authStore";
import type { ReactNode } from "react";
import type { Role } from "../types";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-500">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
