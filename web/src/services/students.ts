import { api } from '../lib/api'
import type { Student, StudentDetails, StudentFilters, StudentFormData, StudentStatus,} from '../types/student'

/**
 * Consulta os alunos do treinador autenticado.
 * Os filtros são enviados como query parameters.
 */
export async function getStudents(
  filters: StudentFilters = {},
): Promise<Student[]> {
  const response = await api.get<Student[]>('/students', {
    params: filters,
  })

  return response.data
}

/**
 * Busca os dados completos de um aluno.
 */
export async function getStudentById(
  id: string,
): Promise<StudentDetails> {
  const response = await api.get<StudentDetails>(`/students/${id}`)
  return response.data
}

/**
 * Cadastra um aluno para o treinador autenticado.
 */
export async function createStudent(
  data: StudentFormData,
): Promise<StudentDetails> {
  const response = await api.post<StudentDetails>('/students', data)
  return response.data
}

/**
 * Atualiza os dados de um aluno existente.
 */
export async function updateStudent(
  id: string,
  data: StudentFormData,
): Promise<StudentDetails> {
  const response = await api.patch<StudentDetails>(
    `/students/${id}`,
    data,
  )

  return response.data
}


/**
 * Altera a situação de um aluno entre ACTIVE e INACTIVE.
 *
 * PATCH /students/:id/status
 */
export async function updateStudentStatus(
  id: string,
  status: StudentStatus,
): Promise<void> {
  await api.patch(`/students/${id}/status`, {
    status,
  })
}

/**
 * Arquiva um aluno sem removê-lo definitivamente
 * do banco de dados (soft delete).
 *
 * DELETE /students/:id
 */
export async function archiveStudent(id: string): Promise<void> {
  await api.delete(`/students/${id}`)
}
