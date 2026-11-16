import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getExerciseImagePermissions } from "../services/exercise-image-proposals";

type Permission =
  | "platformManager"
  | "catalogReviewer"
  | "catalogReader"
  | "platformAdmin";

interface PermissionRouteProps {
  permission: Permission;
}

type AccessStatus = "allowed" | "denied" | "error";

interface AccessResult {
  userId: string;
  status: AccessStatus;
}

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { user, isAuthenticated } = useAuth();

  const [catalogAccess, setCatalogAccess] = useState<AccessResult | null>(null);

  const userId = user?.id;

  const isPlatformAdmin = user?.isPlatformAdmin === true;
  const isPlatformManager = user?.isPlatformManager === true;
  const canReviewExercises = user?.canReviewExercises === true;

  const canReviewCatalog = isPlatformAdmin || canReviewExercises;

  useEffect(() => {
    if (
      permission !== "catalogReader" ||
      !isAuthenticated ||
      !userId ||
      canReviewCatalog
    ) {
      return;
    }

    let active = true;

    getExerciseImagePermissions()
      .then((permissions) => {
        if (!active) return;

        const allowed =
          permissions.canManage ||
          permissions.canPropose ||
          permissions.canApprove;

        setCatalogAccess({
          userId,
          status: allowed ? "allowed" : "denied",
        });
      })
      .catch(() => {
        if (!active) return;

        setCatalogAccess({
          userId,
          status: "error",
        });
      });

    return () => {
      active = false;
    };
  }, [permission, isAuthenticated, userId, canReviewCatalog]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (permission === "catalogReader") {
    if (canReviewCatalog) {
      return <Outlet />;
    }

    const status: AccessStatus | "loading" =
      catalogAccess !== null && catalogAccess.userId === userId
        ? catalogAccess.status
        : "loading";

    if (status === "loading") {
      return (
        <div role="status" className="p-4">
          Verificando permissões do catálogo...
        </div>
      );
    }

    if (status === "error") {
      return (
        <div role="alert" className="p-4">
          Não foi possível verificar as permissões do catálogo. Atualize a
          página para tentar novamente.
        </div>
      );
    }

    if (status === "denied") {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  }

  const allowed =
    permission === "platformAdmin"
      ? isPlatformAdmin
      : permission === "platformManager"
        ? isPlatformAdmin || isPlatformManager
        : canReviewCatalog;

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
