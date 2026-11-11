import { Router } from 'express'

import { healthRoutes } from './health.routes.js'
import { databaseHealthRoutes } from './database-health.routes.js'
import { authRoutes } from './auth.routes.js'
import { studentRoutes } from './student.routes.js'
import { exerciseRoutes } from './exercise.routes.js'
import { platformAdminRoutes } from './platform-admin.routes.js'
import { workoutRoutes } from './workout.routes.js'
import { publicExerciseRoutes } from './public-exercise.routes.js'

import {
  platformOrganizationRoutes,
  organizationManagementRoutes,
} from './organization-management.routes.js'

import { organizationContextMiddleware } from '../middlewares/organization-context.middleware.js'

export const routes = Router()

routes.use('/health', healthRoutes)
routes.use('/database-health', databaseHealthRoutes)

routes.use('/auth', authRoutes)

// Catálogo público de exercícios — acesso sem autenticação.
routes.use('/public/exercises', publicExerciseRoutes)

// Disponibiliza a organização selecionada para as rotas seguintes.
routes.use(organizationContextMiddleware)

routes.use('/students', studentRoutes)
routes.use('/exercises', exerciseRoutes)
routes.use('/workouts', workoutRoutes)

routes.use('/admin', platformAdminRoutes)

routes.use(
  '/admin/organizations',
  platformOrganizationRoutes,
)

routes.use(
  '/organizations',
  organizationManagementRoutes,
)