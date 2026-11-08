
import { z } from 'zod'

const uuidSchema = z.uuid()

const weakSequences = [
  '123456',
  '234567',
  '345678',
  '456789',
  '987654',
  '876543',
  '765432',
  '654321',
  'abcdef',
  'bcdefg',
  'fedcba',
  'qwerty',
  'asdfgh',
  'zxcvbn',
  'password',
  'senha123',
  'admin123',
]

const strongPasswordSchema = z
  .string()
  .min(12, 'A senha deve ter pelo menos 12 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.')
  .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula.')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula.')
  .regex(/[0-9]/, 'Inclua pelo menos um número.')
  .regex(
    /[^A-Za-z0-9]/,
    'Inclua pelo menos um caractere especial.',
  )
  .refine(
    (password) => {
      const normalized = password.toLowerCase()

      return !weakSequences.some((sequence) =>
        normalized.includes(sequence),
      )
    },
    {
      message: 'A senha contém uma sequência previsível.',
    },
  )

export const organizationIdParamsSchema = z.object({
  organizationId: uuidSchema,
})

export const organizationMemberParamsSchema = z.object({
  organizationId: uuidSchema,
  memberId: uuidSchema,
})

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use apenas letras minúsculas, números e hífens.',
    ),
  ownerUserId: uuidSchema,
})

export const createOrganizationTrainerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.email().trim().toLowerCase(),
    password: strongPasswordSchema,
    role: z.enum(['ADMIN', 'TRAINER']).default('TRAINER'),
  })
  .superRefine((data, ctx) => {
    const password = data.password.toLowerCase()

    const normalizedName = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const nameParts = normalizedName
      .split(/\s+/)
      .filter((part) => part.length >= 3)

    const emailLocalPart = data.email
      .split('@')[0]
      .toLowerCase()

    const forbiddenTerms = [
      ...nameParts,
      emailLocalPart,
    ].filter((term) => term.length >= 3)

    if (
      forbiddenTerms.some((term) => password.includes(term))
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message:
          'A senha não pode conter seu nome ou e-mail.',
      })
    }
  })

export const updateOrganizationMemberSchema = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(['ADMIN', 'TRAINER']).optional(),
  })
  .refine(
    (data) =>
      data.isActive !== undefined ||
      data.role !== undefined,
    {
      message: 'Informe pelo menos um campo para atualização.',
    },
  )
