
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { verifyTrainerAccess } from './student.service.js'

import type {
  ListExercisesQueryInput,
  CreateExerciseInput,
  CreateExerciseVariationInput,
  UpdateExerciseVariationInput,
} from '../schemas/exercise.schema.js'

import type {
  ExerciseImageStatus,
  Prisma,
} from '../generated/prisma/client.js'

// ============================================================
// CONTROLE DE ACESSO
// ============================================================

async function ensureTrainerAccess(
  trainerId: string,
  organizationId: string,
) {
  const allowed = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!allowed) {
    throw new AppError(
      'Treinador sem permissão nesta organização.',
      403,
    )
  }
}


async function ensureCatalogAdminAccess(
  trainerId: string,
  organizationId: string,
) {
  await ensureTrainerAccess(trainerId, organizationId)

  const trainer = await prisma.trainer.findUnique({
    where: { id: trainerId },
    select: {
      user: {
        select: {
          isPlatformAdmin: true,
          canReviewExercises: true,
          isActive: true,
        },
      },
    },
  })

  if (
    !trainer?.user.isActive ||
    !(
      trainer.user.isPlatformAdmin ||
      trainer.user.canReviewExercises
    )
  ) {
    throw new AppError(
      'Acesso restrito aos revisores autorizados do catálogo.',
      403,
    )
  }
}


// ============================================================
// LISTAGEM DE EXERCÍCIOS
// ============================================================

interface ListExercisesParams {
  trainerId: string
  organizationId: string
  filters?: ListExercisesQueryInput
}

export async function listExercises({
  trainerId,
  organizationId,
  filters,
}: ListExercisesParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const variationFilter: Prisma.ExerciseVariationWhereInput = {
    status: 'ACTIVE',
    OR: [
      { trainerId: null },
      { trainerId },
    ],
    ...(filters?.category && {
      category: filters.category,
    }),
    ...(filters?.level && {
      level: filters.level,
    }),
  }

  return prisma.exercise.findMany({
    where: {
      ...(filters?.muscleGroup && {
        muscleGroup: filters.muscleGroup,
      }),

      ...(filters?.search && {
        name: {
          contains: filters.search,
          mode: 'insensitive',
        },
      }),

      ...(filters?.category || filters?.level
        ? {
            variations: {
              some: variationFilter,
            },
          }
        : {}),
    },

    include: {
      variations: {
        where: variationFilter,
      },
    },

    orderBy: {
      name: 'asc',
    },
  })
}

// ============================================================
// CADASTRO DE EXERCÍCIOS-BASE
// ============================================================

interface CreateExerciseParams {
  trainerId: string
  organizationId: string
  data: CreateExerciseInput
}

export async function createExercise({
  trainerId,
  organizationId,
  data,
}: CreateExerciseParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const existingExercise = await prisma.exercise.findUnique({
    where: { code: data.code },
  })

  if (existingExercise) {
    throw new AppError(
      'Já existe um exercício com este código.',
      409,
    )
  }

  return prisma.exercise.create({
    data: {
      code: data.code,
      name: data.name,
      muscleGroup: data.muscleGroup,
      description: data.description ?? null,
    },
  })
}

// ============================================================
// CADASTRO DE VARIAÇÕES
// ============================================================

interface CreateExerciseVariationParams {
  trainerId: string
  organizationId: string
  data: CreateExerciseVariationInput
}

export async function createExerciseVariation({
  trainerId,
  organizationId,
  data,
}: CreateExerciseVariationParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const exercise = await prisma.exercise.findUnique({
    where: { id: data.exerciseId },
    select: { id: true },
  })

  if (!exercise) {
    throw new AppError(
      'Exercício-base não encontrado.',
      404,
    )
  }

  const existingVariation =
    await prisma.exerciseVariation.findUnique({
      where: { code: data.code },
      select: { id: true },
    })

  if (existingVariation) {
    throw new AppError(
      'Já existe uma variação com este código.',
      409,
    )
  }

  return prisma.exerciseVariation.create({
    data: {
      exerciseId: data.exerciseId,
      trainerId,
      code: data.code,
      name: data.name,
      category: data.category,
      level: data.level,
      equipment: data.equipment ?? null,
      subgroup: data.subgroup ?? null,
      description: data.description ?? null,
      instructions: data.instructions ?? null,
      safetyNotes: data.safetyNotes ?? null,
      muscleExplanation:
        data.muscleExplanation ?? null,
      status: 'ACTIVE',
    },
  })
}

