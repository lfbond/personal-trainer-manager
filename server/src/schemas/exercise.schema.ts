
import { z } from 'zod'

export const listExercisesQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),

    muscleGroup: z.enum([
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
    ]).optional(),

    category: z.enum([
      'MACHINE_CABLE',
      'FREE_WEIGHT',
    ]).optional(),

    level: z.enum([
      'BEGINNER',
      'INTERMEDIATE',
      'ADVANCED',
    ]).optional(),
  })
  .strict()

export type ListExercisesQueryInput =
  z.infer<typeof listExercisesQuerySchema>

  
export const createExerciseSchema = z.object({
  code: z.string()
    .trim()
    .min(3)
    .max(80)
    .regex(
      /^[A-Z0-9_]+$/,
      'Use letras maiúsculas, números e underline.',
    ),

  name: z.string()
    .trim()
    .min(3)
    .max(150),

  muscleGroup: z.enum([
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
  ]),

  description: z.string()
    .trim()
    .max(2000)
    .nullish(),
}).strict()

export type CreateExerciseInput =
  z.infer<typeof createExerciseSchema>


export const createExerciseVariationSchema = z.object({
  exerciseId: z.uuid(),

  code: z.string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[A-Z0-9_]+$/),

  name: z.string()
    .trim()
    .min(3)
    .max(150),

  category: z.enum([
    'MACHINE_CABLE',
    'FREE_WEIGHT',
  ]),

  level: z.enum([
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
  ]),

  equipment: z.string().trim().max(150).nullish(),
  subgroup: z.string().trim().max(150).nullish(),
  description: z.string().trim().max(2000).nullish(),
  instructions: z.string().trim().max(5000).nullish(),
  safetyNotes: z.string().trim().max(3000).nullish(),
  muscleExplanation: z.string().trim().max(3000).nullish(),
}).strict()

export type CreateExerciseVariationInput =
  z.infer<typeof createExerciseVariationSchema>


export const updateExerciseVariationSchema =
  createExerciseVariationSchema
    .omit({
      exerciseId: true,
      code: true,
    })
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'Informe pelo menos um campo para atualizar.',
      },
    )

export type UpdateExerciseVariationInput =
  z.infer<typeof updateExerciseVariationSchema>