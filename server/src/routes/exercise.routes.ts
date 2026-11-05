import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'
import { listExercisesController, createExerciseVariationController, getExerciseVariationController, updateExerciseVariationController, deleteExerciseVariationController} from '../controllers/exercise.controller.js'

export const exerciseRoutes = Router()

// Todas as rotas exigem autenticação JWT
exerciseRoutes.use(requireAuth)

// Listar exercícios com pesquisa e filtros
exerciseRoutes.get('/', listExercisesController)

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