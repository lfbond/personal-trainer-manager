
import {
  ExerciseImageProposalAction,
  ExerciseImageProposalStatus,
  Prisma,
} from '../generated/prisma/client.js'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'

type ImageAction = 'ADD' | 'REPLACE' | 'REMOVE'

interface CreateProposalInput {
  userId: string
  variationId: string
  imageUrl: string | null
}

interface ReviewProposalInput {
  userId: string
  proposalId: string
  decision: 'APPROVED' | 'REJECTED'
  notes?: string | null
}

const localImagePathPattern =
  /^\/exercises\/[a-zA-Z0-9_/-]+\.(?:jpg|jpeg|png|webp)$/i

function normalizeImageUrl(
  value: string | null,
): string | null {
  if (value === null) return null

  const trimmed = value.trim()

  if (!trimmed || trimmed.length > 2048) {
    throw new AppError(
      'Informe uma imagem válida.',
      400,
    )
  }

  if (localImagePathPattern.test(trimmed)) {
    if (
      trimmed.includes('..') ||
      trimmed.includes('//')
    ) {
      throw new AppError(
        'Caminho de imagem inválido.',
        400,
      )
    }

    return trimmed
  }

  try {
    const url = new URL(trimmed)

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      throw new Error('Protocolo inválido')
    }

    return url.toString()
  } catch {
    throw new AppError(
      'Use uma URL HTTP/HTTPS ou um caminho /exercises/ válido.',
      400,
    )
  }
}

function getAction(
  previousUrl: string | null,
  nextUrl: string | null,
): ImageAction {
  if (previousUrl === nextUrl) {
    throw new AppError(
      'A imagem proposta é igual à imagem atual.',
      400,
    )
  }

  if (nextUrl === null) return 'REMOVE'
  if (previousUrl === null) return 'ADD'

  return 'REPLACE'
}

async function ensureImagePermission(
  userId: string,
  permission: 'propose' | 'manage' | 'approve',
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      canProposeExerciseImages: true,
      canManageExerciseImages: true,
      canApproveExerciseImages: true,
    },
  })

  if (!user?.isActive) {
    throw new AppError(
      'Usuário sem acesso ativo.',
      403,
    )
  }

  const allowed =
    permission === 'propose'
      ? user.canProposeExerciseImages
      : permission === 'manage'
        ? user.canManageExerciseImages
        : user.canApproveExerciseImages

  if (!allowed) {
    throw new AppError(
      'Permissão insuficiente para gerenciar imagens.',
      403,
    )
  }
}

