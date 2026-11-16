
import { z } from 'zod'

const localImagePathPattern =
  /^\/exercises\/[a-zA-Z0-9_/-]+\.(?:jpg|jpeg|png|webp)$/i

const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => {
    if (localImagePathPattern.test(value)) {
      return !value.includes('..') && !value.includes('//')
    }

    try {
      const url = new URL(value)

      return (
        url.protocol === 'http:' ||
        url.protocol === 'https:'
      )
    } catch {
      return false
    }
  }, 'Informe uma URL HTTP/HTTPS ou um caminho /exercises/ válido.')

export const imageVariationParamsSchema = z
  .object({
    variationId: z.uuid(),
  })
  .strict()

export const imageProposalParamsSchema = z
  .object({
    proposalId: z.uuid(),
  })
  .strict()

export const createImageProposalSchema = z
  .object({
    imageUrl: imageUrlSchema.nullable(),
  })
  .strict()

export const updateOfficialImageSchema =
  createImageProposalSchema

export const listImageProposalsSchema = z
  .object({
    status: z
      .enum(['PENDING', 'APPROVED', 'REJECTED'])
      .optional(),
  })
  .strict()

export const reviewImageProposalSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().trim().max(2000).nullish(),
  })
  .strict()
  .superRefine((data, context) => {
    if (
      data.decision === 'REJECTED' &&
      !data.notes?.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['notes'],
        message: 'Informe o motivo da rejeição.',
      })
    }
  })
