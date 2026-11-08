
/**
 * Dados do perfil de saúde de um aluno.
 *
 * true  = Sim
 * false = Não
 * null  = Não informado
 */
export interface StudentHealthData {
  usesMedication: boolean | null
  medicationNotes: string | null
  medicalClearance: boolean | null
  clearanceNotes: string | null
  generalNotes: string | null
}

/**
 * Dados aceitos na atualização do perfil.
 */
export type UpdateStudentHealthData = Partial<StudentHealthData>
