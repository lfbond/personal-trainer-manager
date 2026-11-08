
import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'
import { requirePlatformAdmin } from '../middlewares/platform-admin.middleware.js'

import {
  listPendingGlobalVariationsController,
  reviewGlobalVariationController,
  previewBulkApprovalController,
  approveEligibleGlobalVariationsController,
} from '../controllers/platform-admin.controller.js'

export const platformAdminRoutes = Router()

// Todas as rotas exigem autenticação JWT.
platformAdminRoutes.use(requireAuth)

// Somente administradores globais podem acessar estas rotas.
platformAdminRoutes.use(requirePlatformAdmin)

// Listar variações globais pendentes de revisão.
platformAdminRoutes.get(
  '/exercise-variations',
  listPendingGlobalVariationsController,
)

platformAdminRoutes.get(
  '/exercise-variations/bulk-preview',
  previewBulkApprovalController,
)

platformAdminRoutes.post(
  '/exercise-variations/bulk-approve',
  approveEligibleGlobalVariationsController,
)

// Aprovar ou rejeitar uma variação global.
platformAdminRoutes.patch(
  '/exercise-variations/:id/status',
  reviewGlobalVariationController,
)

