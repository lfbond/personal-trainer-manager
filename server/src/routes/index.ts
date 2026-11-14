
import { Router } from 'express'

import { healthRoutes } from './health.routes.js'
import { databaseHealthRoutes } from './database-health.routes.js'
import { authRoutes } from './auth.routes.js'
import { studentRoutes } from './student.routes.js'
import { exerciseRoutes } from './exercise.routes.js'
import { platformAdminRoutes } from './platform-admin.routes.js'
import { workoutRoutes } from './workout.routes.js'
import { publicExerciseRoutes } from './public-exercise.routes.js'
import { exerciseEditorialRoutes} from './exercise-editorial.routes.js'

import {
  ownerInvitationRoutes,
} from './organization-invitations.routes.js'

import {
  platformOrganizationRoutes,
  organizationManagementRoutes,
} from './organization-management.routes.js'

import {
  organizationContextMiddleware,
} from '../middlewares/organization-context.middleware.js'

export const routes = Router()

// ============================================================
// ROTAS DE SAÚDE
// ============================================================

routes.use('/health', healthRoutes)
routes.use('/database-health', databaseHealthRoutes)

// ============================================================
// AUTENTICAÇÃO
// ============================================================

routes.use('/auth', authRoutes)

// Catálogo público — não exige autenticação.
routes.use('/public/exercises', publicExerciseRoutes)

routes.use('/exercises/editorial', exerciseEditorialRoutes,)

// Convites de proprietários de organizações.
routes.use('/admin/invitations', ownerInvitationRoutes)

// ============================================================
// CONTEXTO ORGANIZACIONAL
// ============================================================

// Disponibiliza a organização selecionada para as rotas seguintes.
routes.use(organizationContextMiddleware)

// ============================================================
// ROTAS FUNCIONAIS
// ============================================================

routes.use('/students', studentRoutes)
routes.use('/exercises', exerciseRoutes)
routes.use('/workouts', workoutRoutes)

// ============================================================
// ADMINISTRAÇÃO DA PLATAFORMA
// ============================================================

routes.use('/admin', platformAdminRoutes)

routes.use(
  '/admin/organizations',
  platformOrganizationRoutes,
)

// ============================================================
// GERENCIAMENTO DE ORGANIZAÇÕES
// ============================================================

routes.use(
  '/organizations',
  organizationManagementRoutes,
)
