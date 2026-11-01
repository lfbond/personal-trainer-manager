/**
 * Situações possíveis de um aluno.
 * INACTIVE não significa arquivado.
 */
export type StudentStatus = 'ACTIVE' | 'INACTIVE'

/**
 * Representa os dados retornados pelo GET /students.
 */
export interface Student {
  id: string
  name: string
  email: string | null
  phone: string | null
  birthDate: string | null
  status: StudentStatus
  createdAt: string
}

/**
 * Filtros aceitos pela API de alunos.
 */
export interface StudentFilters {
  search?: string
  status?: StudentStatus
}


/**
 * Dados enviados ao cadastrar ou editar um aluno.
 * O backend aceita campos opcionais como null.
 */
export interface StudentFormData {
  name: string
  email: string | null
  phone: string | null
  birthDate: string | null
  notes: string | null
}

/**
 * Representa os dados detalhados de um aluno.
 * Usado para preencher o formulário de edição.
 */
export interface StudentDetails extends Student {
  notes: string | null
  updatedAt: string
}
