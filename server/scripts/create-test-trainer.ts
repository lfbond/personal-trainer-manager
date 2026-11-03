import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/lib/password.js'

async function main() {
  const email = 'treinador.b@example.com'

  const password = process.env.TEST_TRAINER_PASSWORD

  if (!password || password.length < 12) {
    throw new Error(
      'Defina TEST_TRAINER_PASSWORD com pelo menos 12 caracteres.',
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('O Treinador B já está cadastrado.')
  }

  const organizations = await prisma.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  })

  if (organizations.length !== 1) {
    throw new Error(
      'É necessário selecionar explicitamente a organização de teste.',
    )
  }

  const organizationId = organizations[0].id
  const passwordHash = await hashPassword(password)

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: 'Treinador Teste B',
        email,
        passwordHash,
        role: 'TRAINER',
        isActive: true,
      },
    })

    await tx.trainer.create({
      data: {
        userId: createdUser.id,
      },
    })

    await tx.organizationMember.create({
      data: {
        userId: createdUser.id,
        organizationId,
        role: 'TRAINER',
        isActive: true,
      },
    })

    return createdUser
  })

  console.log('Treinador de teste criado com sucesso.')
  console.log('E-mail:', user.email)
  console.log('Organização:', organizations[0].name)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })