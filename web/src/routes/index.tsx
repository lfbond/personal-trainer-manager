import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayouts";
import { ProtectedRoute } from "./ProtectedRoute";
import { PermissionRoute } from "./PermissionRoute";

import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Students } from "../pages/Students";
import { Exercises } from "../pages/Exercises";
import { Workouts } from "../pages/Workouts";
import { AdminExercises } from "../pages/AdminExercises";
import { AdminExerciseImages } from "../pages/AdminExerciseImages";
import { PublicDemo } from "../pages/PublicDemo";
import { PublicCatalog } from "../pages/PublicCatalog";
import { AcceptInvitation } from "../pages/AcceptInvitation";

import { AdminOrganizations } from "../pages/AdminOrganizations";
import { AdminOrganizationMembers } from "../pages/AdminOrganizationMembers";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/convite/:token",
    element: <AcceptInvitation />,
  },
  {
    path: "/demo",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <PublicDemo />,
      },
      {
        path: "students",
        element: <PublicDemo />,
      },
      {
        path: "exercises",
        element: <PublicCatalog />,
      },
      {
        path: "workouts",
        element: <PublicDemo />,
      },
      {
        path: "admin/exercises",
        element: <PublicDemo />,
      },
      {
        path: "admin/images",
        element: <PublicDemo />,
      },
      {
        path: "admin/organizations",
        element: <PublicDemo />,
      },
    ],
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
            element: <PermissionRoute permission="catalogReviewer" />,
            children: [
              {
                path: "admin/exercises",
                element: <AdminExercises />,
              },
            ],
          },
          {
            element: <PermissionRoute permission="platformAdmin" />,
            children: [
              {
                path: "admin/images",
                element: <AdminExerciseImages />,
              },
            ],
          },
          {
            element: <PermissionRoute permission="platformManager" />,
            children: [
              {
                path: "admin/organizations",
                element: <AdminOrganizations />,
              },
              {
                path: "admin/organizations/:organizationId",
                element: <AdminOrganizationMembers />,
              },
            ],
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
