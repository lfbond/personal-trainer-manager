import { Router, type RequestHandler } from 'express'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { requireCatalogReviewer } from '../middlewares/catalog-review.middleware.js'

import type { Prisma } from '../generated/prisma/client.js'

export const exerciseCatalogListRoutes = Router()

const querySchema = z.object({
  search: z.string().trim().max(150).optional(),
  muscleGroup: z.enum([
    'CHEST',
    'BACK',
    'SHOULDERS',
    'BICEPS',
    'TRICEPS',
    'LEGS',
    'GLUTES',
    'CALVES',
    'CORE',
    'CARDIO',
    'FULL_BODY',
    'OTHER',
  ]).optional(),
  status: z.enum([
    'DRAFT',
    'ACTIVE',
    'INACTIVE',
  ]).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
}).strict()

const listCatalogController: RequestHandler = async (req, res) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const filters = querySchema.parse(req.query)

  const where: Prisma.ExerciseWhereInput = {
    ...(filters.muscleGroup && {
      muscleGroup: filters.muscleGroup,
    }),

    ...(filters.search && {
      OR: [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ],
    }),

    ...(filters.status && {
      variations: {
        some: {
          trainerId: null,
          status: filters.status,
        },
      },
    }),
  }

  const [total, exercises] = await prisma.$transaction([
    prisma.exercise.count({
      where,
    }),

    prisma.exercise.findMany({
      where,
      include: {
        variations: {
          where: {
            trainerId: null,
            ...(filters.status && {
              status: filters.status,
            }),
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: filters.take,
      skip: filters.skip,
    }),
  ])

  res.status(200).json({
    total,
    take: filters.take,
    skip: filters.skip,
    exercises,
  })
}

exerciseCatalogListRoutes.get(
  '/',
  requireCatalogReviewer,
  listCatalogController,
)