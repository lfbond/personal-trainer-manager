import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'

import { verifyTrainerAccess } from './student.service.js'

import type {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  AddWorkoutExerciseInput,
  UpdateWorkoutExerciseInput,
} from '../schemas/workout.schema.js'

interface CreateWorkoutParams {
  data: CreateWorkoutInput
  trainerId: string
  organizationId: string
}

export async function createWorkout({
  data,
  trainerId,
  organizationId,
}: CreateWorkoutParams) {
  // 1. Verificar as permissões do treinador
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão para cadastrar treinos nesta organização.',
      403,
    )
  }

  // 2. Confirmar que o aluno pertence ao treinador
  // e à organização, e não está arquivado
  const student = await prisma.student.findFirst({
    where: {
      id: data.studentId,
      trainerId,
      organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
    },
  })

  if (!student) {
    throw new AppError(
      'Aluno não encontrado ou não pertence a este treinador.',
      404,
    )
  }

  // 3. Criar a ficha de treino como rascunho
  const workout = await prisma.workout.create({
    data: {
      name: data.name,
      description: data.description ?? null,

      trainer: {
        connect: { id: trainerId },
      },

      student: {
        connect: { id: student.id },
      },

      organization: {
        connect: { id: organizationId },
      },

      status: 'DRAFT',
      version: 1,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      version: true,
      trainerId: true,
      studentId: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return workout
}


interface ListWorkoutsParams {
  trainerId: string
  organizationId: string
}

export async function listWorkouts({
  trainerId,
  organizationId,
}: ListWorkoutsParams) {
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão para consultar fichas nesta organização.',
      403,
    )
  }

  return prisma.workout.findMany({
    where: {
      trainerId,
      organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      version: true,
      studentId: true,
      createdAt: true,
      updatedAt: true,
      student: {
        select: {
          id: true,
          name: true,
        },
      },
      exercises: {
        select: {
          id: true,
          exerciseVariationId: true,
          sets: true,
          repetitions: true,
          weight: true,
          weightUnit: true,
          restSeconds: true,
          order: true,
          notes: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

interface WorkoutAccessParams {
  id: string
  trainerId: string
  organizationId: string
}

async function ensureWorkoutAccess({
  id,
  trainerId,
  organizationId,
}: WorkoutAccessParams) {
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão nesta organização.',
      403,
    )
  }

  const workout = await prisma.workout.findFirst({
    where: {
      id,
      trainerId,
      organizationId,
      archivedAt: null,
    },
  })

  if (!workout) {
    throw new AppError('Ficha não encontrada.', 404)
  }

  return workout
}

export async function getWorkoutById(
  params: WorkoutAccessParams,
) {
  await ensureWorkoutAccess(params)

  return prisma.workout.findFirst({
    where: {
      id: params.id,
      trainerId: params.trainerId,
      organizationId: params.organizationId,
      archivedAt: null,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
        },
      },
      exercises: {
        include: {
          exerciseVariation: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })
}

export async function updateWorkout({
  id,
  trainerId,
  organizationId,
  data,
}: WorkoutAccessParams & {
  data: UpdateWorkoutInput
}) {
  const workout = await ensureWorkoutAccess({
    id,
    trainerId,
    organizationId,
  })

  if (workout.status !== 'DRAFT') {
    throw new AppError(
      'Somente fichas em rascunho podem ser editadas.',
      409,
    )
  }

  return prisma.workout.update({
    where: { id: workout.id },
    data,
  })
}

export async function archiveWorkout(
  params: WorkoutAccessParams,
) {
  const workout = await ensureWorkoutAccess(params)

  return prisma.workout.update({
    where: { id: workout.id },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    },
  })
}


interface WorkoutExerciseAccessParams extends WorkoutAccessParams {
  exerciseId: string
}

export async function addWorkoutExercise({
  id,
  trainerId,
  organizationId,
  data,
}: WorkoutAccessParams & {
  data: AddWorkoutExerciseInput
}) {
  return prisma.$transaction(async (tx) => {
    const hasAccess = await verifyTrainerAccess({
      trainerId,
      organizationId,
    })

    if (!hasAccess) {
      throw new AppError('Acesso negado.', 403)
    }

    // Bloqueia alterações concorrentes na mesma ficha.
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Workout"
      WHERE id = ${id}::uuid
        AND "trainerId" = ${trainerId}::uuid
        AND "organizationId" = ${organizationId}::uuid
        AND "archivedAt" IS NULL
        AND status = 'DRAFT'
      FOR UPDATE
    `

    if (!locked.length) {
      throw new AppError(
        'Ficha não encontrada ou não está em rascunho.',
        409,
      )
    }

    const variation = await tx.exerciseVariation.findUnique({
      where: { id: data.exerciseVariationId },
      select: {
        id: true,
        name: true,
      },
    })

    if (!variation) {
      throw new AppError('Variação não encontrada.', 404)
    }

    const lastExercise = await tx.workoutExercise.findFirst({
      where: { workoutId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    return tx.workoutExercise.create({
      data: {
        workoutId: id,
        exerciseVariationId: variation.id,
        sets: data.sets,
        repetitions: data.repetitions,
        weight: data.weight ?? null,
        weightUnit: data.weightUnit ?? 'KG',
        restSeconds: data.restSeconds ?? null,
        notes: data.notes ?? null,
        order: (lastExercise?.order ?? 0) + 1,
        exerciseNameSnapshot: variation.name,
      },
    })
  })
}

export async function updateWorkoutExercise({
  id,
  exerciseId,
  trainerId,
  organizationId,
  data,
}: WorkoutExerciseAccessParams & {
  data: UpdateWorkoutExerciseInput
}) {
  const workout = await ensureWorkoutAccess({
    id,
    trainerId,
    organizationId,
  })

  if (workout.status !== 'DRAFT') {
    throw new AppError(
      'Somente fichas em rascunho podem ser alteradas.',
      409,
    )
  }

  const exercise = await prisma.workoutExercise.findFirst({
    where: {
      id: exerciseId,
      workoutId: id,
    },
    select: { id: true },
  })

  if (!exercise) {
    throw new AppError('Exercício não encontrado na ficha.', 404)
  }

  return prisma.workoutExercise.update({
    where: { id: exercise.id },
    data,
  })
}

export async function removeWorkoutExercise({
  id,
  exerciseId,
  trainerId,
  organizationId,
}: WorkoutExerciseAccessParams) {
  const workout = await ensureWorkoutAccess({
    id,
    trainerId,
    organizationId,
  })

  if (workout.status !== 'DRAFT') {
    throw new AppError(
      'Somente fichas em rascunho podem ser alteradas.',
      409,
    )
  }

  const exercise = await prisma.workoutExercise.findFirst({
    where: {
      id: exerciseId,
      workoutId: id,
    },
    select: { id: true },
  })

  if (!exercise) {
    throw new AppError('Exercício não encontrado na ficha.', 404)
  }

  await prisma.workoutExercise.delete({
    where: { id: exercise.id },
  })
}


export async function activateWorkout(
  params: WorkoutAccessParams,
) {
  return prisma.$transaction(async (tx) => {
    const hasAccess = await verifyTrainerAccess({
      trainerId: params.trainerId,
      organizationId: params.organizationId,
    })

    if (!hasAccess) {
      throw new AppError('Acesso negado.', 403)
    }

    // Bloqueia a ficha durante a ativação.
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Workout"
      WHERE id = ${params.id}::uuid
        AND "trainerId" = ${params.trainerId}::uuid
        AND "organizationId" = ${params.organizationId}::uuid
        AND "archivedAt" IS NULL
        AND status = 'DRAFT'
      FOR UPDATE
    `

    if (!locked.length) {
      throw new AppError(
        'Ficha não encontrada ou não está em rascunho.',
        409,
      )
    }

    const exerciseCount = await tx.workoutExercise.count({
      where: { workoutId: params.id },
    })

    if (exerciseCount === 0) {
      throw new AppError(
        'Adicione pelo menos um exercício antes de ativar.',
        409,
      )
    }

    // Uma única ficha ativa por aluno.
    await tx.workout.updateMany({
      where: {
        studentId: {
          in: (
            await tx.workout.findMany({
              where: { id: params.id },
              select: { studentId: true },
            })
          ).map((workout) => workout.studentId),
        },
        trainerId: params.trainerId,
        organizationId: params.organizationId,
        status: 'ACTIVE',
        archivedAt: null,
      },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
    })

    return tx.workout.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    })
  })
}

export async function createWorkoutVersion(
  params: WorkoutAccessParams,
) {
  const original = await ensureWorkoutAccess(params)

  if (original.status !== 'ACTIVE') {
    throw new AppError(
      'Somente fichas ativas podem gerar uma nova versão.',
      409,
    )
  }

  const exercises = await prisma.workoutExercise.findMany({
    where: { workoutId: original.id },
    orderBy: { order: 'asc' },
  })

  return prisma.$transaction(async (tx) => {
    
    const existingNextVersion = await tx.workout.findFirst({
    where: {
        previousWorkoutId: original.id,
    },
    select: {
        id: true,
    },
    })

    if (existingNextVersion) {
    throw new AppError(
        'Esta ficha já possui uma versão posterior.',
        409,
    )
    }


    const newWorkout = await tx.workout.create({
      data: {
        trainerId: original.trainerId,
        studentId: original.studentId,
        organizationId: original.organizationId,
        previousWorkoutId: original.id,
        version: original.version + 1,
        name: original.name,
        description: original.description,
        status: 'DRAFT',
      },
    })

    if (exercises.length > 0) {
      await tx.workoutExercise.createMany({
        data: exercises.map((exercise) => ({
          workoutId: newWorkout.id,
          exerciseVariationId: exercise.exerciseVariationId,
          sets: exercise.sets,
          repetitions: exercise.repetitions,
          weight: exercise.weight,
          weightUnit: exercise.weightUnit,
          restSeconds: exercise.restSeconds,
          order: exercise.order,
          notes: exercise.notes,
          exerciseNameSnapshot: exercise.exerciseNameSnapshot,
          exerciseInstructionsSnapshot:
            exercise.exerciseInstructionsSnapshot,
          exerciseSafetyNotesSnapshot:
            exercise.exerciseSafetyNotesSnapshot,
        })),
      })
    }

    return tx.workout.findUnique({
      where: { id: newWorkout.id },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
        },
      },
    })
  })
}

