
import type { RequestHandler } from 'express'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'

export const requireOrganizationAdmin: RequestHandler = async (
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

    if (!user || !user.isActive) {
      throw new AppError('Usuário sem acesso ativo.', 403)
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        isActive: true,
      },
    })

    if (!organization || !organization.isActive) {
      throw new AppError(
        'Organização não encontrada ou inativa.',
        404,
      )
    }

    if (user.isPlatformAdmin) {
      return next()
    }

    const membership =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        select: {
          role: true,
          isActive: true,
        },
      })

    if (
      !membership ||
      !membership.isActive ||
      !['OWNER', 'ADMIN'].includes(membership.role)
    ) {
      throw new AppError(
        'Acesso restrito à administração da organização.',
        403,
      )
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
