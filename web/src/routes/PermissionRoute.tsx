import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

type Permission = "platformManager" | "catalogReviewer" | "platformAdmin";

interface PermissionRouteProps {
  permission: Permission;
}

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isPlatformAdmin = user.isPlatformAdmin === true;
  const isPlatformManager = user.isPlatformManager === true;
  const canReviewExercises = user.canReviewExercises === true;

  const allowed =
    permission === "platformAdmin"
      ? isPlatformAdmin
      : permission === "platformManager"
        ? isPlatformAdmin || isPlatformManager
        : isPlatformAdmin || canReviewExercises;

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
