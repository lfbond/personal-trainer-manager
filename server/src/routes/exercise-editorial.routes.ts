import { Router, type RequestHandler } from 'express'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { isPlatformOwner } from '../lib/platform-owner.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { requireCatalogReader } from '../middlewares/catalog-permissions.middleware.js'

export const exerciseEditorialRoutes = Router()

exerciseEditorialRoutes.use(requireAuth)

// ============================================================
// AUTENTICAÇÃO
// ============================================================

function authenticatedUserId(
  res: Parameters<RequestHandler>[1],
): string {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  return userId
}

// ============================================================
// PERMISSÃO DE AUDITORIA CIENTÍFICA
// ============================================================
// Administradores não recebem automaticamente a permissão
// de aprovação científica.
//
// Esta permissão é exclusiva para operações de escrita:
// - Aprovação;
// - Rejeição;
// - Suspensão;
// - Reativação.
//
// As consultas utilizam requireCatalogReader.

const requireScientificReviewer: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const userId = authenticatedUserId(res)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        canReviewExercises: true,
      },
    })

    if (!user?.isActive || !user.canReviewExercises) {
      throw new AppError(
        'Operação exclusiva de um auditor científico autorizado.',
        403,
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}

// ============================================================
// VALIDAÇÕES
// ============================================================

const idSchema = z.uuid()

const queueQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
}).strict()

const moderationBodySchema = z.object({
  reason: z.string().trim().min(10).max(3000),
  scientificReferences: z.string()
    .trim()
    .max(5000)
    .nullish(),
}).strict()

// ============================================================
// FILA DE REVISÃO CIENTÍFICA
// GET /exercises/editorial/queue
// ============================================================
//
// CORREÇÃO:
// Usuários com permissão catalog:read podem consultar
// a fila sem receber autorização para aprovar ou rejeitar.

