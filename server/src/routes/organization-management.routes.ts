
import { Router } from 'express'

import { prisma } from '../lib/prisma.js'

import { requireAuth } from '../middlewares/auth.middleware.js'
import { requirePlatformManager } from '../middlewares/platform-manager.middleware.js'
import { requireOrganizationAdmin } from '../middlewares/organization-admin.middleware.js'
import { requireOrganizationOwner } from '../middlewares/organization-owner.middleware.js'

import {
  createOrganizationTrainerSchema,
} from '../schemas/organization-management.schema.js'

import {
  listOrganizationsController,
  createOrganizationController,
  updateOrganizationController,
  listOrganizationMembersController,
  createOrganizationTrainerController,
  updateOrganizationMemberController,
} from '../controllers/organization-management.controller.js'

export const platformOrganizationRoutes = Router()

platformOrganizationRoutes.use(requireAuth)
platformOrganizationRoutes.use(requirePlatformManager)

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

// Gestão operacional global:
// editar, desativar e reativar organizações.
platformOrganizationRoutes.patch(
  '/:organizationId',
  updateOrganizationController,
)

export const organizationManagementRoutes = Router()

organizationManagementRoutes.use(requireAuth)

// Lista todas as organizações ativas às quais o usuário
// possui vínculo ativo, independentemente do papel local.
//
// OWNER e ADMIN continuam com suas permissões de gestão.
// TRAINER pode selecionar a organização para trabalhar
// com alunos, exercícios e treinos.
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
        role: { in: ['OWNER', 'ADMIN', 'TRAINER'] },
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

// Gestão de membros: somente OWNER e ADMIN.
organizationManagementRoutes.get(
  '/:organizationId/members',
  requireOrganizationAdmin,
  listOrganizationMembersController,
)

// Cadastro administrativo de treinadores.
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

// Atualização de membros: somente OWNER e ADMIN.
organizationManagementRoutes.patch(
  '/:organizationId/members/:memberId',
  requireOrganizationAdmin,
  updateOrganizationMemberController,
)
