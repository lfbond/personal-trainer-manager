
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'csv-parse/sync'

import { prisma } from '../lib/prisma.js'

import type {
  ExerciseCategory,
  ExerciseLevel,
  MuscleGroup,
} from '../generated/prisma/client.js'

type CatalogRow = {
  codigo: string
  codigo_base: string
  grupo: string
  categoria: string
  nivel: string
  exercicio_base: string
  variacao: string
  nome: string
  equipamento: string
  musculos_principais: string
  musculos_auxiliares: string
  instrucoes: string
  cuidados: string
  status: string
  imagem_url: string
}

const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  Peitoral: 'CHEST',
  Costas: 'BACK',
  Ombros: 'SHOULDERS',
  'Bíceps': 'BICEPS',
  'Tríceps': 'TRICEPS',
  'Quadríceps': 'LEGS',
  'Posteriores de Coxa': 'LEGS',
  'Glúteos': 'GLUTES',
  Panturrilhas: 'CALVES',
  'Abdômen/Core': 'CORE',
}

const CATEGORIES: Record<string, ExerciseCategory> = {
  'Máquina/Cabo': 'MACHINE_CABLE',
  'Peso Livre': 'FREE_WEIGHT',
}

const LEVELS: Record<string, ExerciseLevel> = {
  Iniciante: 'BEGINNER',
  'Intermediário': 'INTERMEDIATE',
  'Avançado': 'ADVANCED',
}

const REQUIRED_COLUMNS: (keyof CatalogRow)[] = [
  'codigo',
  'codigo_base',
  'grupo',
  'categoria',
  'nivel',
  'exercicio_base',
  'variacao',
  'nome',
  'equipamento',
  'musculos_principais',
  'musculos_auxiliares',
  'instrucoes',
  'cuidados',
  'status',
  'imagem_url',
]

const EDITORIAL_STATUSES = new Set([
  'CANDIDATO_REVISAO',
  'REVISAR_GRUPO_PRIMARIO',
])

const REQUIRED_VALUES: (keyof CatalogRow)[] = [
  'codigo',
  'codigo_base',
  'grupo',
  'categoria',
  'nivel',
  'exercicio_base',
  'nome',
  'status',
]

function optionalText(value: string | undefined) {
  return value?.trim() || null
}

function validateRows(rows: CatalogRow[]) {
  const errors: string[] = []
  const codes = new Set<string>()

  const bases = new Map<
    string,
    { name: string; muscleGroup: MuscleGroup }
  >()

  rows.forEach((row, index) => {
    const line = index + 2

    for (const field of REQUIRED_VALUES) {
      if (!row[field]?.trim()) {
        errors.push(`Linha ${line}: ${field} vazio`)
      }
    }

    if (codes.has(row.codigo)) {
      errors.push(
        `Linha ${line}: código duplicado ${row.codigo}`,
      )
    }

    codes.add(row.codigo)

    const muscleGroup = MUSCLE_GROUPS[row.grupo]

    if (!muscleGroup) {
      errors.push(
        `Linha ${line}: grupo inválido ${row.grupo}`,
      )
    }

    if (!CATEGORIES[row.categoria]) {
      errors.push(
        `Linha ${line}: categoria inválida ${row.categoria}`,
      )
    }

    if (!LEVELS[row.nivel]) {
      errors.push(
        `Linha ${line}: nível inválido ${row.nivel}`,
      )
    }

    if (!EDITORIAL_STATUSES.has(row.status)) {
      errors.push(
        `Linha ${line}: status editorial inválido ${row.status}`,
      )
    }

    if (/pegada reversa/i.test(row.nome)) {
      errors.push(
        `Linha ${line}: exercício excluído ${row.nome}`,
      )
    }

    const existing = bases.get(row.codigo_base)

    if (
      existing &&
      (existing.name !== row.exercicio_base ||
        existing.muscleGroup !== muscleGroup)
    ) {
      errors.push(
        `Linha ${line}: conflito no exercício-base ${row.codigo_base}`,
      )
    } else if (!existing && row.codigo_base && muscleGroup) {
      bases.set(row.codigo_base, {
        name: row.exercicio_base,
        muscleGroup,
      })
    }
  })

  if (errors.length > 0) {
    throw new Error(
      `Catálogo inválido:\n${errors.join('\n')}`,
    )
  }

  return bases
}