exerciseEditorialRoutes.get(
  '/queue',
  requireCatalogReader,
  async (req, res) => {
    const filters = queueQuerySchema.parse(req.query)

    const where = {
      status: 'DRAFT' as const,
      needsEditorialReview: true,
      ...(filters.search && {
        OR: [
          {
            name: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          },
          {
            code: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    }

    const [total, variations] = await prisma.$transaction([
      prisma.exerciseVariation.count({ where }),
      prisma.exerciseVariation.findMany({
        where,
        include: {
          exercise: {
            select: {
              id: true,
              code: true,
              name: true,
              muscleGroup: true,
            },
          },
          trainer: {
            select: {
              id: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
        take: filters.take,
        skip: filters.skip,
      }),
    ])

    res.status(200).json({
      total,
      take: filters.take,
      skip: filters.skip,
      variations,
    })
  },
)

// ============================================================
// APROVAR VARIAÇÃO
// PATCH /exercises/editorial/variations/:id/approve
// ============================================================
//
// Permissão exclusiva de auditor científico preservada.

exerciseEditorialRoutes.patch(
  '/variations/:id/approve',
  requireScientificReviewer,
  async (req, res) => {
    const variationId = idSchema.parse(req.params.id)
    const moderatorId = authenticatedUserId(res)

    const result = await prisma.$transaction(async tx => {
      const openSuspension =
        await tx.exerciseModeration.findFirst({
          where: {
            exerciseVariationId: variationId,
            action: 'SAFETY_SUSPENSION',
            status: 'OPEN',
          },
          select: { id: true },
        })

      if (openSuspension) {
        throw new AppError(
          'Existe uma suspensão de segurança em aberto.',
          409,
        )
      }

      const updated = await tx.exerciseVariation.updateMany({
        where: {
          id: variationId,
          status: 'DRAFT',
          needsEditorialReview: true,
        },
        data: {
          status: 'ACTIVE',
          needsEditorialReview: false,
        },
      })

      if (updated.count !== 1) {
        throw new AppError(
          'Variação não encontrada ou indisponível para aprovação.',
          409,
        )
      }

      const moderation = await tx.exerciseModeration.create({
        data: {
          exerciseVariationId: variationId,
          moderatorId,
          action: 'EDITORIAL_APPROVAL',
          status: 'RESOLVED',
          reason: 'Exercício aprovado após revisão científica.',
          previousStatus: 'DRAFT',
          newStatus: 'ACTIVE',
          resolvedAt: new Date(),
        },
      })

      const variation =
        await tx.exerciseVariation.findUniqueOrThrow({
          where: { id: variationId },
        })

      return {
        message: 'Exercício aprovado após revisão científica.',
        variation,
        moderation,
      }
    })

    res.status(200).json(result)
  },
)

// ============================================================
// REJEITAR VARIAÇÃO
// POST /exercises/editorial/variations/:id/reject
// ============================================================
//
// Permissão exclusiva de auditor científico preservada.

exerciseEditorialRoutes.post(
  '/variations/:id/reject',
  requireScientificReviewer,
  async (req, res) => {
    const variationId = idSchema.parse(req.params.id)
    const moderatorId = authenticatedUserId(res)
    const data = moderationBodySchema.parse(req.body)

    const result = await prisma.$transaction(async tx => {
      const updated = await tx.exerciseVariation.updateMany({
        where: {
          id: variationId,
          status: 'DRAFT',
          needsEditorialReview: true,
        },
        data: {
          status: 'DRAFT',
          needsEditorialReview: false,
        },
      })

      if (updated.count !== 1) {
        throw new AppError(
          'Exercício não está disponível para rejeição.',
          409,
        )
      }

      const moderation = await tx.exerciseModeration.create({
        data: {
          exerciseVariationId: variationId,
          moderatorId,
          action: 'EDITORIAL_REJECTION',
          status: 'RESOLVED',
          reason: data.reason,
          scientificReferences:
            data.scientificReferences ?? null,
          previousStatus: 'DRAFT',
          newStatus: 'DRAFT',
          resolvedAt: new Date(),
        },
      })

      return {
        message: 'Exercício rejeitado e devolvido para correção.',
        moderation,
      }
    })

    res.status(200).json(result)
  },
)

// ============================================================
// REENVIAR VARIAÇÃO CORRIGIDA
// POST /exercises/editorial/variations/:id/resubmit
// ============================================================
//
// Não exige permissão científica.
// Exige responsabilidade sobre a variação.
//
// Global:
// - proprietário técnico ou administrador global ativo.
//
// Particular:
// - usuário vinculado ao treinador proprietário.
//
// Requisitos:
// - DRAFT;
// - fora da fila editorial;
// - última decisão relevante = rejeição;
// - atualização posterior à rejeição;
// - nenhuma suspensão de segurança em aberto.

exerciseEditorialRoutes.post(
  '/variations/:id/resubmit',
  async (req, res) => {
    const variationId = idSchema.parse(req.params.id)
    const userId = authenticatedUserId(res)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        isPlatformAdmin: true,
        trainer: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!user?.isActive) {
      throw new AppError(
        'Usuário sem acesso ativo.',
        403,
      )
    }

    const result = await prisma.$transaction(async tx => {
      const variation = await tx.exerciseVariation.findUnique({
        where: { id: variationId },
        select: {
          id: true,
          trainerId: true,
          status: true,
          needsEditorialReview: true,
          updatedAt: true,
        },
      })

      if (!variation) {
        throw new AppError(
          'Variação não encontrada.',
          404,
        )
      }

      if (variation.trainerId === null) {
        const canManageGlobal =
          isPlatformOwner(userId) ||
          user.isPlatformAdmin

        if (!canManageGlobal) {
          throw new AppError(
            'Somente gestores globais autorizados podem reenviar esta variação.',
            403,
          )
        }
      } else {
        if (
          !user.trainer ||
          user.trainer.id !== variation.trainerId
        ) {
          throw new AppError(
            'Você não possui permissão para reenviar esta variação.',
            403,
          )
        }
      }

      if (
        variation.status !== 'DRAFT' ||
        variation.needsEditorialReview
      ) {
        throw new AppError(
          'Exercício não está disponível para reenvio.',
          409,
        )
      }

      const openSuspension =
        await tx.exerciseModeration.findFirst({
          where: {
            exerciseVariationId: variationId,
            action: 'SAFETY_SUSPENSION',
            status: 'OPEN',
          },
          select: {
            id: true,
          },
        })

      if (openSuspension) {
        throw new AppError(
          'O exercício possui suspensão de segurança em aberto.',
          409,
        )
      }

      const lastDecision =
        await tx.exerciseModeration.findFirst({
          where: {
            exerciseVariationId: variationId,
            action: {
              in: [
                'EDITORIAL_REJECTION',
                'EDITORIAL_RESUBMISSION',
              ],
            },
          },
          orderBy: [
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
        })

      if (lastDecision?.action !== 'EDITORIAL_REJECTION') {
        throw new AppError(
          'Não existe rejeição pendente de correção.',
          409,
        )
      }

      if (
        variation.updatedAt.getTime() <=
        lastDecision.createdAt.getTime()
      ) {
        throw new AppError(
          'Corrija o exercício antes de solicitar uma nova revisão científica.',
          409,
        )
      }

      const updated = await tx.exerciseVariation.updateMany({
        where: {
          id: variationId,
          status: 'DRAFT',
          needsEditorialReview: false,
          updatedAt: variation.updatedAt,
        },
        data: {
          needsEditorialReview: true,
        },
      })

      if (updated.count !== 1) {
        throw new AppError(
          'O exercício foi alterado durante o reenvio. Atualize os dados e tente novamente.',
          409,
        )
      }

      const moderation = await tx.exerciseModeration.create({
        data: {
          exerciseVariationId: variationId,
          moderatorId: userId,
          action: 'EDITORIAL_RESUBMISSION',
          status: 'RESOLVED',
          reason: 'Exercício corrigido e reenviado para revisão científica.',
          previousStatus: 'DRAFT',
          newStatus: 'DRAFT',
          resolvedAt: new Date(),
        },
      })

      return {
        message: 'Exercício reenviado para revisão científica.',
        moderation,
      }
    })

    res.status(200).json(result)
  },
)

// ============================================================
// SUSPENDER POR SEGURANÇA
// POST /exercises/editorial/variations/:id/suspend
// ============================================================
//
// Permissão exclusiva de auditor científico preservada.

exerciseEditorialRoutes.post(
  '/variations/:id/suspend',
  requireScientificReviewer,
  async (req, res) => {
    const variationId = idSchema.parse(req.params.id)
    const moderatorId = authenticatedUserId(res)
    const data = moderationBodySchema.parse(req.body)

    const result = await prisma.$transaction(async tx => {
      const updated = await tx.exerciseVariation.updateMany({
        where: {
          id: variationId,
          status: 'ACTIVE',
          needsEditorialReview: false,
        },
        data: {
          status: 'INACTIVE',
          needsEditorialReview: true,
        },
      })

      if (updated.count !== 1) {
        throw new AppError(
          'Somente uma variação ativa e aprovada pode ser suspensa.',
          409,
        )
      }

      const moderation = await tx.exerciseModeration.create({
        data: {
          exerciseVariationId: variationId,
          moderatorId,
          action: 'SAFETY_SUSPENSION',
          status: 'OPEN',
          reason: data.reason,
          scientificReferences:
            data.scientificReferences ?? null,
          previousStatus: 'ACTIVE',
          newStatus: 'INACTIVE',
        },
      })

      return {
        message: 'Exercício suspenso por segurança.',
        moderation,
      }
    })

    res.status(200).json(result)
  },
)

// ============================================================
// REATIVAR APÓS REVISÃO CIENTÍFICA
// POST /exercises/editorial/variations/:id/reinstate
// ============================================================
//
// Permissão exclusiva de auditor científico preservada.

exerciseEditorialRoutes.post(
  '/variations/:id/reinstate',
  requireScientificReviewer,
  async (req, res) => {
    const variationId = idSchema.parse(req.params.id)
    const moderatorId = authenticatedUserId(res)
    const data = moderationBodySchema.parse(req.body)

    const result = await prisma.$transaction(async tx => {
      const suspension =
        await tx.exerciseModeration.findFirst({
          where: {
            exerciseVariationId: variationId,
            action: 'SAFETY_SUSPENSION',
            status: 'OPEN',
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

      if (!suspension) {
        throw new AppError(
          'Não existe suspensão de segurança aberta para esta variação.',
          409,
        )
      }

      const updated = await tx.exerciseVariation.updateMany({
        where: {
          id: variationId,
          status: 'INACTIVE',
          needsEditorialReview: true,
        },
        data: {
          status: 'ACTIVE',
          needsEditorialReview: false,
        },
      })

      if (updated.count !== 1) {
        throw new AppError(
          'A variação não está disponível para reativação.',
          409,
        )
      }

      const resolved = await tx.exerciseModeration.updateMany({
        where: {
          id: suspension.id,
          status: 'OPEN',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      })

      if (resolved.count !== 1) {
        throw new AppError(
          'Não foi possível concluir a suspensão anterior.',
          409,
        )
      }

      const moderation = await tx.exerciseModeration.create({
        data: {
          exerciseVariationId: variationId,
          moderatorId,
          action: 'SAFETY_REINSTATEMENT',
          status: 'RESOLVED',
          reason: data.reason,
          scientificReferences:
            data.scientificReferences ?? null,
          previousStatus: 'INACTIVE',
          newStatus: 'ACTIVE',
          resolvedAt: new Date(),
        },
      })

      return {
        message: 'Exercício reativado após revisão científica.',
        moderation,
      }
    })

    res.status(200).json(result)
  },
)

// ============================================================
// HISTÓRICO DE MODERAÇÃO
// GET /exercises/editorial/variations/:id/history
// ============================================================
//
// CORREÇÃO:
// Consulta disponível para usuários autorizados
// à leitura do catálogo.
//
// Não concede acesso às operações de moderação.

exerciseEditorialRoutes.get(
  '/variations/:id/history',
  requireCatalogReader,
  async (req, res) => {
    const variationId = idSchema.parse(req.params.id)

    const variation = await prisma.exerciseVariation.findUnique({
      where: { id: variationId },
      select: { id: true },
    })

    if (!variation) {
      throw new AppError(
        'Variação não encontrada.',
        404,
      )
    }

    const history = await prisma.exerciseModeration.findMany({
      where: {
        exerciseVariationId: variationId,
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    })

    res.status(200).json(history)
  },
)