
import type {
  NextFunction,
  Request,
  Response,
} from 'express'

import { prisma } from '../lib/prisma.js'
import { isPlatformOwner } from '../lib/platform-owner.js'

export async function requirePlatformManager(
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
        isPlatformManager: true,
      },
    })

    if (!user?.isActive) {
      res.status(403).json({
        message: 'Usuário sem acesso ativo.',
      })
      return
    }

    if (
      !isPlatformOwner(userId) &&
      !user.isPlatformAdmin &&
      !user.isPlatformManager
    ) {
      res.status(403).json({
        message: 'Acesso restrito à gestão global.',
      })
      return
    }

    next()
  } catch (error) {
    next(error)
  }
}
