
import { z } from 'zod'

export const createStudentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome deve conter pelo menos 3 caracteres.')
    .max(120, 'O nome deve conter no máximo 120 caracteres.'),

  email: z
    .email('Informe um e-mail válido.')
    .trim()
    .toLowerCase()
    .nullish(),

  phone: z
    .string()
    .trim()
    .max(20, 'O telefone deve conter no máximo 20 caracteres.')
    .nullish(),

  birthDate: z.iso.date().nullish(),

  notes: z
    .string()
    .trim()
    .max(2000, 'As observações devem conter no máximo 2000 caracteres.')
    .nullish(),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
