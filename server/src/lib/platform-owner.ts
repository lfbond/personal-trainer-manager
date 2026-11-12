
import { AppError } from './app-error.js'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getPlatformOwnerUserId(): string {
  const userId = process.env.PLATFORM_OWNER_USER_ID?.trim()

  if (!userId || !UUID_PATTERN.test(userId)) {
    throw new Error(
      'PLATFORM_OWNER_USER_ID não configurado com um UUID válido.',
    )
  }

  return userId.toLowerCase()
}

export function isPlatformOwner(
  userId: string | null | undefined,
): boolean {
  if (!userId) {
    return false
  }

  return userId.toLowerCase() === getPlatformOwnerUserId()
}

export function assertPlatformOwner(userId: string): void {
  if (!isPlatformOwner(userId)) {
    throw new AppError(
      'Operação exclusiva do fundador da plataforma.',
      403,
    )
  }
}
