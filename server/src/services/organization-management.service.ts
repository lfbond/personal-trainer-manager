
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { hashPassword } from '../lib/password.js'

type OrganizationRole = 'OWNER' | 'ADMIN' | 'TRAINER'

interface CreateOrganizationInput {
  name: string
  slug: string
  ownerUserId: string
}

interface CreateTrainerInput {
  organizationId: string
  name: string
  email: string
  password: string
  role?: 'ADMIN' | 'TRAINER'
}

interface UpdateMemberInput {
  organizationId: string
  memberId: string
  isActive?: boolean
  role?: OrganizationRole
}

export async function listOrganizations() {
  return prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
          students: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createOrganization({
  name,
  slug,
  ownerUserId,
}: CreateOrganizationInput) {
  const normalizedName = name.trim()
  const normalizedSlug = slug.trim().toLowerCase()

  if (!normalizedName || !normalizedSlug) {
    throw new AppError(
      'Nome e identificador da organização são obrigatórios.',
      400,
    )
  }

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: {
      id: true,
      isActive: true,
      role: true,
    },
  })

  if (!owner || !owner.isActive || owner.role !== 'TRAINER') {
    throw new AppError(
      'O proprietário deve possuir uma conta ativa de treinador.',
      400,
    )
  }

  const existingOrganization = await prisma.organization.findUnique({
    where: { slug: normalizedSlug },
    select: { id: true },
  })

  if (existingOrganization) {
    throw new AppError(
      'Já existe uma organização com este identificador.',
      409,
    )
  }

  return prisma.$transaction(async (tx) => {
    const trainer = await tx.trainer.upsert({
      where: { userId: ownerUserId },
      update: {},
      create: { userId: ownerUserId },
    })

    const organization = await tx.organization.create({
      data: {
        name: normalizedName,
        slug: normalizedSlug,
      },
    })

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: ownerUserId,
        role: 'OWNER',
      },
    })

    return {
      ...organization,
      owner: {
        userId: ownerUserId,
        trainerId: trainer.id,
      },
    }
  })
}

export async function listOrganizationMembers(
  organizationId: string,
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  })

  if (!organization) {
    throw new AppError('Organização não encontrada.', 404)
  }

  return prisma.organizationMember.findMany({
    where: { organizationId },
    select: {
      id: true,
      role: true,
      isActive: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          trainer: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createOrganizationTrainer({
  organizationId,
  name,
  email,
  password,
  role = 'TRAINER',
}: CreateTrainerInput) {
  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedName || !normalizedEmail || !password) {
    throw new AppError(
      'Nome, e-mail e senha são obrigatórios.',
      400,
    )
  }

  if (role !== 'TRAINER' && role !== 'ADMIN') {
    throw new AppError('Permissão inválida.', 400)
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, isActive: true },
  })

  if (!organization || !organization.isActive) {
    throw new AppError(
      'Organização não encontrada ou inativa.',
      404,
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })

  if (existingUser) {
    throw new AppError(
      'Já existe um usuário cadastrado com este e-mail.',
      409,
    )
  }

  const passwordHash = await hashPassword(password)

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        role: 'TRAINER',
      },
    })

    const trainer = await tx.trainer.create({
      data: { userId: user.id },
    })

    const membership = await tx.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        role,
      },
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      trainerId: trainer.id,
      membershipId: membership.id,
      role: membership.role,
    }
  })
}


export async function updateOrganizationMember({
  organizationId,
  memberId,
  isActive,
  role,
}: UpdateMemberInput) {
  if (isActive === undefined && role === undefined) {
    throw new AppError(
      'Informe pelo menos um campo para atualização.',
      400,
    )
  }

  if (
    role !== undefined &&
    !['ADMIN', 'TRAINER'].includes(role)
  ) {
    throw new AppError(
      'A transferência de propriedade exige um procedimento específico.',
      403,
    )
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.organizationMember.updateMany({
      where: {
        id: memberId,
        organizationId,
        role: {
          not: 'OWNER',
        },
      },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(role !== undefined && { role }),
      },
    })

    if (result.count !== 1) {
      throw new AppError(
        'Membro não encontrado ou alteração não permitida.',
        403,
      )
    }

    return tx.organizationMember.findUniqueOrThrow({
      where: { id: memberId },
      select: {
        id: true,
        role: true,
        isActive: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  })
}

