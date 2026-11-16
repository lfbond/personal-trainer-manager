
import {
  Router,
  type RequestHandler,
} from 'express'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { isPlatformOwner } from '../lib/platform-owner.js'

import type { Prisma } from '../generated/prisma/client.js'

export const exerciseCatalogListRoutes = Router()

// ============================================================
// FILTROS DO CATÁLOGO GLOBAL
// ============================================================

const querySchema = z
  .object({
    search: z.string().trim().max(150).optional(),

    muscleGroup: z
      .enum([
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
      ])
      .optional(),

    status: z
      .enum([
        'DRAFT',
        'ACTIVE',
        'INACTIVE',
      ])
      .optional(),

    take: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(50),

    skip: z.coerce
      .number()
      .int()
      .min(0)
      .default(0),
  })
  .strict()

// ============================================================
// AUTORIZAÇÃO PARA CONSULTA DO CATÁLOGO
// ============================================================
//
// Permite consulta para:
// - Proprietário da plataforma
// - Administradores da plataforma
// - Revisores técnicos
// - Gestores de imagens
// - Proponentes de imagens
// - Aprovadores de imagens
//
// Esta autorização não permite criar, editar ou excluir
// exercícios e variações globais.
//
// As rotas de escrita continuam protegidas separadamente.
// ============================================================

const requireGlobalCatalogReader: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const userId = res.locals.userId as
      | string
      | undefined

    if (!userId) {
      res.status(401).json({
        message: 'Usuário não autenticado.',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        isActive: true,
        isPlatformAdmin: true,
        canReviewExercises: true,
        canManageExerciseImages: true,
        canProposeExerciseImages: true,
        canApproveExerciseImages: true,
      },
    })

    if (!user || !user.isActive) {
      res.status(403).json({
        message: 'Usuário sem acesso ativo.',
      })
      return
    }

    const allowed =
      isPlatformOwner(userId) ||
      user.isPlatformAdmin ||
      user.canReviewExercises ||
      user.canManageExerciseImages ||
      user.canProposeExerciseImages ||
      user.canApproveExerciseImages

    if (!allowed) {
      res.status(403).json({
        message:
          'Você não possui permissão para consultar o catálogo global.',
      })
      return
    }

    next()
  } catch (error) {
    next(error)
  }
}

// ============================================================
// LISTAGEM DO CATÁLOGO GLOBAL
// ============================================================

const listCatalogController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as
    | string
    | undefined

  if (!userId) {
    throw new AppError(
      'Usuário não autenticado.',
      401,
    )
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

  const [total, exercises] =
    await prisma.$transaction([
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

            include: {
              muscles: {
                include: {
                  muscle: true,
                },
              },
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

// ============================================================
// ROTAS
// ============================================================

exerciseCatalogListRoutes.get(
  '/',
  requireGlobalCatalogReader,
  listCatalogController,
)
