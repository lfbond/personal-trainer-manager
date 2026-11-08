
import 'dotenv/config'

import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { prisma } from '../src/lib/prisma.js'

const APPLY = process.argv.includes('--apply')

// Este script fica em server/scripts/.
// As imagens ficam em web/public/exercises/.
const imagesDirectory = fileURLToPath(
  new URL('../../web/public/exercises/', import.meta.url),
)

const exerciseCodePattern = /^\d{2}-(MC|FW)-\d{3}\.webp$/i

type ImageEntry = {
  code: string
  imageUrl: string
}

async function collectImages(
  directory: string,
  relativeDirectory = '',
): Promise<ImageEntry[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  })

  const images: ImageEntry[] = []

  for (const entry of entries) {
    const relativePath = path.posix.join(
      relativeDirectory,
      entry.name,
    )

    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      // Pastas de revisão não entram na importação.
      if (entry.name.startsWith('_')) continue

      images.push(
        ...(await collectImages(absolutePath, relativePath)),
      )

      continue
    }

    if (!entry.isFile()) continue
    if (!exerciseCodePattern.test(entry.name)) continue

    images.push({
      code: entry.name.replace(/\.webp$/i, '').toUpperCase(),
      imageUrl: `/exercises/${relativePath}`,
    })
  }

  return images
}

async function main() {
  console.log('\n=== IMPORTAÇÃO DE IMAGENS ===')
  console.log(APPLY ? 'MODO: GRAVAÇÃO' : 'MODO: SIMULAÇÃO')
  console.log(`Pasta: ${imagesDirectory}\n`)

  const images = await collectImages(imagesDirectory)

  // Um mesmo código em duas pastas é ambíguo.
  // Por segurança, nenhum dos dois será importado.
  const grouped = new Map<string, ImageEntry[]>()

  for (const image of images) {
    const existing = grouped.get(image.code) ?? []
    existing.push(image)
    grouped.set(image.code, existing)
  }

  const duplicated = [...grouped.entries()]
    .filter(([, entries]) => entries.length > 1)

  const validImages = [...grouped.entries()]
    .filter(([, entries]) => entries.length === 1)
    .map(([, entries]) => entries[0])

  const variations = await prisma.exerciseVariation.findMany({
    where: {
      code: {
        in: validImages.map((image) => image.code),
      },
    },
    select: {
      code: true,
      imageUrl: true,
      imageReviewStatus: true,
    },
  })

  const variationsByCode = new Map(
    variations.map((variation) => [
      variation.code,
      variation,
    ]),
  )

  let imported = 0
  let skipped = 0
  let notFound = 0
  let failed = 0

  for (const image of validImages) {
    const variation = variationsByCode.get(image.code)

    if (!variation) {
      console.log(`[NÃO ENCONTRADO] ${image.code}`)
      notFound++
      continue
    }

    if (
      variation.imageReviewStatus === 'APPROVED' ||
      variation.imageUrl
    ) {
      console.log(`[PRESERVADO] ${image.code}`)
      skipped++
      continue
    }

    if (!APPLY) {
      console.log(
        `[SIMULAÇÃO] ${image.code} -> ${image.imageUrl}`,
      )
      imported++
      continue
    }

    try {
      // updateMany mantém a proteção também no momento
      // da gravação, caso o registro tenha mudado.
      const result = await prisma.exerciseVariation.updateMany({
        where: {
          code: image.code,
          imageUrl: null,
          imageReviewStatus: {
            not: 'APPROVED',
          },
        },
        data: {
          imageUrl: image.imageUrl,
          imageReviewStatus: 'PENDING',
          imageReviewNotes:
            'Imagem ilustrativa provisória. ' +
            'Aguardando revisão técnica por profissional ' +
            'de Educação Física.',
          imageReviewedAt: null,
        },
      })

      if (result.count === 1) {
        console.log(`[IMPORTADO] ${image.code}`)
        imported++
      } else {
        console.log(`[PRESERVADO] ${image.code}`)
        skipped++
      }
    } catch (error) {
      console.error(`[ERRO] ${image.code}`, error)
      failed++
    }
  }

  for (const [code, entries] of duplicated) {
    console.warn(
      `[DUPLICADO] ${code}: ${entries
        .map((entry) => entry.imageUrl)
        .join(', ')}`,
    )
  }

  console.log('\n=== RESUMO ===')
  console.log(`Arquivos identificados: ${images.length}`)
  console.log(`Códigos duplicados: ${duplicated.length}`)
  console.log(
    `${APPLY ? 'Importados' : 'Elegíveis para importação'}: ${imported}`,
  )
  console.log(`Preservados: ${skipped}`)
  console.log(`Não encontrados no banco: ${notFound}`)
  console.log(`Erros: ${failed}`)

  if (!APPLY) {
    console.log(
      '\nNenhuma alteração foi realizada no banco de dados.',
    )
  }
}

main()
  .catch((error) => {
    console.error('Falha na importação:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
