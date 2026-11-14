
import type {
  NextFunction,
  Request,
  Response,
} from 'express'

import { prisma } from '../lib/prisma.js'
import { isPlatformOwner } from '../lib/platform-owner.js'

export type CatalogPermission =
  | 'catalog:read'
  | 'catalog:manage'
  | 'catalog:review'
  | 'catalog:change-status'
  | 'catalog:suspend-safety'
  | 'catalog:delete'

interface CatalogAccess {
  isOwner: boolean
  isAdmin: boolean
  isReviewer: boolean
}

function hasPermission(
  permission: CatalogPermission,
  access: CatalogAccess,
): boolean {
  const {
    isOwner,
    isAdmin,
    isReviewer,
  } = access

  switch (permission) {
    case 'catalog:read':
    case 'catalog:manage':
    case 'catalog:review':
      return isOwner || isAdmin || isReviewer

    case 'catalog:change-status':
      return isOwner || isAdmin

    case 'catalog:suspend-safety':
      return isOwner || isAdmin || isReviewer

    case 'catalog:delete':
      return isOwner

    default:
      return false
  }
}

export function requireCatalogPermission(
  permission: CatalogPermission,
) {
  return async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const userId = res.locals.userId as
      | string
      | undefined

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

      if (!user?.isActive) {
        res.status(403).json({
          message: 'Usuário sem acesso ativo.',
        })
        return
      }

      const access: CatalogAccess = {
        isOwner: isPlatformOwner(userId),
        isAdmin: user.isPlatformAdmin,
        isReviewer: user.canReviewExercises,
      }

      if (!hasPermission(permission, access)) {
        res.status(403).json({
          message:
            'Você não possui permissão para realizar esta operação.',
        })
        return
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export const requireCatalogManager =
  requireCatalogPermission('catalog:manage')

export const requireCatalogStatusManager =
  requireCatalogPermission('catalog:change-status')

export const requireCatalogSafetyModerator =
  requireCatalogPermission('catalog:suspend-safety')

export const requireCatalogDeletion =
  requireCatalogPermission('catalog:delete')