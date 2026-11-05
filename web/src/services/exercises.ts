
import { api } from '../lib/api'

import type {
  Exercise,
  ExerciseFilters,
  ExerciseVariation,
} from '../types/exercise'

/**
 * Consulta os exercícios disponíveis para o
 * treinador autenticado.
 *
 * GET /exercises
 *
 * A API retorna exercícios-base com suas
 * variações ACTIVE.
 */
export async function getExercises(
  filters: ExerciseFilters = {},
): Promise<Exercise[]> {
  const response = await api.get<Exercise[]>('/exercises', {
    params: filters,
  })

  return response.data
}

/**
 * Busca os detalhes de uma variação.
 *
 * GET /exercises/variations/:id
 */
export async function getExerciseVariationById(
  id: string,
): Promise<ExerciseVariation> {
  const response = await api.get<ExerciseVariation>(
    `/exercises/variations/${id}`,
  )

  return response.data
}
