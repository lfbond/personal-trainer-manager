
import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'

import {
  requireCatalogReviewer,
} from '../middlewares/catalog-review.middleware.js'

import {
  requireCatalogManager,
} from '../middlewares/catalog-permissions.middleware.js'

import { exerciseCatalogListRoutes } from './exercise-catalog-list.routes.js'

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
  updateGlobalVariationController
} from '../controllers/exercise.controller.js'

export const exerciseRoutes = Router()

// Listagem administrativa do catálogo global.
exerciseRoutes.use(
  '/catalog',
  exerciseCatalogListRoutes,
)

// ============================================================
// AUTENTICAÇÃO
// ============================================================

// Todas as rotas exigem autenticação JWT.
exerciseRoutes.use(requireAuth)

// ============================================================
// CRUD EDITORIAL DO CATÁLOGO GLOBAL
// ============================================================

exerciseRoutes.post(
  '/catalog',
  requireCatalogManager,
  createGlobalExerciseController,
)

exerciseRoutes.get(
  '/catalog/:id',
  requireCatalogManager,
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
// CATÁLOGO DE EXERCÍCIOS
// ============================================================

// Listar exercícios com pesquisa e filtros.
exerciseRoutes.get(
  '/',
  listExercisesController,
)

// ============================================================
// REVISÃO DE IMAGENS DO CATÁLOGO GLOBAL
// ============================================================

// Listar imagens com filtros de revisão.
exerciseRoutes.get(
  '/images/reviews',
  requireCatalogReviewer,
  listExerciseImageReviewsController,
)

// Aprovar ou rejeitar imagens em lote.
exerciseRoutes.patch(
  '/images/reviews/batch',
  requireCatalogReviewer,
  reviewExerciseImagesBatchController,
)

// Aprovar, rejeitar ou devolver uma imagem para revisão.
exerciseRoutes.patch(
  '/variations/:id/image-review',
  requireCatalogReviewer,
  reviewExerciseImageController,
)

// ============================================================
// VARIAÇÕES DE EXERCÍCIOS
// ============================================================

// Criar uma variação.
exerciseRoutes.post(
  '/variations',
  createExerciseVariationController,
)

// Consultar uma variação pelo ID.
exerciseRoutes.get(
  '/variations/:id',
  getExerciseVariationController,
)

// Atualizar uma variação do treinador.
exerciseRoutes.patch(
  '/variations/:id',
  updateExerciseVariationController,
)

// Desativar uma variação do treinador.
exerciseRoutes.delete(
  '/variations/:id',
  deleteExerciseVariationController,
)