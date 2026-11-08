
import { z } from 'zod'

export const createWorkoutSchema = z.object({
  studentId: z.uuid(),

  name: z
    .string()
    .trim()
    .min(3, 'O nome da ficha deve ter pelo menos 3 caracteres.')
    .max(120, 'O nome da ficha deve ter no máximo 120 caracteres.'),

  description: z
    .string()
    .trim()
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres.')
    .nullable()
    .optional(),
}).strict()

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>

export const workoutParamsSchema = z.object({
  id: z.uuid(),
})

export const updateWorkoutSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  'Informe pelo menos um campo para atualizar.',
)

export type UpdateWorkoutInput = z.infer<
  typeof updateWorkoutSchema
>

export const workoutExerciseParamsSchema = z.object({
  id: z.uuid(),
  exerciseId: z.uuid(),
})

export const addWorkoutExerciseSchema = z.object({
  exerciseVariationId: z.uuid(),
  sets: z.number().int().min(1).max(20),
  repetitions: z.string().trim().min(1).max(50),
  weight: z.number().nonnegative().max(999999.99)
    .nullable().optional(),
  weightUnit: z.enum(['KG', 'LB']).optional(),
  restSeconds: z.number().int().min(0).max(3600)
    .nullable().optional(),
  notes: z.string().trim().max(1000)
    .nullable().optional(),
}).strict()

export const updateWorkoutExerciseSchema = z.object({
  // Permite substituir a variação sem excluir a prescrição.
  exerciseVariationId: z.uuid().optional(),

  sets: z.number().int().min(1).max(20).optional(),
  repetitions: z.string().trim().min(1).max(50).optional(),
  weight: z.number().nonnegative().max(999999.99)
    .nullable().optional(),
  weightUnit: z.enum(['KG', 'LB']).optional(),
  restSeconds: z.number().int().min(0).max(3600)
    .nullable().optional(),
  notes: z.string().trim().max(1000)
    .nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  'Informe pelo menos um campo para atualizar.',
)

export type AddWorkoutExerciseInput = z.infer<
  typeof addWorkoutExerciseSchema
>

export type UpdateWorkoutExerciseInput = z.infer<
  typeof updateWorkoutExerciseSchema
>