export async function createImageProposal({
  userId,
  variationId,
  imageUrl,
}: CreateProposalInput) {
  await ensureImagePermission(userId, 'propose')

  const normalizedUrl = normalizeImageUrl(imageUrl)

  return prisma.$transaction(
    async (tx) => {
      const variation =
        await tx.exerciseVariation.findFirst({
          where: {
            id: variationId,
            trainerId: null,
          },
          select: {
            id: true,
            imageUrl: true,
          },
        })

      if (!variation) {
        throw new AppError(
          'Variação global não encontrada.',
          404,
        )
      }

      const pending =
        await tx.exerciseImageProposal.findFirst({
          where: {
            exerciseVariationId: variationId,
            status: 'PENDING',
          },
        })

      if (pending) {
        throw new AppError(
          'Já existe uma proposta pendente para esta variação.',
          409,
        )
      }

      const action = getAction(
        variation.imageUrl,
        normalizedUrl,
      )

      return tx.exerciseImageProposal.create({
        data: {
          exerciseVariationId: variationId,
          proposedById: userId,
          action: action as ExerciseImageProposalAction,
          previousImageUrl: variation.imageUrl,
          proposedImageUrl: normalizedUrl,
          status: 'PENDING',
        },
      })
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  )
}

export async function listImageProposals(
  userId: string,
  status?: ExerciseImageProposalStatus,
) {
  await ensureImagePermission(userId, 'approve')

  return prisma.exerciseImageProposal.findMany({
    where: status ? { status } : undefined,
    include: {
      exerciseVariation: {
        select: {
          id: true,
          name: true,
          code: true,
          imageUrl: true,
          exercise: {
            select: {
              name: true,
            },
          },
        },
      },
      proposedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })
}

export async function reviewImageProposal({
  userId,
  proposalId,
  decision,
  notes,
}: ReviewProposalInput) {
  await ensureImagePermission(userId, 'approve')

  if (
    decision === 'REJECTED' &&
    !notes?.trim()
  ) {
    throw new AppError(
      'Informe o motivo da rejeição.',
      400,
    )
  }

  return prisma.$transaction(
    async (tx) => {
      const proposal =
        await tx.exerciseImageProposal.findUnique({
          where: { id: proposalId },
        })

      if (!proposal) {
        throw new AppError(
          'Proposta não encontrada.',
          404,
        )
      }

      if (proposal.status !== 'PENDING') {
        throw new AppError(
          'Esta proposta já foi analisada.',
          409,
        )
      }

      const variation =
        await tx.exerciseVariation.findFirst({
          where: {
            id: proposal.exerciseVariationId,
            trainerId: null,
          },
          select: {
            id: true,
            imageUrl: true,
          },
        })

      if (!variation) {
        throw new AppError(
          'Variação global não encontrada.',
          404,
        )
      }

      if (decision === 'APPROVED') {
        if (
          variation.imageUrl !==
          proposal.previousImageUrl
        ) {
          throw new AppError(
            'A imagem oficial mudou desde a proposta. Revise antes de aprovar.',
            409,
          )
        }

        const updated =
          await tx.exerciseVariation.updateMany({
            where: {
              id: variation.id,
              trainerId: null,
              imageUrl: proposal.previousImageUrl,
            },
            data: {
              imageUrl: proposal.proposedImageUrl,
              imageReviewStatus:
                proposal.proposedImageUrl === null
                  ? 'PENDING'
                  : 'APPROVED',
              imageReviewNotes: null,
              imageReviewedAt:
                proposal.proposedImageUrl === null
                  ? null
                  : new Date(),
            },
          })

        if (updated.count !== 1) {
          throw new AppError(
            'A imagem foi alterada durante a aprovação.',
            409,
          )
        }
      }

      const updatedProposal =
        await tx.exerciseImageProposal.updateMany({
          where: {
            id: proposalId,
            status: 'PENDING',
          },
          data: {
            status: decision,
            reviewedById: userId,
            reviewedAt: new Date(),
            reviewNotes: notes?.trim() || null,
          },
        })

      if (updatedProposal.count !== 1) {
        throw new AppError(
          'Esta proposta já foi analisada.',
          409,
        )
      }

      return tx.exerciseImageProposal.findUniqueOrThrow({
        where: { id: proposalId },
      })
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  )
}

export async function updateOfficialExerciseImage({
  userId,
  variationId,
  imageUrl,
}: CreateProposalInput) {
  await ensureImagePermission(userId, 'manage')

  const normalizedUrl = normalizeImageUrl(imageUrl)

  return prisma.$transaction(
    async (tx) => {
      const variation =
        await tx.exerciseVariation.findFirst({
          where: {
            id: variationId,
            trainerId: null,
          },
          select: {
            id: true,
            imageUrl: true,
          },
        })

      if (!variation) {
        throw new AppError(
          'Variação global não encontrada.',
          404,
        )
      }

      if (variation.imageUrl === normalizedUrl) {
        return tx.exerciseVariation.findUniqueOrThrow({
          where: { id: variationId },
        })
      }

      const updatedCount =
        await tx.exerciseVariation.updateMany({
          where: {
            id: variationId,
            trainerId: null,
            imageUrl: variation.imageUrl,
          },
          data: {
            imageUrl: normalizedUrl,
            imageReviewStatus:
              normalizedUrl === null
                ? 'PENDING'
                : 'APPROVED',
            imageReviewNotes: null,
            imageReviewedAt:
              normalizedUrl === null
                ? null
                : new Date(),
          },
        })

      if (updatedCount.count !== 1) {
        throw new AppError(
          'A imagem foi alterada durante a atualização.',
          409,
        )
      }

      await tx.exerciseImageProposal.updateMany({
        where: {
          exerciseVariationId: variationId,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          reviewedById: userId,
          reviewedAt: new Date(),
          reviewNotes:
            'Proposta encerrada após alteração direta da imagem oficial.',
        },
      })

      return tx.exerciseVariation.findUniqueOrThrow({
        where: { id: variationId },
      })
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  )
}
