
import type { RequestHandler } from 'express'

import { AppError } from '../lib/app-error.js'
import { listExercisesQuerySchema } from '../schemas/exercise.schema.js'
import { listExercises } from '../services/exercise.service.js'
import { getTrainerContext } from '../services/trainer-context.service.js'
import { createExerciseVariationSchema } from '../schemas/exercise.schema.js'
import { createExerciseVariation } from '../services/exercise.service.js'

import { z } from 'zod'
import { updateExerciseVariationSchema } from '../schemas/exercise.schema.js'
import { getExerciseVariationById, updateExerciseVariation, deleteExerciseVariation} from '../services/exercise.service.js'

export const listExercisesController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const filters = listExercisesQuerySchema.parse(req.query)

  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  const exercises = await listExercises({
    trainerId,
    organizationId,
    filters,
  })

  res.status(200).json(exercises)
}


export const createExerciseVariationController: RequestHandler =
  async (req, res) => {
    const userId = res.locals.userId as string | undefined

    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401)
    }

    const data = createExerciseVariationSchema.parse(req.body)

    const { trainerId, organizationId } =
      await getTrainerContext(userId)

    const variation = await createExerciseVariation({
      trainerId,
      organizationId,
      data,
    })

    res.status(201).json(variation)
  }

  
export const getExerciseVariationController: RequestHandler =
  async (req, res) => {
    const userId = res.locals.userId as string | undefined
    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401)
    }

    const variationId = z.uuid().parse(req.params.id)
    const context = await getTrainerContext(userId)

    const variation = await getExerciseVariationById({
      variationId,
      ...context,
    })

    res.status(200).json(variation)
  }

export const updateExerciseVariationController: RequestHandler =
  async (req, res) => {
    const userId = res.locals.userId as string | undefined
    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401)
    }

    const variationId = z.uuid().parse(req.params.id)
    const data = updateExerciseVariationSchema.parse(req.body)
    const context = await getTrainerContext(userId)

    const variation = await updateExerciseVariation({
      variationId,
      ...context,
      data,
    })

    res.status(200).json(variation)
  }

export const deleteExerciseVariationController: RequestHandler =
  async (req, res) => {
    const userId = res.locals.userId as string | undefined
    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401)
    }

    const variationId = z.uuid().parse(req.params.id)
    const context = await getTrainerContext(userId)

    const result = await deleteExerciseVariation({
      variationId,
      ...context,
    })

    res.status(200).json(result)
  }
