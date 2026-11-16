
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

import type {
  Request,
  Response,
  NextFunction,
} from 'express'

import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/app-error.js'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const uploadsDirectory = resolve(
  process.cwd(),
  '../web/public/exercises/uploads',
)

function detectImageExtension(
  buffer: Buffer,
): 'jpg' | 'png' | 'webp' | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg'
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ]),
    )
  ) {
    return 'png'
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp'
  }

  return null
}

export async function uploadExerciseImageController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const variationId = request.params.variationId

    if (
      typeof variationId !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(variationId)
    ) {
      throw new AppError(
        'Identificador da variação inválido.',
        400,
      )
    }

    const variation =
      await prisma.exerciseVariation.findFirst({
        where: {
          id: variationId,
          trainerId: null,
        },
        select: { id: true },
      })

    if (!variation) {
      throw new AppError(
        'Variação global não encontrada.',
        404,
      )
    }

    if (!Buffer.isBuffer(request.body)) {
      throw new AppError(
        'Envie um arquivo de imagem válido.',
        400,
      )
    }

    const buffer = request.body as Buffer

    if (
      buffer.length === 0 ||
      buffer.length > MAX_IMAGE_SIZE
    ) {
      throw new AppError(
        'A imagem deve ter no máximo 5 MB.',
        400,
      )
    }

    const extension = detectImageExtension(buffer)

    if (!extension) {
      throw new AppError(
        'Formato inválido. Use JPG, PNG ou WebP.',
        400,
      )
    }

    const fileName = `${randomUUID()}.${extension}`

    await mkdir(uploadsDirectory, {
      recursive: true,
    })

    await writeFile(
      join(uploadsDirectory, fileName),
      buffer,
      { flag: 'wx' },
    )

    return response.status(201).json({
      message: 'Imagem enviada com sucesso.',
      imageUrl: `/exercises/uploads/${fileName}`,
    })
  } catch (error) {
    next(error)
  }
}
