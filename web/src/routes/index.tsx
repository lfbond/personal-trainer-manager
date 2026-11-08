import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayouts";
import { ProtectedRoute } from "./ProtectedRoute";

import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Students } from "../pages/Students";
import { Exercises } from "../pages/Exercises";
import { Workouts } from "../pages/Workouts";
import { AdminExercises } from "../pages/AdminExercises";
import { AdminExerciseImages } from "../pages/AdminExerciseImages";

import { AdminOrganizations } from "../pages/AdminOrganizations";
import { AdminOrganizationMembers } from "../pages/AdminOrganizationMembers";

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
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "students",
            element: <Students />,
          },
          {
            path: "exercises",
            element: <Exercises />,
          },
          {
            path: "workouts",
            element: <Workouts />,
          },
          {
            path: "admin/exercises",
            element: <AdminExercises />,
          },
          {
            path: "admin/images",
            element: <AdminExerciseImages />,
          },
          {
            path: "admin/organizations",
            element: <AdminOrganizations />,
          },
          {
            path: "admin/organizations/:organizationId",
            element: <AdminOrganizationMembers />,
          },
          {
            path: "organizations/:organizationId",
            element: <AdminOrganizationMembers />,
          },
        ],
      },
    ],
  },
]);
