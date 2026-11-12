
import type { RequestHandler } from 'express'
import { z } from 'zod'

import { AppError } from '../lib/app-error.js'

import {
  listExercisesQuerySchema,
  createExerciseVariationSchema,
  updateExerciseVariationSchema,
} from '../schemas/exercise.schema.js'

import {
  listExercises,
  createExerciseVariation,
  getExerciseVariationById,
  updateExerciseVariation,
  deleteExerciseVariation,
  listExerciseImageReviews,
  reviewExerciseImage,
  reviewExerciseImagesBatch,
} from '../services/exercise.service.js'

import {
  getTrainerContext,
  getCatalogReviewerContext,
} from '../services/trainer-context.service.js'

// ============================================================
// SCHEMAS DE REVISÃO DE IMAGENS
// ============================================================

const imageReviewStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
])

const listImageReviewsQuerySchema = z.object({
  status: imageReviewStatusSchema.optional(),
  onlyWithoutImage: z.enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional(),
  search: z.string().trim().max(150).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
}).strict()

const reviewImageBodySchema = z.object({
  status: imageReviewStatusSchema,
  notes: z.string().trim().max(2000).nullish(),
}).strict().superRefine((data, ctx) => {
  if (data.status === 'REJECTED' && !data.notes) {
    ctx.addIssue({
      code: 'custom',
      path: ['notes'],
      message: 'Informe o motivo da rejeição.',
    })
  }
})

const batchReviewImagesBodySchema =
  reviewImageBodySchema.safeExtend({
    variationIds: z.array(z.uuid())
      .min(1)
      .max(266)
      .refine(
        ids => new Set(ids).size === ids.length,
        'A lista contém IDs duplicados.',
      ),
  })

// ============================================================
// AUTENTICAÇÃO E CONTEXTO
// ============================================================

function getAuthenticatedUserId(
  res: Parameters<RequestHandler>[1],
) {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError(
      'Usuário não autenticado.',
      401,
    )
  }

  return userId
}

async function getAuthenticatedTrainerContext(
  res: Parameters<RequestHandler>[1],
) {
  return getTrainerContext(getAuthenticatedUserId(res))
}

async function getAuthenticatedReviewerContext(
  res: Parameters<RequestHandler>[1],
) {
  return getCatalogReviewerContext(
    getAuthenticatedUserId(res),
  )
}

// ============================================================
// LISTAR EXERCÍCIOS
// ============================================================

export const listExercisesController: RequestHandler =
  async (req, res) => {
    const filters = listExercisesQuerySchema.parse(req.query)

    const context =
      await getAuthenticatedTrainerContext(res)

    const exercises = await listExercises({
      ...context,
      filters,
    })

    res.status(200).json(exercises)
  }

// ============================================================
// CRIAR VARIAÇÃO
// ============================================================

export const createExerciseVariationController:
  RequestHandler = async (req, res) => {
    const data =
      createExerciseVariationSchema.parse(req.body)

    const context =
      await getAuthenticatedTrainerContext(res)

    const variation = await createExerciseVariation({
      ...context,
      data,
    })

    res.status(201).json(variation)
  }

// ============================================================
// CONSULTAR VARIAÇÃO
// ============================================================

export const getExerciseVariationController:
  RequestHandler = async (req, res) => {
    const variationId = z.uuid().parse(req.params.id)

    const context =
      await getAuthenticatedTrainerContext(res)

    const variation = await getExerciseVariationById({
      variationId,
      ...context,
    })

    res.status(200).json(variation)
  }

// ============================================================
// ATUALIZAR VARIAÇÃO
// ============================================================

export const updateExerciseVariationController:
  RequestHandler = async (req, res) => {
    const variationId = z.uuid().parse(req.params.id)

    const data =
      updateExerciseVariationSchema.parse(req.body)

    const context =
      await getAuthenticatedTrainerContext(res)

    const variation = await updateExerciseVariation({
      variationId,
      ...context,
      data,
    })

    res.status(200).json(variation)
  }

// ============================================================
// DESATIVAR VARIAÇÃO
// ============================================================

export const deleteExerciseVariationController:
  RequestHandler = async (req, res) => {
    const variationId = z.uuid().parse(req.params.id)

    const context =
      await getAuthenticatedTrainerContext(res)

    const result = await deleteExerciseVariation({
      variationId,
      ...context,
    })

    res.status(200).json(result)
  }

// ============================================================
// LISTAR IMAGENS PARA REVISÃO
// ============================================================

export const listExerciseImageReviewsController:
  RequestHandler = async (req, res) => {
    const filters =
      listImageReviewsQuerySchema.parse(req.query)

    const context =
      await getAuthenticatedReviewerContext(res)

    const result = await listExerciseImageReviews({
      ...context,
      ...filters,
    })

    res.status(200).json(result)
  }

// ============================================================
// APROVAR / REJEITAR UMA IMAGEM
// ============================================================

export const reviewExerciseImageController:
  RequestHandler = async (req, res) => {
    const variationId = z.uuid().parse(req.params.id)

    const data =
      reviewImageBodySchema.parse(req.body)

    const context =
      await getAuthenticatedReviewerContext(res)

    const result = await reviewExerciseImage({
      ...context,
      variationId,
      ...data,
    })

    res.status(200).json(result)
  }

// ============================================================
// APROVAR / REJEITAR IMAGENS EM LOTE
// ============================================================

export const reviewExerciseImagesBatchController:
  RequestHandler = async (req, res) => {
    const data =
      batchReviewImagesBodySchema.parse(req.body)

    const context =
      await getAuthenticatedReviewerContext(res)

    const result = await reviewExerciseImagesBatch({
      ...context,
      ...data,
    })

    res.status(200).json(result)
  }