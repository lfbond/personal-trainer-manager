
import { Router } from 'express'

import { prisma } from '../lib/prisma.js'

import { requireAuth } from '../middlewares/auth.middleware.js'
import { requirePlatformAdmin } from '../middlewares/platform-admin.middleware.js'
import { requireOrganizationAdmin } from '../middlewares/organization-admin.middleware.js'
import { requireOrganizationOwner } from '../middlewares/organization-owner.middleware.js'

import {
  createOrganizationTrainerSchema,
} from '../schemas/organization-management.schema.js'

import {
  listOrganizationsController,
  createOrganizationController,
  listOrganizationMembersController,
  createOrganizationTrainerController,
  updateOrganizationMemberController,
} from '../controllers/organization-management.controller.js'

export const platformOrganizationRoutes = Router()

platformOrganizationRoutes.use(requireAuth)
platformOrganizationRoutes.use(requirePlatformAdmin)

platformOrganizationRoutes.get(
  '/eligible-owners',
  async (_req, res) => {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        role: 'TRAINER',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    })

    res.status(200).json(users)
  },
)

platformOrganizationRoutes.get(
  '/',
  listOrganizationsController,
)

platformOrganizationRoutes.post(
  '/',
  createOrganizationController,
)

export const organizationManagementRoutes = Router()

organizationManagementRoutes.use(requireAuth)

organizationManagementRoutes.get(
  '/mine',
  async (_req, res) => {
    const userId = res.locals.userId as string | undefined

    if (!userId) {
      res.status(401).json({
        message: 'Usuário não autenticado.',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    })

    if (!user?.isActive) {
      res.status(403).json({
        message: 'Usuário sem acesso ativo.',
      })
      return
    }

    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId,
        isActive: true,
        role: { in: ['OWNER', 'ADMIN'] },
        organization: {
          isActive: true,
        },
      },
      select: {
        id: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        organization: { name: 'asc' },
      },
    })

    res.status(200).json(memberships)
  },
)

organizationManagementRoutes.get(
  '/:organizationId/members',
  requireOrganizationAdmin,
  listOrganizationMembersController,
)

organizationManagementRoutes.post(
  '/:organizationId/trainers',
  requireOrganizationAdmin,
  (req, res, next) => {
    try {
      const data = createOrganizationTrainerSchema.parse(
        req.body,
      )

      req.body = data

      if (data.role === 'ADMIN') {
        return requireOrganizationOwner(req, res, next)
      }

      return next()
    } catch (error) {
      return next(error)
    }
  },
  createOrganizationTrainerController,
)

organizationManagementRoutes.patch(
  '/:organizationId/members/:memberId',
  requireOrganizationOwner,
  updateOrganizationMemberController,
)
