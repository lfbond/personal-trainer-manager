
import type { RequestHandler, Request, Response } from 'express'
import { z } from 'zod'

import {
  listPendingGlobalVariations,
  reviewGlobalVariation,
  previewBulkApproval,
  approveEligibleGlobalVariations,
} from '../services/platform-admin.service.js'

const reviewGlobalVariationSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
}).strict()

export const listPendingGlobalVariationsController: RequestHandler =
  async (_req, res) => {
    const variations = await listPendingGlobalVariations()

    res.status(200).json(variations)
  }

export const reviewGlobalVariationController: RequestHandler =
  async (req, res) => {
    const variationId = z.uuid().parse(req.params.id)

    const { decision } =
      reviewGlobalVariationSchema.parse(req.body)

    const variation = await reviewGlobalVariation({
      variationId,
      decision,
    })

    res.status(200).json(variation)
  }

export async function previewBulkApprovalController(
  _req: Request,
  res: Response,
) {
  const preview = await previewBulkApproval()

  return res.status(200).json(preview)
}

export async function approveEligibleGlobalVariationsController(
  _req: Request,
  res: Response,
) {
  const result = await approveEligibleGlobalVariations()

  return res.status(200).json({
    approved: result.count,
    message: `${result.count} variações aprovadas com sucesso.`,
  })
}