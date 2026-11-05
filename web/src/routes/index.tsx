import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayouts";
import { ProtectedRoute } from "./ProtectedRoute";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Students } from "../pages/Students";
import { Exercises } from "../pages/Exercises";
import { Workouts } from "../pages/Workouts";
import { AdminExercises } from "../pages/AdminExercises";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "students", element: <Students /> },
          { path: "exercises", element: <Exercises /> },
          { path: "workouts", element: <Workouts /> },
          {
            element: <AdminExercises />,
            children: [
              {
                path: "admin/exercises",
                element: (
                  <div className="rounded-xl border border-border-default bg-surface p-6">
                    <h1 className="text-2xl font-bold text-text-primary">
                      Administração de exercícios
                    </h1>

                    <p className="mt-2 text-text-secondary">
                      Painel de revisão e aprovação do catálogo global.
                    </p>
                  </div>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
