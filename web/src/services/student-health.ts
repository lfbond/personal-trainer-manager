
import { api } from '../lib/api'

import type {
  StudentHealthData,
  UpdateStudentHealthData,
} from '../types/student-health'

/**
 * Consulta o perfil de saúde do aluno autenticado
 * no contexto do treinador.
 */
export async function getStudentHealth(
  studentId: string,
): Promise<StudentHealthData | null> {
  const response = await api.get<StudentHealthData | null>(
    `/students/${studentId}/health`,
  )

  return response.data
}

/**
 * Cria ou atualiza o perfil de saúde.
 *
 * PUT = upsert, conforme o backend implementado.
 */
export async function saveStudentHealth(
  studentId: string,
  data: UpdateStudentHealthData,
): Promise<StudentHealthData> {
  const response = await api.put<StudentHealthData>(
    `/students/${studentId}/health`,
    data,
  )

  return response.data
}
