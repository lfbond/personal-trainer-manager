
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { getStudentById } from './student.service.js'

import type {
  CreateStudentRestrictionInput,
  UpdateStudentRestrictionInput,
} from '../schemas/student-restriction.schema.js'

interface RestrictionContext {
  studentId: string
  trainerId: string
  organizationId: string
}

interface RestrictionByIdContext extends RestrictionContext {
  restrictionId: string
}

async function ensureStudentAccess(context: RestrictionContext) {
  const student = await getStudentById(context)

  if (!student) {
    throw new AppError('Aluno não encontrado.', 404)
  }
}

export async function listStudentRestrictions(
  context: RestrictionContext,
) {
  await ensureStudentAccess(context)

  return prisma.studentRestriction.findMany({
    where: { studentId: context.studentId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createStudentRestriction(
  context: RestrictionContext,
  data: CreateStudentRestrictionInput,
) {
  await ensureStudentAccess(context)

  return prisma.studentRestriction.create({
    data: {
      studentId: context.studentId,
      type: data.type,
      bodyRegion: data.bodyRegion,
      description: data.description,
      notes: data.notes ?? null,
    },
  })
}

export async function updateStudentRestriction(
  context: RestrictionByIdContext,
  data: UpdateStudentRestrictionInput,
) {
  await ensureStudentAccess(context)

  const result = await prisma.studentRestriction.updateMany({
    where: {
      id: context.restrictionId,
      studentId: context.studentId,
    },
    data,
  })

  if (result.count === 0) {
    throw new AppError('Restrição não encontrada.', 404)
  }

  return prisma.studentRestriction.findFirst({
    where: {
      id: context.restrictionId,
      studentId: context.studentId,
    },
  })
}

export async function deleteStudentRestriction(
  context: RestrictionByIdContext,
) {
  await ensureStudentAccess(context)

  const result = await prisma.studentRestriction.deleteMany({
    where: {
      id: context.restrictionId,
      studentId: context.studentId,
    },
  })

  if (result.count === 0) {
    throw new AppError('Restrição não encontrada.', 404)
  }

  return { message: 'Restrição excluída com sucesso.' }
}
