
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { verifyTrainerAccess } from './student.service.js'

import type {
  ListExercisesQueryInput,
  CreateExerciseInput,
  CreateExerciseVariationInput,
  UpdateExerciseVariationInput,
} from '../schemas/exercise.schema.js'

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
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão para consultar exercícios.',
      403,
    )
  }

  const exercises = await prisma.exercise.findMany({
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
                some: {
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
                },
            },
            }
        : {}),
    },

   include: {
    variations: {
        where: {
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
        },
    },
    },

    orderBy: {
      name: 'asc',
    },
  })

  return exercises
}


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
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão para cadastrar exercícios.',
      403,
    )
  }

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
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão para cadastrar variações.',
      403,
    )
  }

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
      muscleExplanation: data.muscleExplanation ?? null,
      status: 'ACTIVE',
    },
  })
}

interface VariationParams {
  variationId: string
  trainerId: string
  organizationId: string
}

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

export async function getExerciseVariationById({
  variationId,
  trainerId,
  organizationId,
}: VariationParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const variation = await prisma.exerciseVariation.findFirst({
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
    throw new AppError('Variação não encontrada.', 404)
  }

  return variation
}

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

  const result = await prisma.exerciseVariation.updateMany({
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

export async function deleteExerciseVariation({
  variationId,
  trainerId,
  organizationId,
}: VariationParams) {
  await ensureTrainerAccess(trainerId, organizationId)

  const variation = await prisma.exerciseVariation.findFirst({
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

  // Desativação preserva o histórico e as associações.
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
