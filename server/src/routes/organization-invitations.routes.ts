
import { createHash, randomBytes } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { hashPassword } from '../lib/password.js'

import { requireAuth } from '../middlewares/auth.middleware.js'
import { requirePlatformManager } from '../middlewares/platform-manager.middleware.js'

import { strongPasswordSchema } from '../schemas/organization-management.schema.js'

const invitationParamsSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
})

const createInvitationSchema = z.object({
  organizationId: z.uuid(),
  email: z.email().trim().toLowerCase(),
  role: z.enum(['TRAINER', 'ADMIN']),
})

const acceptInvitationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  password: strongPasswordSchema,
})

function hashToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex')
}

function validatePasswordIdentity(
  password: string,
  name: string,
  email: string,
): void {
  const normalizedPassword = password.toLowerCase()

  const nameParts = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((part) => part.length >= 3)

  const emailLocalPart = email
    .split('@')[0]
    .toLowerCase()

  if (
    [...nameParts, emailLocalPart].some(
      (part) =>
        part.length >= 3 &&
        normalizedPassword.includes(part),
    )
  ) {
    throw new AppError(
      'A senha não pode conter seu nome ou e-mail.',
      400,
    )
  }
}

export const ownerInvitationRoutes = Router()
export const publicInvitationRoutes = Router()

// Proprietário técnico e gestores operacionais globais
// podem emitir convites para organizações ativas.
ownerInvitationRoutes.use(requireAuth)
ownerInvitationRoutes.use(requirePlatformManager)

ownerInvitationRoutes.post('/', async (req, res) => {
  const data = createInvitationSchema.parse(req.body)

  const organization = await prisma.organization.findUnique({
    where: { id: data.organizationId },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  })

  if (!organization?.isActive) {
    throw new AppError(
      'Organização não encontrada ou inativa.',
      404,
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })

  if (existingUser) {
    throw new AppError(
      'Este e-mail já possui uma conta. Use o gerenciamento de membros.',
      409,
    )
  }

  // Invalida convites anteriores ainda não utilizados
  // para o mesmo e-mail e organização.
  await prisma.organizationInvitation.deleteMany({
    where: {
      organizationId: data.organizationId,
      email: data.email,
      acceptedAt: null,
    },
  })

  const token = randomBytes(32).toString('hex')

  const expiresAt = new Date(
    Date.now() + 48 * 60 * 60 * 1000,
  )

  const invitation = await prisma.organizationInvitation.create({
    data: {
      organizationId: data.organizationId,
      email: data.email,
      role: data.role,
      tokenHash: hashToken(token),
      expiresAt,
    },
  })

  res.status(201).json({
    invitationId: invitation.id,
    organization: organization.name,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    token,
  })
})

// Consulta pública: exige conhecimento do token.
publicInvitationRoutes.get('/:token', async (req, res) => {
  const { token } = invitationParamsSchema.parse(req.params)

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      organization: {
        select: {
          name: true,
          isActive: true,
        },
      },
    },
  })

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date() ||
    !invitation.organization.isActive
  ) {
    throw new AppError(
      'Convite inválido, expirado ou já utilizado.',
      404,
    )
  }

  res.status(200).json({
    email: invitation.email,
    role: invitation.role,
    organization: invitation.organization.name,
    expiresAt: invitation.expiresAt,
  })
})

// Cadastro e consumo do convite em uma única transação.
publicInvitationRoutes.post(
  '/:token/accept',
  async (req, res) => {
    const { token } =
      invitationParamsSchema.parse(req.params)

    const data = acceptInvitationSchema.parse(req.body)

    const tokenHash = hashToken(token)

    const invitation =
      await prisma.organizationInvitation.findUnique({
        where: { tokenHash },
        include: {
          organization: {
            select: { isActive: true },
          },
        },
      })

    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt <= new Date() ||
      !invitation.organization.isActive
    ) {
      throw new AppError(
        'Convite inválido, expirado ou já utilizado.',
        404,
      )
    }

    validatePasswordIdentity(
      data.password,
      data.name,
      invitation.email,
    )

    const passwordHash =
      await hashPassword(data.password)

    const user = await prisma.$transaction(
      async (tx) => {
        const consumed =
          await tx.organizationInvitation.updateMany({
            where: {
              id: invitation.id,
              acceptedAt: null,
              expiresAt: { gt: new Date() },
              organization: { isActive: true },
            },
            data: {
              acceptedAt: new Date(),
            },
          })

        if (consumed.count !== 1) {
          throw new AppError(
            'Este convite não está mais disponível.',
            409,
          )
        }

        const createdUser = await tx.user.create({
          data: {
            name: data.name,
            email: invitation.email,
            passwordHash,
            role: 'TRAINER',
            isActive: true,

            // Convites nunca concedem permissões globais.
            isPlatformAdmin: false,
            isPlatformManager: false,
            canReviewExercises: false,
          },
        })

        await tx.trainer.create({
          data: {
            userId: createdUser.id,
          },
        })

        await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            userId: createdUser.id,
            role: invitation.role,
            isActive: true,
          },
        })

        return createdUser
      },
    )

    res.status(201).json({
      message: 'Conta criada com sucesso. Faça seu login.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  },
)
