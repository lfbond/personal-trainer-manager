import { z } from 'zod'

export const upsertStudentHealthSchema = z.object({
  usesMedication: z.boolean().nullable().optional(),
  medicationNotes: z.string().trim().max(2000).nullable().optional(),
  medicalClearance: z.boolean().nullable().optional(),
  clearanceNotes: z.string().trim().max(2000).nullable().optional(),
  generalNotes: z.string().trim().max(4000).nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Informe pelo menos um campo do perfil de saúde.' },
)

export type UpsertStudentHealthInput =
  z.infer<typeof upsertStudentHealthSchema>
