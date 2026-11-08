import type { RequestHandler } from 'express'
import { z } from 'zod'

import { AppError } from '../lib/app-error.js'
import { runWithOrganizationContext } from '../lib/organization-request-context.js'

export const organizationContextMiddleware: RequestHandler = (
  req,
  _res,
  next,
) => {
  const organizationHeader = req.headers['x-organization-id']

  if (organizationHeader === undefined) {
    runWithOrganizationContext(null, next)
    return
  }

  if (
    typeof organizationHeader !== 'string' ||
    !z.uuid().safeParse(organizationHeader).success
  ) {
    next(new AppError('Organização selecionada inválida.', 400))
    return
  }

  runWithOrganizationContext(organizationHeader, next)
}