// ============================================================
// CONSULTAR VARIAÇÃO
// ============================================================

interface VariationParams {
  variationId: string
  trainerId: string
  organizationId: string
}

export async function getExerciseVariationById({
  variationId,
  trainerId,
  organizationId,
}: VariationParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const variation =
    await prisma.exerciseVariation.findFirst({
      where: {
        id: variationId,
        OR: [
          { trainerId: null },
          { trainerId },
        ],
      },
      include: {
        exercise: true,
        muscles: {
          include: { muscle: true },
        },
      },
    })

  if (!variation) {
    throw new AppError(
      'Variação não encontrada.',
      404,
    )
  }

  return variation
}

// ============================================================
// ATUALIZAR VARIAÇÃO DO TREINADOR
// ============================================================

interface UpdateVariationParams extends VariationParams {
  data: UpdateExerciseVariationInput
}

export async function updateExerciseVariation({
  variationId,
  trainerId,
  organizationId,
  data,
}: UpdateVariationParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const result =
    await prisma.exerciseVariation.updateMany({
      where: {
        id: variationId,
        trainerId,
      },
      data,
    })

  if (result.count === 0) {
    throw new AppError(
      'Variação não encontrada ou sem permissão.',
      404,
    )
  }

  return getExerciseVariationById({
    variationId,
    trainerId,
    organizationId,
  })
}

// ============================================================
// DESATIVAR VARIAÇÃO
// ============================================================

export async function deleteExerciseVariation({
  variationId,
  trainerId,
  organizationId,
}: VariationParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const variation =
    await prisma.exerciseVariation.findFirst({
      where: {
        id: variationId,
        trainerId,
      },
      select: {
        id: true,
        _count: {
          select: {
            workoutExercises: true,
          },
        },
      },
    })

  if (!variation) {
    throw new AppError(
      'Variação não encontrada ou sem permissão.',
      404,
    )
  }

  if (variation._count.workoutExercises > 0) {
    throw new AppError(
      'Esta variação está vinculada a fichas de treino.',
      409,
    )
  }

  await prisma.exerciseVariation.updateMany({
    where: {
      id: variationId,
      trainerId,
    },
    data: {
      status: 'INACTIVE',
    },
  })

  return {
    message: 'Variação desativada com sucesso.',
  }
}

// ============================================================
// REVISÃO DE IMAGENS — TIPOS
// ============================================================

type ReviewStatus = ExerciseImageStatus

interface ImageReviewAccess {
  trainerId: string
  organizationId: string
}

interface ListImageReviewsParams
  extends ImageReviewAccess {
  status?: ReviewStatus
  onlyWithoutImage?: boolean
  search?: string
  take?: number
  skip?: number
}

interface ReviewImageParams
  extends ImageReviewAccess {
  variationId: string
  status: ReviewStatus
  notes?: string | null
}

interface BatchReviewImagesParams
  extends ImageReviewAccess {
  variationIds: string[]
  status: ReviewStatus
  notes?: string | null
}

// ============================================================
// REVISÃO DE IMAGENS — VALIDAÇÕES
// ============================================================

function validateImageReview(
  status: ReviewStatus,
  notes?: string | null,
) {
  if (
    status !== 'PENDING' &&
    status !== 'APPROVED' &&
    status !== 'REJECTED'
  ) {
    throw new AppError(
      'Status de revisão de imagem inválido.',
      400,
    )
  }

  if (
    status === 'REJECTED' &&
    !notes?.trim()
  ) {
    throw new AppError(
      'Informe o motivo da rejeição da imagem.',
      400,
    )
  }

  if (notes && notes.length > 2000) {
    throw new AppError(
      'A observação deve ter no máximo 2000 caracteres.',
      400,
    )
  }
}

function imageReviewData(
  status: ReviewStatus,
  notes?: string | null,
) {
  return {
    imageReviewStatus: status,
    imageReviewNotes:
      status === 'REJECTED'
        ? notes?.trim() ?? null
        : null,
    imageReviewedAt:
      status === 'PENDING'
        ? null
        : new Date(),
  }
}

// ============================================================
// LISTAR IMAGENS PARA REVISÃO
// ============================================================

