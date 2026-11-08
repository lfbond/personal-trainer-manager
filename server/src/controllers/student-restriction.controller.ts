
import type { RequestHandler } from 'express'
import { z } from 'zod'

import { AppError } from '../lib/app-error.js'
import { getTrainerContext } from '../services/trainer-context.service.js'

import {
  listStudentRestrictions,
  createStudentRestriction,
  updateStudentRestriction,
  deleteStudentRestriction,
} from '../services/student-restriction.service.js'

import {
  createStudentRestrictionSchema,
  updateStudentRestrictionSchema,
} from '../schemas/student-restriction.schema.js'

function validateUuid(value: unknown, label: string) {
  const result = z.uuid().safeParse(value)

  if (!result.success) {
    throw new AppError(`${label} inválido.`, 400)
  }

  return result.data
}

async function resolveContext(
  userId: string | undefined,
  rawStudentId: string | string[] | undefined,
) {
  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const studentId = validateUuid(rawStudentId, 'ID do aluno')
  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  return { studentId, trainerId, organizationId }
}

export const listStudentRestrictionsController: RequestHandler =
  async (req, res) => {
    const context = await resolveContext(
      res.locals.userId as string | undefined,
      req.params.id,
    )

    const restrictions = await listStudentRestrictions(context)

    res.status(200).json(restrictions)
  }

export const createStudentRestrictionController: RequestHandler =
  async (req, res) => {
    const context = await resolveContext(
      res.locals.userId as string | undefined,
      req.params.id,
    )

    const data = createStudentRestrictionSchema.parse(req.body)

    const restriction = await createStudentRestriction(context, data)

    res.status(201).json(restriction)
  }

export const updateStudentRestrictionController: RequestHandler =
  async (req, res) => {
    const context = await resolveContext(
      res.locals.userId as string | undefined,
      req.params.id,
    )

    const restrictionId = validateUuid(
      req.params.restrictionId,
      'ID da restrição',
    )

    const data = updateStudentRestrictionSchema.parse(req.body)

    const restriction = await updateStudentRestriction(
      { ...context, restrictionId },
      data,
    )

    res.status(200).json(restriction)
  }

export const deleteStudentRestrictionController: RequestHandler =
  async (req, res) => {
    const context = await resolveContext(
      res.locals.userId as string | undefined,
      req.params.id,
    )

    const restrictionId = validateUuid(
      req.params.restrictionId,
      'ID da restrição',
    )

    const result = await deleteStudentRestriction({
      ...context,
      restrictionId,
    })

    res.status(200).json(result)
  }
