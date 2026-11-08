
import { api } from '../lib/api'

import type { ExerciseVariation } from '../types/exercise'

export type ReviewDecision = 'APPROVE' | 'REJECT'

// Busca todas as variações globais aguardando revisão.
// GET /admin/exercise-variations
export async function getPendingExerciseVariations(): Promise<
  ExerciseVariation[]
> {
  const response = await api.get<ExerciseVariation[]>(
    '/admin/exercise-variations',
  )

  return response.data
}

// Aprova ou rejeita uma variação global pendente.
// PATCH /admin/exercise-variations/:id/status
export async function reviewExerciseVariation(
  variationId: string,
  decision: ReviewDecision,
): Promise<ExerciseVariation> {
  const response = await api.patch<ExerciseVariation>(
    `/admin/exercise-variations/${variationId}/status`,
    { decision },
  )

  return response.data
}

export interface BulkApprovalPreview {
  eligible: number
  editorialPending: number
}

export async function getBulkApprovalPreview(): Promise<BulkApprovalPreview> {
  const response = await api.get<BulkApprovalPreview>(
    '/admin/exercise-variations/bulk-preview',
  )

  return response.data
}

export interface BulkApprovalResult {
  approved: number
  message: string
}

export async function approveBulkExerciseVariations(): Promise<BulkApprovalResult> {
  const response = await api.post<BulkApprovalResult>(
    '/admin/exercise-variations/bulk-approve',
  )

  return response.data
}