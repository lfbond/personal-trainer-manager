
import type {
  Request,
  Response,
} from 'express'

import {
  createImageProposalSchema,
  imageProposalParamsSchema,
  imageVariationParamsSchema,
  listImageProposalsSchema,
  reviewImageProposalSchema,
  updateOfficialImageSchema,
} from '../schemas/exercise-image-proposals.schema.js'

import {
  createImageProposal,
  listImageProposals,
  reviewImageProposal,
  updateOfficialExerciseImage,
} from '../services/exercise-image-proposals.service.js'

import { AppError } from '../lib/app-error.js'

function getAuthenticatedUserId(
  res: Response,
): string {
  const userId = res.locals.userId as
    | string
    | undefined

  if (!userId) {
    throw new AppError(
      'Usuário não autenticado.',
      401,
    )
  }

  return userId
}

// ============================================================
// CRIAR PROPOSTA DE IMAGEM
// ============================================================

export async function createImageProposalController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(res)

  const { variationId } =
    imageVariationParamsSchema.parse(req.params)

  const { imageUrl } =
    createImageProposalSchema.parse(req.body)

  const proposal = await createImageProposal({
    userId,
    variationId,
    imageUrl,
  })

  res.status(201).json({
    message:
      'Proposta enviada para aprovação.',
    proposal,
  })
}

// ============================================================
// LISTAR PROPOSTAS
// ============================================================

export async function listImageProposalsController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(res)

  const { status } =
    listImageProposalsSchema.parse(req.query)

  const proposals = await listImageProposals(
    userId,
    status,
  )

  res.status(200).json({
    total: proposals.length,
    proposals,
  })
}

// ============================================================
// APROVAR OU REJEITAR PROPOSTA
// ============================================================

export async function reviewImageProposalController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(res)

  const { proposalId } =
    imageProposalParamsSchema.parse(req.params)

  const { decision, notes } =
    reviewImageProposalSchema.parse(req.body)

  const proposal = await reviewImageProposal({
    userId,
    proposalId,
    decision,
    notes,
  })

  res.status(200).json({
    message:
      decision === 'APPROVED'
        ? 'Proposta aprovada com sucesso.'
        : 'Proposta rejeitada.',
    proposal,
  })
}

// ============================================================
// ALTERAÇÃO DIRETA DA IMAGEM OFICIAL
// ============================================================

export async function updateOfficialImageController(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(res)

  const { variationId } =
    imageVariationParamsSchema.parse(req.params)

  const { imageUrl } =
    updateOfficialImageSchema.parse(req.body)

  const variation = await updateOfficialExerciseImage({
    userId,
    variationId,
    imageUrl,
  })

  res.status(200).json({
    message:
      imageUrl === null
        ? 'Imagem oficial removida com sucesso.'
        : 'Imagem oficial atualizada com sucesso.',
    variation,
  })
}
