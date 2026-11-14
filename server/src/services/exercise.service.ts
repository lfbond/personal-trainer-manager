
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { isPlatformOwner } from '../lib/platform-owner.js'
import { verifyTrainerAccess } from './student.service.js'

import type {
  ListExercisesQueryInput,
  CreateExerciseInput,
  CreateExerciseVariationInput,
  UpdateExerciseVariationInput,
  UpdateExerciseInput,
} from '../schemas/exercise.schema.js'

import type {
  ExerciseImageStatus,
  Prisma,
} from '../generated/prisma/client.js'

// ============================================================
// CONTROLE DE ACESSO DOS TREINADORES
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

// ============================================================
// CONTROLE DE ACESSO À AUDITORIA GLOBAL
// ============================================================

// A auditoria do catálogo não depende de organização
// selecionada nem de vínculo administrativo local.
//
// Podem acessar:
// - Proprietário técnico da plataforma;
// - Administradores globais;
// - Usuários com canReviewExercises = true.
//
// Gestores globais não recebem automaticamente
// a permissão de auditoria.

async function ensureCatalogReviewerAccess(
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      isPlatformAdmin: true,
      canReviewExercises: true,
    },
  })

  if (
    !user?.isActive ||
    !(
      isPlatformOwner(userId) ||
      user.isPlatformAdmin ||
      user.canReviewExercises
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

  // Somente variações ativas e aprovadas
  // podem aparecer no catálogo dos treinadores.
  const variationFilter: Prisma.ExerciseVariationWhereInput = {
    status: 'ACTIVE',
    needsEditorialReview: false,
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

      // Não mostrar exercícios-base sem
      // variações disponíveis para prescrição.
      variations: {
        some: variationFilter,
      },
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

  const existingExercise =
    await prisma.exercise.findUnique({
      where: { code: data.code },
    })

  if (existingExercise) {
    throw new AppError(
      'Já existe um exercício com este código.',
      409,
    )
  }

  // O exercício-base não possui status próprio.
  // A disponibilidade depende das variações
  // aprovadas vinculadas a ele.
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
// CADASTRO DE VARIAÇÕES DOS TREINADORES
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

      // Nenhuma variação criada por treinador
      // será publicada automaticamente.
      status: 'DRAFT',
      needsEditorialReview: true,
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
          {
            trainerId: null,
            status: 'ACTIVE',
            needsEditorialReview: false,
          },
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

  const variation =
    await prisma.exerciseVariation.findFirst({
      where: {
        id: variationId,
        trainerId,
      },
      select: {
        id: true,
        status: true,
      },
    })

  if (!variation) {
    throw new AppError(
      'Variação não encontrada ou sem permissão.',
      404,
    )
  }

  // Uma variação publicada não pode ser alterada
  // diretamente sem uma nova avaliação editorial.
  if (variation.status === 'ACTIVE') {
    throw new AppError(
      'Esta variação já foi aprovada. Para alterá-la, será necessário solicitar uma nova revisão editorial.',
      409,
    )
  }

  // Variações inativas não podem ser modificadas
  // pelo treinador sem autorização editorial.
  if (variation.status === 'INACTIVE') {
    throw new AppError(
      'Esta variação está inativa. Não é permitido editá-la sem uma nova autorização editorial.',
      409,
    )
  }

  // A condição no updateMany também protege contra
  // alterações de status entre a consulta e a gravação.
  const result =
    await prisma.exerciseVariation.updateMany({
      where: {
        id: variationId,
        trainerId,
        status: 'DRAFT',
      },
      data: {
        ...data,
      },
    })

  if (result.count !== 1) {
    throw new AppError(
      'A variação não está disponível para edição.',
      409,
    )
  }

  return getExerciseVariationById({
    variationId,
    trainerId,
    organizationId,
  })
}

// ============================================================
// DESATIVAR VARIAÇÃO DO TREINADOR
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
        status: true,
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

  if (variation.status === 'INACTIVE') {
    throw new AppError(
      'Esta variação já está inativa.',
      409,
    )
  }

  const result =
    await prisma.exerciseVariation.updateMany({
      where: {
        id: variationId,
        trainerId,
        status: variation.status,
      },
      data: {
        status: 'INACTIVE',
      },
    })

  if (result.count !== 1) {
    throw new AppError(
      'Não foi possível desativar a variação.',
      409,
    )
  }

  return {
    message: 'Variação desativada com sucesso.',
  }
}

// ============================================================
// REVISÃO DE IMAGENS — TIPOS
// ============================================================

type ReviewStatus = ExerciseImageStatus

interface ImageReviewAccess {
  userId: string
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
  userId,
  status,
  onlyWithoutImage = false,
  search,
  take = 50,
  skip = 0,
}: ListImageReviewsParams) {
  await ensureCatalogReviewerAccess(userId)

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
  userId,
  variationId,
  status,
  notes,
}: ReviewImageParams) {
  await ensureCatalogReviewerAccess(userId)

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
// APROVAÇÃO OU REJEIÇÃO DE IMAGENS EM LOTE
// ============================================================

export async function reviewExerciseImagesBatch({
  userId,
  variationIds,
  status,
  notes,
}: BatchReviewImagesParams) {
  await ensureCatalogReviewerAccess(userId)

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

// ============================================================
// GERENCIAMENTO DO CATÁLOGO GLOBAL
// ============================================================

export async function createGlobalExercise({
  userId,
  data,
}: {
  userId: string
  data: CreateExerciseInput
}) {
  await ensureCatalogReviewerAccess(userId)

  const existing = await prisma.exercise.findUnique({
    where: { code: data.code },
    select: { id: true },
  })

  if (existing) {
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
// CONSULTAR EXERCÍCIO GLOBAL
// ============================================================

export async function getGlobalExerciseById({
  userId,
  exerciseId,
}: {
  userId: string
  exerciseId: string
}) {
  await ensureCatalogReviewerAccess(userId)

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      variations: {
        // O CRUD global não deve expor variações
        // particulares de outros treinadores.
        where: {
          trainerId: null,
        },
        orderBy: {
          name: 'asc',
        },
      },
    },
  })

  if (!exercise) {
    throw new AppError(
      'Exercício não encontrado.',
      404,
    )
  }

  return exercise
}

// ============================================================
// ATUALIZAR EXERCÍCIO-BASE GLOBAL
// ============================================================

export async function updateGlobalExercise({
  userId,
  exerciseId,
  data,
}: {
  userId: string
  exerciseId: string
  data: UpdateExerciseInput
}) {
  await ensureCatalogReviewerAccess(userId)

  const existing = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true },
  })

  if (!existing) {
    throw new AppError(
      'Exercício não encontrado.',
      404,
    )
  }

  // Alterações em exercícios-base compartilhados
  // também precisam respeitar a revisão editorial.
  //
  // Como Exercise ainda não possui versionamento,
  // bloqueamos alterações quando já existem
  // variações ativas associadas.
  const activeVariations =
    await prisma.exerciseVariation.count({
      where: {
        exerciseId,
        status: 'ACTIVE',
      },
    })

  if (activeVariations > 0) {
    throw new AppError(
      'Este exercício-base possui variações ativas. Sua edição exige um fluxo de revisão editorial.',
      409,
    )
  }

  return prisma.exercise.update({
    where: { id: exerciseId },
    data,
  })
}

