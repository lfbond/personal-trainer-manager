
/**
 * Grupos musculares definidos no Prisma.
 */
export type MuscleGroup =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'LEGS'
  | 'GLUTES'
  | 'CALVES'
  | 'CORE'
  | 'CARDIO'
  | 'FULL_BODY'
  | 'OTHER'

/**
 * Categoria do equipamento utilizado.
 */
export type ExerciseCategory =
  | 'MACHINE_CABLE'
  | 'FREE_WEIGHT'

/**
 * Nível de dificuldade da variação.
 */
export type ExerciseLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'

/**
 * Situação de uma variação no catálogo.
 */
export type ExerciseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'

/**
 * Variação associada a um exercício-base.
 */
export interface ExerciseVariation {
  id: string
  exerciseId: string
  trainerId: string | null
  code: string
  name: string
  category: ExerciseCategory
  level: ExerciseLevel
  equipment: string | null
  subgroup: string | null
  description: string | null
  instructions: string | null
  safetyNotes: string | null
  muscleExplanation: string | null
  imageUrl: string | null
  videoUrl: string | null
  status: ExerciseStatus
  createdAt: string
  updatedAt: string
}

/**
 * Exercício-base retornado pela API.
 */
export interface Exercise {
  id: string
  code: string
  name: string
  muscleGroup: MuscleGroup
  description: string | null
  createdAt: string
  updatedAt: string
  variations: ExerciseVariation[]
}

/**
 * Filtros aceitos pela listagem.
 */
export interface ExerciseFilters {
  search?: string
  muscleGroup?: MuscleGroup
  category?: ExerciseCategory
  level?: ExerciseLevel
}
