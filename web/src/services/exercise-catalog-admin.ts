
import { api } from "../lib/api";

import type {
  Exercise,
  ExerciseVariation,
  MuscleGroup,
  ExerciseCategory,
  ExerciseLevel,
  ExerciseStatus,
} from "../types/exercise";

export interface AdminCatalogFilters {
  search?: string;
  muscleGroup?: MuscleGroup;
  status?: ExerciseStatus;
  take?: number;
  skip?: number;
}

export interface AdminCatalogResponse {
  total: number;
  take: number;
  skip: number;
  exercises: Exercise[];
}

export interface CreateGlobalExerciseInput {
  code: string;
  name: string;
  muscleGroup: MuscleGroup;
  description?: string | null;
}

export type UpdateGlobalExerciseInput =
  Partial<CreateGlobalExerciseInput>;

export interface CreateGlobalVariationInput {
  exerciseId: string;
  code: string;
  name: string;
  category: ExerciseCategory;
  level: ExerciseLevel;
  equipment?: string | null;
  subgroup?: string | null;
  description?: string | null;
  instructions?: string | null;
  safetyNotes?: string | null;
  muscleExplanation?: string | null;
}

export type UpdateGlobalVariationInput =
  Partial<CreateGlobalVariationInput>;

export async function getAdminCatalog(
  filters: AdminCatalogFilters = {},
): Promise<AdminCatalogResponse> {
  const response = await api.get<AdminCatalogResponse>(
    "/exercises/catalog",
    { params: filters },
  );

  return response.data;
}

export async function getGlobalExercise(
  exerciseId: string,
): Promise<Exercise> {
  const response = await api.get<Exercise>(
    `/exercises/catalog/${exerciseId}`,
  );

  return response.data;
}

export async function createGlobalExercise(
  data: CreateGlobalExerciseInput,
): Promise<Exercise> {
  const response = await api.post<Exercise>(
    "/exercises/catalog",
    data,
  );

  return response.data;
}

export async function updateGlobalExercise(
  exerciseId: string,
  data: UpdateGlobalExerciseInput,
): Promise<Exercise> {
  const response = await api.patch<Exercise>(
    `/exercises/catalog/${exerciseId}`,
    data,
  );

  return response.data;
}

export async function createGlobalVariation(
  data: CreateGlobalVariationInput,
): Promise<ExerciseVariation> {
  const response = await api.post<ExerciseVariation>(
    "/exercises/catalog/variations",
    data,
  );

  return response.data;
}

export async function updateGlobalVariation(
  variationId: string,
  data: UpdateGlobalVariationInput,
): Promise<ExerciseVariation> {
  const response = await api.patch<ExerciseVariation>(
    `/exercises/catalog/variations/${variationId}`,
    data,
  );

  return response.data;
}