async function main() {
  const args = process.argv.slice(2)

  if (
    args.length !== 1 ||
    !['--dry-run', '--execute'].includes(args[0])
  ) {
    throw new Error(
      'Use --dry-run para simular ou --execute para importar.',
    )
  }

  const execute = args[0] === '--execute'

  // Proteção: este importador só pode operar
  // no banco PostgreSQL local de desenvolvimento.
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL não configurada.')
  }

  const url = new URL(databaseUrl)

  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.port !== '5432' ||
    decodeURIComponent(url.pathname.slice(1)) !==
      'personal_trainer_manager'
  ) {
    throw new Error(
      'Conexão não autorizada: esperado banco local personal_trainer_manager na porta 5432.',
    )
  }

  const filePath = resolve(
    process.cwd(),
    'src/data/exercise-catalog.csv',
  )

  const csv = readFileSync(filePath, 'utf8')

  const header = parse(csv, {
    to_line: 1,
    bom: true,
  })[0] as string[]

  for (const column of REQUIRED_COLUMNS) {
    if (!header.includes(column)) {
      throw new Error(`Coluna ausente: ${column}`)
    }
  }

  const rows = parse(csv, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as CatalogRow[]

  if (rows.length === 0) {
    throw new Error('O catálogo está vazio.')
  }

  const bases = validateRows(rows)

  console.log('\n=== IMPORTADOR DE EXERCÍCIOS ===')
  console.log(
    `Modo: ${execute ? 'EXECUÇÃO' : 'SIMULAÇÃO'}`,
  )
  console.log(`Exercícios-base no CSV: ${bases.size}`)
  console.log(`Variações no CSV: ${rows.length}`)
  console.log(
    `Registros com revisão pendente: ${
      rows.filter(
        (row) =>
          row.status === 'REVISAR_GRUPO_PRIMARIO',
      ).length
    }`,
  )

  // Pré-verificação de códigos já existentes.
  const baseCodes = [...bases.keys()]
  const variationCodes = rows.map((row) => row.codigo)

  const [existingBases, existingVariations] =
    await Promise.all([
      prisma.exercise.findMany({
        where: { code: { in: baseCodes } },
        select: {
          code: true,
          name: true,
          muscleGroup: true,
        },
      }),
      prisma.exerciseVariation.findMany({
        where: { code: { in: variationCodes } },
        select: {
          code: true,
          name: true,
          exercise: { select: { code: true } },
        },
      }),
    ])

  const existingBaseCodes = new Set(
    existingBases.map((item) => item.code),
  )

  const existingVariationCodes = new Set(
    existingVariations.map((item) => item.code),
  )

  for (const existing of existingBases) {
    const expected = bases.get(existing.code)

    if (
      !expected ||
      expected.name !== existing.name ||
      expected.muscleGroup !== existing.muscleGroup
    ) {
      throw new Error(
        `Conflito com exercício-base existente: ${existing.code}`,
      )
    }
  }

  const rowByCode = new Map(
    rows.map((row) => [row.codigo, row]),
  )

  for (const existing of existingVariations) {
    const expected = rowByCode.get(existing.code)

    if (
      !expected ||
      existing.name !== expected.nome ||
      existing.exercise.code !== expected.codigo_base
    ) {
      throw new Error(
        `Conflito com variação existente: ${existing.code}`,
      )
    }
  }

  const newBaseCount =
    bases.size - existingBaseCodes.size

  const newVariationCount =
    rows.length - existingVariationCodes.size

    const editorialReviewCodes = rows
      .filter((row) => row.status === 'REVISAR_GRUPO_PRIMARIO')
      .map((row) => row.codigo)

    console.log(
      `Variações sinalizadas para revisão editorial: ${editorialReviewCodes.length}`,
    )

  console.log('\n--- PLANEJAMENTO ---')
  console.log(`Novos exercícios-base: ${newBaseCount}`)
  console.log(`Exercícios-base existentes: ${existingBases.length}`)
  console.log(`Novas variações: ${newVariationCount}`)
  console.log(
    `Variações existentes: ${existingVariations.length}`,
  )

  if (!execute) {
    console.log('\nSIMULAÇÃO CONCLUÍDA')
    console.log('Nenhuma alteração realizada no banco.')
    return
  }

  console.log('\nIniciando transação Prisma...')

  await prisma.$transaction(
    async (tx) => {
      const baseIds = new Map<string, string>()

      for (const [code, base] of bases) {
        const exercise = await tx.exercise.upsert({
          where: { code },
          update: {},
          create: {
            code,
            name: base.name,
            muscleGroup: base.muscleGroup,
          },
          select: { id: true },
        })

        baseIds.set(code, exercise.id)
      }

      for (const row of rows) {
        const exerciseId = baseIds.get(row.codigo_base)

        if (!exerciseId) {
          throw new Error(
            `Exercício-base não encontrado: ${row.codigo_base}`,
          )
        }

        await tx.exerciseVariation.upsert({
          where: { code: row.codigo },
          update: {
            name: row.nome,
            equipment: optionalText(row.equipamento),
            subgroup: optionalText(row.grupo),
            description: optionalText(row.variacao),
            instructions: optionalText(row.instrucoes),
            safetyNotes: optionalText(row.cuidados),
            muscleExplanation: [
              row.musculos_principais &&
                `Principais: ${row.musculos_principais}`,
              row.musculos_auxiliares &&
                `Auxiliares: ${row.musculos_auxiliares}`,
            ]
              .filter(Boolean)
              .join(' | ') || null,
            needsEditorialReview:
              row.status === 'REVISAR_GRUPO_PRIMARIO',
          },
          create: {
            exerciseId,
            trainerId: null,
            code: row.codigo,
            name: row.nome,
            category: CATEGORIES[row.categoria],
            level: LEVELS[row.nivel],
            equipment: optionalText(row.equipamento),
            subgroup: optionalText(row.grupo),
            description: optionalText(row.variacao),
            instructions: optionalText(row.instrucoes),
            safetyNotes: optionalText(row.cuidados),
            muscleExplanation: [
              row.musculos_principais &&
                `Principais: ${row.musculos_principais}`,
              row.musculos_auxiliares &&
                `Auxiliares: ${row.musculos_auxiliares}`,
            ]
              .filter(Boolean)
              .join(' | ') || null,
            imageUrl: optionalText(row.imagem_url),
            needsEditorialReview:
              row.status === 'REVISAR_GRUPO_PRIMARIO',
            status: 'DRAFT',
          },
        })
      }
    },
    {
      maxWait: 10000,
      timeout: 120000,
    },
  )

  console.log('\nIMPORTAÇÃO CONCLUÍDA')
  console.log(`Novos exercícios-base previstos: ${newBaseCount}`)
  console.log(`Novas variações previstas: ${newVariationCount}`)
  console.log('Novas variações criadas em DRAFT.')
  console.log('Registros existentes preservados.')
}

main()
  .catch((error) => {
    console.error('\nERRO NA IMPORTAÇÃO:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })