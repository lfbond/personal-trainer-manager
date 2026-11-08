
import type { RequestHandler } from 'express'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'

export const requireOrganizationOwner: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const userId = res.locals.userId as string | undefined

    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401)
    }

    const organizationId = z.uuid().parse(
      req.params.organizationId,
    )

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        isPlatformAdmin: true,
      },
    })

    if (!user?.isActive) {
      throw new AppError('Usuário sem acesso ativo.', 403)
    }

    if (user.isPlatformAdmin) {
      return next()
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId,
        role: 'OWNER',
        isActive: true,
        organization: {
          isActive: true,
        },
      },
      select: { id: true },
    })

    if (!membership) {
      throw new AppError(
        'Operação restrita ao proprietário da organização.',
        403,
      )
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
