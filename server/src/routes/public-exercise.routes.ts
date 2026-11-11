
import { Router } from 'express'

import {
  listPublicExercisesController,
} from '../controllers/public-exercise.controller.js'

// ============================================================
// ROTAS PÚBLICAS — CATÁLOGO DE EXERCÍCIOS
// ============================================================

export const publicExerciseRoutes = Router()

// GET /public/exercises
// Permite consultar o catálogo global sem autenticação.
// Não disponibiliza operações de criação, edição ou exclusão.

publicExerciseRoutes.get(
  '/',
  listPublicExercisesController,
)
