
import { prisma } from '../lib/prisma.js'

// ============================================================
// CATÁLOGO PÚBLICO DE EXERCÍCIOS
// ============================================================

// Retorna somente exercícios globais com variações ativas.
// Não expõe dados de treinadores, alunos ou revisão interna.

export async function listPublicExercises() {
  return prisma.exercise.findMany({
    where: {
      variations: {
        some: {
          trainerId: null,
          status: 'ACTIVE',
          needsEditorialReview: false,
        },
      },
    },

    select: {
      id: true,
      code: true,
      name: true,
      muscleGroup: true,
      description: true,

      variations: {
        where: {
          trainerId: null,
          status: 'ACTIVE',
          needsEditorialReview: false,
        },

        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          level: true,
          equipment: true,
          subgroup: true,
          description: true,
          instructions: true,
          safetyNotes: true,
          muscleExplanation: true,
          imageUrl: true,
          imageReviewStatus: true,
        },

        orderBy: {
          name: 'asc',
        },
      },
    },

    orderBy: {
      name: 'asc',
    },
  }).then(exercises =>
    exercises.map(exercise => ({
      ...exercise,
      variations: exercise.variations.map(variation => {
        const {
          imageReviewStatus,
          imageUrl,
          ...publicVariation
        } = variation

        return {
          ...publicVariation,
          imageUrl:
            imageReviewStatus === 'APPROVED'
              ? imageUrl
              : null,
        }
      }),
    })),
  )
}
