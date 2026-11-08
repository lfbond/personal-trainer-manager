
import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'

import {
  listExercisesController,
  createExerciseVariationController,
  getExerciseVariationController,
  updateExerciseVariationController,
  deleteExerciseVariationController,
  listExerciseImageReviewsController,
  reviewExerciseImageController,
  reviewExerciseImagesBatchController,
} from '../controllers/exercise.controller.js'

export const exerciseRoutes = Router()

// ============================================================
// AUTENTICAÇÃO
// ============================================================

// Todas as rotas exigem autenticação JWT.
exerciseRoutes.use(requireAuth)

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
  listExerciseImageReviewsController,
)

// Aprovar ou rejeitar imagens em lote.
exerciseRoutes.patch(
  '/images/reviews/batch',
  reviewExerciseImagesBatchController,
)

// Aprovar, rejeitar ou devolver uma imagem para revisão.
exerciseRoutes.patch(
  '/variations/:id/image-review',
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
