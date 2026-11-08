import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { getRequestedOrganizationId } from '../lib/organization-request-context.js'

export async function getTrainerContext(
  userId: string,
  selectedOrganizationId?: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActive: true,
      trainer: {
        select: {
          id: true,
        },
      },
      organizationMemberships: {
        where: {
          isActive: true,
          role: {
            in: ['OWNER', 'ADMIN', 'TRAINER'],
          },
          organization: {
            isActive: true,
          },
        },
        select: {
          organizationId: true,
        },
      },
    },
  })

  if (!user?.isActive || !user.trainer) {
    throw new AppError('Treinador não autorizado.', 403)
  }

  const memberships = user.organizationMemberships

  if (memberships.length === 0) {
    throw new AppError('Treinador sem organização ativa.', 403)
  }

  const requestedOrganizationId =
    selectedOrganizationId ?? getRequestedOrganizationId()

  if (requestedOrganizationId) {
    const membership = memberships.find(
      (item) => item.organizationId === requestedOrganizationId,
    )

    if (!membership) {
      throw new AppError(
        'Você não possui permissão nesta organização.',
        403,
      )
    }

    return {
      trainerId: user.trainer.id,
      organizationId: membership.organizationId,
    }
  }

  if (memberships.length > 1) {
    throw new AppError(
      'É necessário selecionar uma organização.',
      400,
    )
  }

  return {
    trainerId: user.trainer.id,
    organizationId: memberships[0]!.organizationId,
  }
}