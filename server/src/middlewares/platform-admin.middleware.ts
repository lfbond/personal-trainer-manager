
import type { NextFunction, Request, Response } from 'express'

import { prisma } from '../lib/prisma.js'

export async function requirePlatformAdmin(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    res.status(401).json({
      message: 'Usuário não autenticado.',
    })
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        isPlatformAdmin: true,
      },
    })

    if (!user || !user.isActive || !user.isPlatformAdmin) {
      res.status(403).json({
        message: 'Acesso restrito ao administrador global.',
      })
      return
    }

    next()
  } catch (error) {
    next(error)
  }
}
