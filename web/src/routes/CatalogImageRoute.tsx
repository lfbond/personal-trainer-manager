import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { getExerciseImagePermissions } from "../services/exercise-image-proposals";

type AccessState = "allowed" | "denied" | "error";

interface AccessResult {
  userId: string;
  status: AccessState;
}

export function CatalogImageRoute() {
  const { user, isAuthenticated } = useAuth();

  const [result, setResult] = useState<AccessResult | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !userId) {
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

        setResult({
          userId,
          status: allowed ? "allowed" : "denied",
        });
      })
      .catch(() => {
        if (!active) return;

        setResult({
          userId,
          status: "error",
        });
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, userId]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const status: AccessState | "loading" =
    result !== null && result.userId === userId ? result.status : "loading";

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
        Não foi possível verificar as permissões do catálogo. Atualize a página
        para tentar novamente.
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
