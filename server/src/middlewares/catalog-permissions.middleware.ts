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
  | 'catalog:image-manage'
  | 'catalog:image-propose'
  | 'catalog:image-approve'

interface CatalogAccess {
  isOwner: boolean
  isAdmin: boolean
  isReviewer: boolean
  canManageImages: boolean
  canProposeImages: boolean
  canApproveImages: boolean
}

function hasPermission(
  permission: CatalogPermission,
  access: CatalogAccess,
): boolean {
  const {
    isOwner,
    isAdmin,
    isReviewer,
    canManageImages,
    canProposeImages,
    canApproveImages,
  } = access

  switch (permission) {
    case 'catalog:read':
      return (
        isOwner ||
        isAdmin ||
        isReviewer ||
        canManageImages ||
        canProposeImages ||
        canApproveImages
      )

    case 'catalog:manage':
    case 'catalog:review':
      return isOwner || isAdmin || isReviewer

    case 'catalog:change-status':
      return isOwner || isAdmin

    case 'catalog:suspend-safety':
      return isOwner || isAdmin || isReviewer

    case 'catalog:delete':
      return isOwner

    case 'catalog:image-manage':
      return canManageImages

    case 'catalog:image-propose':
      return canProposeImages

    case 'catalog:image-approve':
      return canApproveImages

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

      const access: CatalogAccess = {
        isOwner: isPlatformOwner(userId),
        isAdmin: user.isPlatformAdmin,
        isReviewer: user.canReviewExercises,
        canManageImages: user.canManageExerciseImages,
        canProposeImages: user.canProposeExerciseImages,
        canApproveImages: user.canApproveExerciseImages,
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

export const requireCatalogReader =
  requireCatalogPermission('catalog:read')

export const requireCatalogManager =
  requireCatalogPermission('catalog:manage')

export const requireCatalogStatusManager =
  requireCatalogPermission('catalog:change-status')

export const requireCatalogSafetyModerator =
  requireCatalogPermission('catalog:suspend-safety')

export const requireCatalogDeletion =
  requireCatalogPermission('catalog:delete')

export const requireCatalogImageManager =
  requireCatalogPermission('catalog:image-manage')

export const requireCatalogImageProposer =
  requireCatalogPermission('catalog:image-propose')

export const requireCatalogImageApprover =
  requireCatalogPermission('catalog:image-approve')