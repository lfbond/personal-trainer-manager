import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { getStudentById } from './student.service.js'
import type { UpsertStudentHealthInput } from '../schemas/student-health.schema.js'

interface StudentHealthParams {
  studentId: string
  trainerId: string
  organizationId: string
}

async function ensureStudentAccess(params: StudentHealthParams) {
  const student = await getStudentById(params)

  if (!student) {
    throw new AppError('Aluno não encontrado.', 404)
  }
}

export async function getStudentHealthProfile(
  params: StudentHealthParams,
) {
  await ensureStudentAccess(params)

  return prisma.studentHealthProfile.findUnique({
    where: { studentId: params.studentId },
  })
}

export async function upsertStudentHealthProfile(
  params: StudentHealthParams & { data: UpsertStudentHealthInput },
) {
  await ensureStudentAccess(params)

  const { studentId, data } = params

  return prisma.studentHealthProfile.upsert({
    where: { studentId },
    create: {
      studentId,
      ...data,
    },
    update: data,
  })
}