export async function listWorkoutVersions(
  params: WorkoutAccessParams,
) {
  
    const hasAccess = await verifyTrainerAccess({
    trainerId: params.trainerId,
    organizationId: params.organizationId,
    })

    if (!hasAccess) {
    throw new AppError('Acesso negado.', 403)
    }

    const workout = await prisma.workout.findFirst({
    where: {
        id: params.id,
        trainerId: params.trainerId,
        organizationId: params.organizationId,
    },
    })

    if (!workout) {
    throw new AppError('Ficha não encontrada.', 404)
    }


  // Percorre a cadeia de versões anteriores e posteriores.
  const versions = [workout]
  const visited = new Set([workout.id])

  let current = workout

  while (current.previousWorkoutId) {
    const previous = await prisma.workout.findFirst({
      where: {
        id: current.previousWorkoutId,
        trainerId: params.trainerId,
        organizationId: params.organizationId,
      },
    })

    if (!previous || visited.has(previous.id)) break

    versions.unshift(previous)
    visited.add(previous.id)
    current = previous
  }

  let frontier = [...versions]

  while (frontier.length > 0) {
    const children = await prisma.workout.findMany({
      where: {
        previousWorkoutId: {
          in: frontier.map((item) => item.id),
        },
        trainerId: params.trainerId,
        organizationId: params.organizationId,
      },
    })

    frontier = children.filter((item) => !visited.has(item.id))

    for (const item of frontier) {
      versions.push(item)
      visited.add(item.id)
    }
  }

  return versions.sort((a, b) => a.version - b.version)
}