// ============================================================
// CRIAR VARIAÇÃO GLOBAL
// ============================================================

export async function createGlobalExerciseVariation({
  userId,
  data,
}: {
  userId: string
  data: CreateExerciseVariationInput
}) {
  await ensureCatalogReviewerAccess(userId)

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

  const existing = await prisma.exerciseVariation.findUnique({
    where: { code: data.code },
    select: { id: true },
  })

  if (existing) {
    throw new AppError(
      'Já existe uma variação com este código.',
      409,
    )
  }

  return prisma.exerciseVariation.create({
    data: {
      exerciseId: data.exerciseId,
      trainerId: null,
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

      // Todas as novas variações globais
      // aguardam aprovação editorial.
      status: 'DRAFT',
      needsEditorialReview: true,
    },
  })
}

// ============================================================
// ATUALIZAR VARIAÇÃO GLOBAL
// ============================================================

export async function updateGlobalExerciseVariation({
  userId,
  variationId,
  data,
}: {
  userId: string
  variationId: string
  data: UpdateExerciseVariationInput
}) {
  await ensureCatalogReviewerAccess(userId)

  const existing =
    await prisma.exerciseVariation.findFirst({
      where: {
        id: variationId,
        trainerId: null,
      },
      select: {
        id: true,
        status: true,
      },
    })

  if (!existing) {
    throw new AppError(
      'Variação global não encontrada.',
      404,
    )
  }

  // Impede publicar alterações editoriais
  // sem uma nova aprovação.
  if (existing.status === 'ACTIVE') {
    throw new AppError(
      'Esta variação global está ativa. Para editá-la, será necessário solicitar uma nova revisão editorial.',
      409,
    )
  }

  if (existing.status === 'INACTIVE') {
    throw new AppError(
      'Esta variação global está inativa. É necessária autorização editorial antes de modificá-la.',
      409,
    )
  }

  const result =
    await prisma.exerciseVariation.updateMany({
      where: {
        id: variationId,
        trainerId: null,
        status: 'DRAFT',
      },
      data: {
        ...data,
        needsEditorialReview: true,
      },
    })

  if (result.count !== 1) {
    throw new AppError(
      'Não foi possível atualizar a variação global.',
      409,
    )
  }

  return prisma.exerciseVariation.findUniqueOrThrow({
    where: {
      id: variationId,
    },
  })
}
