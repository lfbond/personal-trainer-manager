
import type {
  Request,
  Response,
  NextFunction,
} from 'express'

import { prisma } from '../lib/prisma.js'

export async function getExerciseImagePermissionsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = res.locals.userId as
      | string
      | undefined

    if (!userId) {
      res.status(401).json({
        message: 'Usuário não autenticado.',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        canManageExerciseImages: true,
        canProposeExerciseImages: true,
        canApproveExerciseImages: true,
      },
    })

    if (!user?.isActive) {
      res.status(403).json({
        message: 'Usuário sem acesso ativo.',
      })
      return
    }

    res.status(200).json({
      canManage: user.canManageExerciseImages,
      canPropose: user.canProposeExerciseImages,
      canApprove: user.canApproveExerciseImages,
    })
  } catch (error) {
    next(error)
  }
}