export async function listExerciseImageReviews({
  trainerId,
  organizationId,
  status,
  onlyWithoutImage = false,
  search,
  take = 50,
  skip = 0,
}: ListImageReviewsParams) {
  await ensureCatalogAdminAccess(
    trainerId,
    organizationId,
  )

  if (
    status &&
    status !== 'PENDING' &&
    status !== 'APPROVED' &&
    status !== 'REJECTED'
  ) {
    throw new AppError(
      'Filtro de status inválido.',
      400,
    )
  }

  if (
    !Number.isInteger(take) ||
    take < 1 ||
    take > 100 ||
    !Number.isInteger(skip) ||
    skip < 0
  ) {
    throw new AppError(
      'Paginação inválida.',
      400,
    )
  }

  const where: Prisma.ExerciseVariationWhereInput = {
    trainerId: null,

    ...(status && {
      imageReviewStatus: status,
    }),

    ...(onlyWithoutImage && {
      imageUrl: null,
    }),

    ...(search?.trim() && {
      OR: [
        {
          code: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
      ],
    }),
  }

  const [total, variations] = await prisma.$transaction([
    prisma.exerciseVariation.count({
      where,
    }),

    prisma.exerciseVariation.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        imageUrl: true,
        imageReviewStatus: true,
        imageReviewNotes: true,
        imageReviewedAt: true,
        status: true,
        equipment: true,
        category: true,
        level: true,
        exercise: {
          select: {
            id: true,
            code: true,
            name: true,
            muscleGroup: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
      take,
      skip,
    }),
  ])

  return {
    total,
    take,
    skip,
    variations,
  }
}

// ============================================================
// APROVAR OU REJEITAR UMA IMAGEM
// ============================================================

export async function reviewExerciseImage({
  trainerId,
  organizationId,
  variationId,
  status,
  notes,
}: ReviewImageParams) {
  await ensureCatalogAdminAccess(
    trainerId,
    organizationId,
  )

  validateImageReview(status, notes)

  const variation =
    await prisma.exerciseVariation.findFirst({
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

  if (
    status !== 'PENDING' &&
    !variation.imageUrl
  ) {
    throw new AppError(
      'Não é possível aprovar ou rejeitar uma imagem inexistente.',
      400,
    )
  }

  const result =
    await prisma.exerciseVariation.updateMany({
      where: {
        id: variationId,
        trainerId: null,
      },
      data: imageReviewData(status, notes),
    })

  if (result.count !== 1) {
    throw new AppError(
      'Não foi possível atualizar a revisão.',
      409,
    )
  }

  return prisma.exerciseVariation.findUniqueOrThrow({
    where: {
      id: variationId,
    },
  })
}

// ============================================================
// APROVAÇÃO OU REJEIÇÃO EM LOTE
// ============================================================

export async function reviewExerciseImagesBatch({
  trainerId,
  organizationId,
  variationIds,
  status,
  notes,
}: BatchReviewImagesParams) {
  await ensureCatalogAdminAccess(
    trainerId,
    organizationId,
  )

  validateImageReview(status, notes)

  if (
    !Array.isArray(variationIds) ||
    variationIds.length === 0 ||
    variationIds.length > 266 ||
    variationIds.some(
      id =>
        typeof id !== 'string' ||
        id.trim().length === 0,
    )
  ) {
    throw new AppError(
      'Informe de 1 a 266 IDs válidos de variações.',
      400,
    )
  }

  const uniqueIds = [...new Set(variationIds)]

  if (uniqueIds.length !== variationIds.length) {
    throw new AppError(
      'A lista contém IDs duplicados.',
      400,
    )
  }

  return prisma.$transaction(async tx => {
    const variations =
      await tx.exerciseVariation.findMany({
        where: {
          id: {
            in: uniqueIds,
          },
          trainerId: null,
        },
        select: {
          id: true,
          imageUrl: true,
        },
      })

    if (variations.length !== uniqueIds.length) {
      throw new AppError(
        'Uma ou mais variações globais não foram encontradas.',
        404,
      )
    }

    if (
      status !== 'PENDING' &&
      variations.some(
        variation => !variation.imageUrl,
      )
    ) {
      throw new AppError(
        'O lote contém variações sem imagem cadastrada.',
        400,
      )
    }

    const result =
      await tx.exerciseVariation.updateMany({
        where: {
          id: {
            in: uniqueIds,
          },
          trainerId: null,
        },
        data: imageReviewData(status, notes),
      })

    if (result.count !== uniqueIds.length) {
      throw new AppError(
        'Nem todas as imagens foram atualizadas.',
        409,
      )
    }

    return {
      message: 'Revisão em lote concluída.',
      status,
      updated: result.count,
    }
  })
}
