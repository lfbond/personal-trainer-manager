import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayouts";
import { Dashboard } from "../pages/Dashboard";
import { Students } from "../pages/Students";
import { Exercises } from "../pages/Exercises";
import { Workouts } from "../pages/Workouts";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppLayout />,

        children: [
            {
                index: true,
                element: <Dashboard />
            },

            {
                path: '/students',
                element: <Students />,
            },
            {
                path: '/exercises',
                element: <Exercises />,
            },
            {
                path: '/workouts',
                element: <Workouts />,
            },
        ]
    }
])