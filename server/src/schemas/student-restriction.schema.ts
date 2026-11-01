
import { z } from 'zod'

const restrictionTypeSchema = z.enum([
  'JOINT',
  'MUSCULAR',
  'BONE',
  'CARDIOVASCULAR',
  'RESPIRATORY',
  'NEUROLOGICAL',
  'OTHER',
])

const bodyRegionSchema = z.enum([
  'NECK',
  'SHOULDER',
  'ELBOW',
  'WRIST',
  'HAND',
  'SPINE',
  'HIP',
  'KNEE',
  'ANKLE',
  'FOOT',
  'CHEST',
  'OTHER',
])

export const createStudentRestrictionSchema = z.object({
  type: restrictionTypeSchema,
  bodyRegion: bodyRegionSchema,
  description: z.string().trim().min(3).max(1000),
  notes: z.string().trim().max(2000).nullable().optional(),
}).strict()

export const updateStudentRestrictionSchema =
  createStudentRestrictionSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Informe pelo menos um campo para atualização.' },
  )

export type CreateStudentRestrictionInput =
  z.infer<typeof createStudentRestrictionSchema>

export type UpdateStudentRestrictionInput =
  z.infer<typeof updateStudentRestrictionSchema>
