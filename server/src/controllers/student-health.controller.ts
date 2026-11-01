import type { RequestHandler } from 'express'
import { z } from 'zod'

import { AppError } from '../lib/app-error.js'
import { getTrainerContext } from '../services/trainer-context.service.js'
import { getStudentHealthProfile, upsertStudentHealthProfile} from '../services/student-health.service.js'
import { upsertStudentHealthSchema } from '../schemas/student-health.schema.js'

async function resolveContext(
  userId: string | undefined,
  rawStudentId: string | string[] | undefined,
) {
  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const validation = z.uuid().safeParse(rawStudentId)

  if (!validation.success) {
    throw new AppError('ID do aluno inválido.', 400)
  }

  const context = await getTrainerContext(userId)

  return {
    studentId: validation.data,
    ...context,
  }
}

export const getStudentHealthController: RequestHandler = async (req, res) => {
    const context = await resolveContext(res.locals.userId as string | undefined, req.params.id,)

    const profile = await getStudentHealthProfile(context)

    res.status(200).json(profile)
}

export const upsertStudentHealthController: RequestHandler = async (req, res) => {
    const context = await resolveContext( res.locals.userId as string | undefined, req.params.id,)

    const data = upsertStudentHealthSchema.parse(req.body)

    const profile = await upsertStudentHealthProfile({
        ...context,
        data,
  })

  res.status(200).json(profile)
}
