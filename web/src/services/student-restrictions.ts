
import { api } from '../lib/api'

import type { StudentRestriction, StudentRestrictionFormData, UpdateStudentRestrictionData} from '../types/student-restriction'

export async function getStudentRestrictions(
  studentId: string,
): Promise<StudentRestriction[]> {
  const response = await api.get<StudentRestriction[]>(
    `/students/${studentId}/restrictions`,
  )

  return response.data
}

export async function createStudentRestriction(
  studentId: string,
  data: StudentRestrictionFormData,
): Promise<StudentRestriction> {
  const response = await api.post<StudentRestriction>(
    `/students/${studentId}/restrictions`,
    data,
  )

  return response.data
}

export async function updateStudentRestriction(
  studentId: string,
  restrictionId: string,
  data: UpdateStudentRestrictionData,
): Promise<StudentRestriction> {
  const response = await api.patch<StudentRestriction>(
    `/students/${studentId}/restrictions/${restrictionId}`,
    data,
  )

  return response.data
}

export async function deleteStudentRestriction(
  studentId: string,
  restrictionId: string,
): Promise<void> {
  await api.delete(
    `/students/${studentId}/restrictions/${restrictionId}`,
  )
}
