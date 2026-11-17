import { Router, raw } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'

import {
  requireCatalogReader,
  requireCatalogManager,
  requireCatalogImageManager,
  requireCatalogImageProposer,
  requireCatalogImageApprover,
} from '../middlewares/catalog-permissions.middleware.js'

import {
  exerciseCatalogListRoutes,
} from './exercise-catalog-list.routes.js'

import {
  listExercisesController,
  createExerciseVariationController,
  getExerciseVariationController,
  updateExerciseVariationController,
  deleteExerciseVariationController,
  listExerciseImageReviewsController,
  reviewExerciseImageController,
  reviewExerciseImagesBatchController,
  createGlobalExerciseController,
  getGlobalExerciseController,
  updateGlobalExerciseController,
  createGlobalVariationController,
  updateGlobalVariationController,
} from '../controllers/exercise.controller.js'

import {
  createImageProposalController,
  listImageProposalsController,
  reviewImageProposalController,
  updateOfficialImageController,
} from '../controllers/exercise-image-proposals.controller.js'

import {
  getExerciseImagePermissionsController,
} from '../controllers/exercise-image-permissions.controller.js'

import {
  uploadExerciseImageController,
} from '../controllers/exercise-image-upload.controller.js'

export const exerciseRoutes = Router()

exerciseRoutes.use(requireAuth)

// ============================================================
// CATÁLOGO GLOBAL
// ============================================================

exerciseRoutes.use(
  '/catalog',
  exerciseCatalogListRoutes,
)

exerciseRoutes.post(
  '/catalog',
  requireCatalogManager,
  createGlobalExerciseController,
)

exerciseRoutes.get(
  '/catalog/:id',
  requireCatalogReader,
  getGlobalExerciseController,
)

exerciseRoutes.patch(
  '/catalog/:id',
  requireCatalogManager,
  updateGlobalExerciseController,
)

exerciseRoutes.post(
  '/catalog/variations',
  requireCatalogManager,
  createGlobalVariationController,
)

exerciseRoutes.patch(
  '/catalog/variations/:id',
  requireCatalogManager,
  updateGlobalVariationController,
)

// ============================================================
// PERMISSÕES
// ============================================================

exerciseRoutes.get(
  '/images/permissions',
  getExerciseImagePermissionsController,
)

// ============================================================
// UPLOAD DE IMAGENS
// ============================================================

exerciseRoutes.post(
  '/images/variations/:variationId/upload',
  requireCatalogImageProposer,
  raw({
    type: [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    limit: '5mb',
  }),
  uploadExerciseImageController,
)

// ============================================================
// PROPOSTAS
// ============================================================

exerciseRoutes.post(
  '/images/variations/:variationId/proposals',
  requireCatalogImageProposer,
  createImageProposalController,
)

exerciseRoutes.get(
  '/images/proposals',
  requireCatalogImageApprover,
  listImageProposalsController,
)

exerciseRoutes.patch(
  '/images/proposals/:proposalId/review',
  requireCatalogImageApprover,
  reviewImageProposalController,
)

exerciseRoutes.patch(
  '/images/variations/:variationId/official',
  requireCatalogImageManager,
  updateOfficialImageController,
)

// ============================================================
// REVISÃO DE IMAGENS EXISTENTE
// ============================================================

exerciseRoutes.get(
  '/images/reviews',
  requireCatalogReader,
  listExerciseImageReviewsController,
)

exerciseRoutes.patch(
  '/images/reviews/batch',
  requireCatalogImageApprover,
  reviewExerciseImagesBatchController,
)

exerciseRoutes.patch(
  '/variations/:id/image-review',
  requireCatalogImageApprover,
  reviewExerciseImageController,
)

// ============================================================
// EXERCÍCIOS
// ============================================================

exerciseRoutes.get(
  '/',
  listExercisesController,
)

exerciseRoutes.post(
  '/variations',
  createExerciseVariationController,
)

exerciseRoutes.get(
  '/variations/:id',
  getExerciseVariationController,
)

exerciseRoutes.patch(
  '/variations/:id',
  updateExerciseVariationController,
)

exerciseRoutes.delete(
  '/variations/:id',
  deleteExerciseVariationController,
)