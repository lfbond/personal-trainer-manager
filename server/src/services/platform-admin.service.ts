90
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'

type ReviewDecision = 'APPROVE' | 'REJECT'

export async function listPendingGlobalVariations() {
  return prisma.exerciseVariation.findMany({
    where: {
      trainerId: null,
      status: 'DRAFT',
    },
    include: {
      exercise: true,
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' },
    ],
  })
}

export async function reviewGlobalVariation({
  variationId,
  decision,
}: {
  variationId: string
  decision: ReviewDecision
}) {
  const nextStatus =
    decision === 'APPROVE' ? 'ACTIVE' : 'INACTIVE'

  const result = await prisma.exerciseVariation.updateMany({
    where: {
      id: variationId,
      trainerId: null,
      status: 'DRAFT',
    },
    data: {
      status: nextStatus,
    },
  })

  if (result.count === 0) {
    throw new AppError(
      'Variação global não encontrada ou já revisada.',
      409,
    )
  }

  return prisma.exerciseVariation.findUniqueOrThrow({
    where: {
      id: variationId,
    },
    include: {
      exercise: true,
    },
  })
}

export async function previewBulkApproval() {
  const where = {
    trainerId: null,
    status: 'DRAFT' as const,
    needsEditorialReview: false,
  }

  const [eligible, editorialPending] = await Promise.all([
    prisma.exerciseVariation.count({ where }),
    prisma.exerciseVariation.count({
      where: {
        trainerId: null,
        status: 'DRAFT',
        needsEditorialReview: true,
      },
    }),
  ])

  return {
    eligible,
    editorialPending,
  }
}

export async function approveEligibleGlobalVariations() {
  return prisma.exerciseVariation.updateMany({
    where: {
      trainerId: null,
      status: 'DRAFT',
      needsEditorialReview: false,
    },
    data: {
      status: 'ACTIVE',
    },
  })
}

