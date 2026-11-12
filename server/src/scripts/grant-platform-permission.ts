
import 'dotenv/config'

import { prisma } from '../lib/prisma.js'
import { getPlatformOwnerUserId } from '../lib/platform-owner.js'

type Permission = 'manager' | 'reviewer'

const permissionFields = {
  manager: 'isPlatformManager',
  reviewer: 'canReviewExercises',
} as const

async function main(): Promise<void> {
  const [emailArgument, permissionArgument] = process.argv.slice(2)

  const email = emailArgument?.trim().toLowerCase()
  const permission = permissionArgument as Permission | undefined

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !permission ||
    !Object.prototype.hasOwnProperty.call(
      permissionFields,
      permission,
    )
  ) {
    throw new Error(
      'Uso: npm run permissions:grant -- <email> <manager|reviewer>',
    )
  }

  // Exige a configuração da identidade do fundador.
  const ownerUserId = getPlatformOwnerUserId()

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: {
      id: true,
      isActive: true,
      isPlatformAdmin: true,
    },
  })

  if (!owner?.isActive || !owner.isPlatformAdmin) {
    throw new Error(
      'O fundador precisa possuir uma conta ativa com permissão administrativa.',
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      isPlatformAdmin: true,
      isPlatformManager: true,
      canReviewExercises: true,
    },
  })

  if (!user) {
    throw new Error(
      'Usuário não encontrado. O convite precisa ser aceito primeiro.',
    )
  }

  if (!user.isActive) {
    throw new Error('Não é possível autorizar uma conta inativa.')
  }

  if (user.id === ownerUserId || user.isPlatformAdmin) {
    throw new Error(
      'Este script não pode modificar contas administrativas técnicas.',
    )
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data:
      permission === 'manager'
        ? { isPlatformManager: true }
        : { canReviewExercises: true },
    select: {
      name: true,
      email: true,
      isPlatformAdmin: true,
      isPlatformManager: true,
      canReviewExercises: true,
    },
  })

  console.log('\nPermissão concedida com sucesso.')
  console.table([updatedUser])
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : error,
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
