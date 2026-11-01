import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'
import { verifyPassword } from '../lib/password.js'
import { signAccessToken } from '../lib/jwt.js'

type LoginInput = {
  email: string
  password: string
}

export async function login({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive || !user.passwordHash) {
    throw new AppError('E-mail ou senha inválidos.', 401)
  }

  const passwordMatches = await verifyPassword(
    password,
    user.passwordHash,
  )

  if (!passwordMatches) {
    throw new AppError('E-mail ou senha inválidos.', 401)
  }

  const accessToken = await signAccessToken(user.id)

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  }
}
