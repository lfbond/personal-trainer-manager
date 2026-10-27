import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'

export async function getTrainerContext(userId: string) {
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

  if (user.organizationMemberships.length === 0) {
    throw new AppError(
      'Treinador sem organização ativa.',
      403,
    )
  }

  if (user.organizationMemberships.length > 1) {
    throw new AppError(
      'É necessário selecionar uma organização.',
      400,
    )
  }

  return {
    trainerId: user.trainer.id,
    organizationId: user.organizationMemberships[0]!.organizationId,
  }
}