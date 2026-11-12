
import type {
  NextFunction,
  Request,
  Response,
} from 'express'

import { prisma } from '../lib/prisma.js'
import { isPlatformOwner } from '../lib/platform-owner.js'

export async function requireCatalogReviewer(
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
        canReviewExercises: true,
      },
    })

    if (
      !user ||
      !user.isActive ||
      !(
        isPlatformOwner(userId) ||
        user.isPlatformAdmin ||
        user.canReviewExercises
      )
    ) {
      res.status(403).json({
        message:
          'Acesso restrito aos revisores autorizados do catálogo.',
      })
      return
    }

    next()
  } catch (error) {
    next(error)
  }
}
