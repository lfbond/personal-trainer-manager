
import { prisma } from '../lib/prisma.js'

import type { CreateStudentInput,  UpdateStudentInput } from '../schemas/student.schema.js'

import { AppError } from '../lib/app-error.js'

interface ListStudentsParams {
  trainerId: string
  organizationId: string
}

export async function listStudents({
  trainerId,
  organizationId,
}: ListStudentsParams) {
    
    const hasAccess = await verifyTrainerAccess({
        trainerId,
        organizationId,
        })

        if (!hasAccess) {
        throw new AppError(
            'Treinador sem permissão para consultar alunos nesta organização.',
            403,
        )
    }

    const students = await prisma.student.findMany({
    where: {
      trainerId,
      organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      birthDate: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return students
}


interface GetStudentByIdParams {
  studentId: string
  trainerId: string
  organizationId: string
}

export async function getStudentById({
  studentId,
  trainerId,
  organizationId,
}: GetStudentByIdParams) {
    
    const hasAccess = await verifyTrainerAccess({
        trainerId,
        organizationId,
        })

        if (!hasAccess) {
        throw new AppError(
            'Treinador sem permissão para consultar este aluno.',
            403,
        )
    }

    const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      trainerId,
      organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      birthDate: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return student
}

interface CreateStudentParams {
  data: CreateStudentInput
  trainerId: string
  organizationId: string
}

export async function createStudent({
  data,
  trainerId,
  organizationId,
}: CreateStudentParams) {
    const hasAccess = await verifyTrainerAccess({
        trainerId,
        organizationId,
        })

        if (!hasAccess) {
        throw new AppError(
            'Treinador sem permissão para cadastrar alunos nesta organização.',
            403,
        )
    }
    const student = await prisma.student.create({
    data: {
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      birthDate: data.birthDate
        ? new Date(`${data.birthDate}T00:00:00.000Z`)
        : null,
      notes: data.notes ?? null,
      trainer: {
        connect: { id: trainerId },
      },
      organization: {
        connect: { id: organizationId },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      birthDate: true,
      notes: true,
      status: true,
      createdAt: true,
    },
  })

  return student
}

interface VerifyTrainerAccessParams {
  trainerId: string
  organizationId: string
}

export async function verifyTrainerAccess({
  trainerId,
  organizationId,
}: VerifyTrainerAccessParams) {
  const trainer = await prisma.trainer.findFirst({
    where: {
      id: trainerId,
      user: {
        isActive: true,
        organizationMemberships: {
          some: {
            organizationId,
            isActive: true,
            role: {
              in: ['OWNER', 'ADMIN', 'TRAINER'],
            },
            organization: {
              isActive: true,
            },
          },
        },
      },
    },
    select: {
      id: true,
    },
  })

  return trainer !== null
}

interface UpdateStudentParams {
  studentId: string
  trainerId: string
  organizationId: string
  data: UpdateStudentInput
}

export async function updateStudent({
  studentId,
  trainerId,
  organizationId,
  data,
}: UpdateStudentParams) {
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão para atualizar alunos nesta organização.',
      403,
    )
  }

  const result = await prisma.student.updateMany({
    where: {
      id: studentId,
      trainerId,
      organizationId,
      archivedAt: null,
    },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.birthDate !== undefined && {
        birthDate: data.birthDate
          ? new Date(`${data.birthDate}T00:00:00.000Z`)
          : null,
      }),
    },
  })

  if (result.count === 0) {
    throw new AppError('Aluno não encontrado.', 404)
  }

  return getStudentById({
    studentId,
    trainerId,
    organizationId,
  })
}
interface ArchiveStudentParams {
  studentId: string
  trainerId: string
  organizationId: string
}

export async function archiveStudent({
  studentId,
  trainerId,
  organizationId,
}: ArchiveStudentParams) {
  const hasAccess = await verifyTrainerAccess({
    trainerId,
    organizationId,
  })

  if (!hasAccess) {
    throw new AppError(
      'Treinador sem permissão para arquivar alunos nesta organização.',
      403,
    )
  }

  const result = await prisma.student.updateMany({
    where: {
      id: studentId,
      trainerId,
      organizationId,
      archivedAt: null,
    },
    data: {
      archivedAt: new Date(),
    },
  })

  if (result.count === 0) {
    throw new AppError('Aluno não encontrado.', 404)
  }

  return {
    message: 'Aluno arquivado com sucesso.',
  }
}