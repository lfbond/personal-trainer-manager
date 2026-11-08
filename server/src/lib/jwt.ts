
import { SignJWT, jwtVerify } from 'jose'
import { env } from './env.js'

const secret = new TextEncoder().encode(env.JWT_SECRET)

export async function signAccessToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
  })

  if (!payload.sub) {
    throw new Error('Token sem identificação de usuário.')
  }

  return payload.sub
}
