
import { api } from "../lib/api";

import type {
  ExerciseImageStatus,
  ExerciseVariation,
  ExerciseCategory,
  ExerciseLevel,
  ExerciseStatus,
} from "../types/exercise";

export interface ImageReviewVariation {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  imageReviewStatus: ExerciseImageStatus;
  imageReviewNotes: string | null;
  imageReviewedAt: string | null;
  status: ExerciseStatus;
  equipment: string | null;
  category: ExerciseCategory;
  level: ExerciseLevel;
  exercise: {
    id: string;
    code: string;
    name: string;
    muscleGroup: string;
  };
}

export interface ImageReviewFilters {
  status?: ExerciseImageStatus;
  onlyWithoutImage?: boolean;
  search?: string;
  take?: number;
  skip?: number;
}

export interface ImageReviewListResponse {
  variations: ImageReviewVariation[];
  total: number;
  take: number;
  skip: number;
}

export interface ImageReviewPayload {
  status: ExerciseImageStatus;
  notes?: string | null;
}

export interface BatchImageReviewPayload
  extends ImageReviewPayload {
  variationIds: string[];
}

export interface BatchImageReviewResult {
  message: string;
  status: ExerciseImageStatus;
  updated: number;
}

/**
 * Lista as imagens do catálogo global.
 */
export async function getExerciseImageReviews(
  filters: ImageReviewFilters = {},
): Promise<ImageReviewListResponse> {
  const response = await api.get<ImageReviewListResponse>(
    "/exercises/images/reviews",
    {
      params: filters,
    },
  );

  return response.data;
}

/**
 * Aprova, rejeita ou redefine uma imagem.
 */
export async function reviewExerciseImage(
  variationId: string,
  payload: ImageReviewPayload,
): Promise<ExerciseVariation> {
  const response = await api.patch<ExerciseVariation>(
    `/exercises/variations/${variationId}/image-review`,
    payload,
  );

  return response.data;
}

/**
 * Atualiza o status de várias imagens
 * em uma única operação.
 */
export async function reviewExerciseImagesBatch(
  payload: BatchImageReviewPayload,
): Promise<BatchImageReviewResult> {
  const response = await api.patch<BatchImageReviewResult>(
    "/exercises/images/reviews/batch",
    payload,
  );

  return response.data;
}
