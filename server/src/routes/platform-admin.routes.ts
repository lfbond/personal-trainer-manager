
import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'
import { requirePlatformOwner } from '../middlewares/platform-owner.middleware.js'
import { requireCatalogReviewer } from '../middlewares/catalog-review.middleware.js'

import {
  listPendingGlobalVariationsController,
  reviewGlobalVariationController,
  previewBulkApprovalController,
  approveEligibleGlobalVariationsController,
} from '../controllers/platform-admin.controller.js'

export const platformAdminRoutes = Router()

platformAdminRoutes.use(requireAuth)

// Consulta das variações pendentes.
// Permitida ao fundador e aos revisores autorizados.
platformAdminRoutes.get(
  '/exercise-variations',
  requireCatalogReviewer,
  listPendingGlobalVariationsController,
)

// Prévia da aprovação em massa.
// Permitida ao fundador e aos revisores autorizados.
platformAdminRoutes.get(
  '/exercise-variations/bulk-preview',
  requireCatalogReviewer,
  previewBulkApprovalController,
)

// Revisão individual de exercícios.
// Permitida ao fundador e aos revisores autorizados.
platformAdminRoutes.patch(
  '/exercise-variations/:id/status',
  requireCatalogReviewer,
  reviewGlobalVariationController,
)

// Aprovação em massa.
// Operação exclusiva do fundador da plataforma.
platformAdminRoutes.post(
  '/exercise-variations/bulk-approve',
  requirePlatformOwner,
  approveEligibleGlobalVariationsController,
)
