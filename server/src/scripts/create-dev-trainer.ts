import 'dotenv/config'

import { prisma } from '../lib/prisma.js'
import { hashPassword } from '../lib/password.js'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Este script não pode ser executado em produção.')
  }

  const email = process.env.DEV_TRAINER_EMAIL?.trim().toLowerCase()
  const password = process.env.DEV_TRAINER_PASSWORD

  if (!email || !password || password.length < 12) {
    throw new Error(
      'Configure DEV_TRAINER_EMAIL e DEV_TRAINER_PASSWORD (mínimo de 12 caracteres).',
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('Já existe um usuário com esse e-mail.')
  }

  const passwordHash = await hashPassword(password)

  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: 'Organização de Desenvolvimento',
        slug: `dev-${crypto.randomUUID()}`,
      },
    })

    const user = await tx.user.create({
      data: {
        name: 'Treinador de Desenvolvimento',
        email,
        passwordHash,
        role: 'TRAINER',
      },
    })

    await tx.trainer.create({
      data: {
        userId: user.id,
      },
    })

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: 'OWNER',
      },
    })
  })

  console.log('Treinador de desenvolvimento criado com sucesso.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
