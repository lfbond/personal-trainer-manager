
import type { RequestHandler } from 'express'

import { listPublicExercises } from '../services/public-exercise.service.js'

// ============================================================
// CATÁLOGO PÚBLICO DE EXERCÍCIOS
// ============================================================

// Lista somente exercícios globais disponíveis ao público.
// Não exige autenticação e não modifica o banco de dados.

export const listPublicExercisesController: RequestHandler =
  async (_req, res) => {
    const exercises = await listPublicExercises()

    res.status(200).json(exercises)
  }
