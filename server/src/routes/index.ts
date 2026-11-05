import { Router } from 'express'

import { healthRoutes } from './health.routes.js'
import { databaseHealthRoutes } from './database-health.routes.js'
import { authRoutes } from './auth.routes.js'
import { studentRoutes } from './student.routes.js'
import { exerciseRoutes } from './exercise.routes.js'
import { platformAdminRoutes } from './platform-admin.routes.js'
import { workoutRoutes } from './workout.routes.js'

export const routes = Router()

routes.use('/health', healthRoutes)
routes.use('/database-health', databaseHealthRoutes)
routes.use('/auth', authRoutes)
routes.use('/students', studentRoutes)
routes.use('/exercises', exerciseRoutes)
routes.use('/workouts', workoutRoutes)

// Administração global da plataforma
routes.use('/admin', platformAdminRoutes)
