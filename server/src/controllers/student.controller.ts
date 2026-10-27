import type { RequestHandler } from 'express'
import { z } from 'zod'

import { listStudents, getStudentById, createStudent, updateStudent, archiveStudent} from '../services/student.service.js'
import { getTrainerContext } from '../services/trainer-context.service.js'
import { AppError } from '../lib/app-error.js'
import { createStudentSchema, updateStudentSchema } from '../schemas/student.schema.js'

export const listStudentsController: RequestHandler = async (
  _req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  const students = await listStudents({
    trainerId,
    organizationId,
  })

  res.status(200).json(students)
}

export const getStudentByIdController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

    const studentId = req.params.id

const studentIdValidation = z.uuid().safeParse(studentId)

if (!studentIdValidation.success) {
  throw new AppError('ID do aluno inválido.', 400)
}

const validatedStudentId = studentIdValidation.data

const { trainerId, organizationId } =
await getTrainerContext(userId)

const student = await getStudentById({
studentId: validatedStudentId,
trainerId,
organizationId,
})

if (!student) {
throw new AppError('Aluno não encontrado.', 404)
}

res.status(200).json(student)
  
}

export const createStudentController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const data = createStudentSchema.parse(req.body)

  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  const student = await createStudent({
    data,
    trainerId,
    organizationId,
  })

  res.status(201).json(student)
}

export const updateStudentController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const studentIdValidation = z.uuid().safeParse(req.params.id)

  if (!studentIdValidation.success) {
    throw new AppError('ID do aluno inválido.', 400)
  }

  const data = updateStudentSchema.parse(req.body)

  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  const student = await updateStudent({
    studentId: studentIdValidation.data,
    trainerId,
    organizationId,
    data,
  })

  res.status(200).json(student)
}

export const archiveStudentController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const studentIdValidation = z.uuid().safeParse(req.params.id)

  if (!studentIdValidation.success) {
    throw new AppError('ID do aluno inválido.', 400)
  }

  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  const result = await archiveStudent({
    studentId: studentIdValidation.data,
    trainerId,
    organizationId,
  })

  res.status(200).json(result)
}