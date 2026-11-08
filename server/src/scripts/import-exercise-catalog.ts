
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

type BaseData = {
  name: string
  muscleGroup: MuscleGroup
}

type Change = {
  code: string
  field: string
  previous: string | null
  next: string | null
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
  Intermediário: 'INTERMEDIATE',
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

const EDITORIAL_STATUSES = new Set([
  'CANDIDATO_REVISAO',
  'REVISAR_GRUPO_PRIMARIO',
])

function optionalText(value: string | undefined) {
  return value?.trim() || null
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
}

function muscleExplanation(row: CatalogRow) {
  return (
    [
      row.musculos_principais &&
        `Principais: ${row.musculos_principais}`,
      row.musculos_auxiliares &&
        `Auxiliares: ${row.musculos_auxiliares}`,
    ]
      .filter(Boolean)
      .join(' | ') || null
  )
}

function validateImageUrl(value: string, line: number) {
  if (!value.trim()) return

  try {
    const url = new URL(value)

    if (!['https:', 'http:'].includes(url.protocol)) {
      throw new Error('Protocolo inválido')
    }

    if (url.username || url.password) {
      throw new Error('URL com credenciais')
    }
  } catch {
    throw new Error(
      `Linha ${line}: imagem_url deve ser uma URL HTTP(S) válida.`,
    )
  }
}

function validateRows(rows: CatalogRow[]) {
  const errors: string[] = []
  const codes = new Set<string>()
  const bases = new Map<string, BaseData>()

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

    // Mantém a exclusão específica acordada para o supino.
    if (
      /supino/i.test(row.nome) &&
      /pegada reversa/i.test(row.nome)
    ) {
      errors.push(
        `Linha ${line}: exercício excluído ${row.nome}`,
      )
    }

    try {
      validateImageUrl(row.imagem_url, line)
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : `Linha ${line}: imagem_url inválida`,
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
    } else if (
      !existing &&
      row.codigo_base &&
      muscleGroup
    ) {
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

function addChange(
  changes: Change[],
  code: string,
  field: string,
  previous: string | null,
  next: string | null,
) {
  if (previous !== next) {
    changes.push({
      code,
      field,
      previous,
      next,
    })
  }
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

  // Proteção contra execução em banco remoto.
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

  const baseCodes = [...bases.keys()]
  const variationCodes = rows.map((row) => row.codigo)

  console.log('\n=== IMPORTADOR DE EXERCÍCIOS ===')
  console.log(
    `Modo: ${execute ? 'EXECUÇÃO' : 'SIMULAÇÃO'}`,
  )
  console.log(`Exercícios-base no CSV: ${bases.size}`)
  console.log(`Variações no CSV: ${rows.length}`)

  const [existingBases, existingVariations] =
    await Promise.all([
      prisma.exercise.findMany({
        where: {
          code: { in: baseCodes },
        },
        select: {
          id: true,
          code: true,
          name: true,
          muscleGroup: true,
        },
      }),

      prisma.exerciseVariation.findMany({
        where: {
          code: { in: variationCodes },
        },
        select: {
          id: true,
          code: true,
          name: true,
          exerciseId: true,
          exercise: {
            select: {
              code: true,
            },
          },
          category: true,
          level: true,
          imageUrl: true,
        },
      }),
    ])

  const existingBaseCodes = new Set(
    existingBases.map((item) => item.code),
  )

  const existingVariationCodes = new Set(
    existingVariations.map((item) => item.code),
  )

  const rowByCode = new Map(
    rows.map((row) => [row.codigo, row]),
  )

  const changes: Change[] = []
  const conflicts: string[] = []

  // Permite corrigir nomes, mas não altera
  // o grupo muscular de um código existente.
  for (const existing of existingBases) {
    const expected = bases.get(existing.code)

    if (!expected) {
      conflicts.push(
        `Exercício-base ausente: ${existing.code}`,
      )
      continue
    }

    if (
      expected.muscleGroup !== existing.muscleGroup
    ) {
      conflicts.push(
        `Grupo muscular divergente: ${existing.code}`,
      )
    }

    addChange(
      changes,
      existing.code,
      'nome do exercício-base',
      existing.name,
      expected.name,
    )
  }

  // Preserva a associação entre variação e base.
  // A unificação definitiva será outra etapa.
  for (const existing of existingVariations) {
    const expected = rowByCode.get(existing.code)

    if (!expected) {
      conflicts.push(
        `Variação ausente: ${existing.code}`,
      )
      continue
    }

    if (
      existing.exercise.code !== expected.codigo_base
    ) {
      conflicts.push(
        `Variação ${existing.code}: exercício-base divergente. Atual: ${existing.exercise.code}; CSV: ${expected.codigo_base}`,
      )
    }

    if (
      existing.category !==
      CATEGORIES[expected.categoria]
    ) {
      conflicts.push(
        `Categoria divergente: ${existing.code}`,
      )
    }

    if (
      existing.level !== LEVELS[expected.nivel]
    ) {
      conflicts.push(
        `Nível divergente: ${existing.code}`,
      )
    }

    addChange(
      changes,
      existing.code,
      'nome da variação',
      existing.name,
      expected.nome,
    )

    // Uma célula vazia não apaga a imagem
    // anteriormente cadastrada.
    const newImageUrl = optionalText(expected.imagem_url)

    if (newImageUrl) {
      addChange(
        changes,
        existing.code,
        'imagem',
        existing.imageUrl,
        newImageUrl,
      )
    }
  }

  const newBaseCount =
    bases.size - existingBaseCodes.size

  const newVariationCount =
    rows.length - existingVariationCodes.size

  const nameChanges = changes.filter(
    (change) => change.field.includes('nome'),
  )

  const imageChanges = changes.filter(
    (change) => change.field === 'imagem',
  )

  const editorialReviewCodes = rows
    .filter(
      (row) =>
        row.status === 'REVISAR_GRUPO_PRIMARIO',
    )
    .map((row) => row.codigo)

  console.log('\n--- PLANEJAMENTO ---')
  console.log(`Novas bases: ${newBaseCount}`)
  console.log(`Bases existentes: ${existingBases.length}`)
  console.log(`Novas variações: ${newVariationCount}`)
  console.log(
    `Variações existentes: ${existingVariations.length}`,
  )
  console.log(
    `Alterações de nomes: ${nameChanges.length}`,
  )
  console.log(
    `Alterações de imagens: ${imageChanges.length}`,
  )
  console.log(
    `Variações com revisão editorial pendente: ${editorialReviewCodes.length}`,
  )
  console.log(
    `Conflitos estruturais: ${conflicts.length}`,
  )

  if (changes.length > 0) {
    console.log('\n--- ALTERAÇÕES PREVISTAS ---')

    for (const change of changes) {
      console.log(
        `[${change.code}] ${change.field}`,
      )
      console.log(
        `  ANTES: ${change.previous ?? '(vazio)'}`,
      )
      console.log(
        `  DEPOIS: ${change.next ?? '(vazio)'}`,
      )
    }
  }

  if (conflicts.length > 0) {
    console.error('\n--- CONFLITOS ---')

    for (const conflict of conflicts) {
      console.error(`- ${conflict}`)
    }

    throw new Error(
      'Importação bloqueada por conflitos estruturais. Nenhuma alteração realizada.',
    )
  }

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
          update: {
            name: base.name,
          },
          create: {
            code,
            name: base.name,
            muscleGroup: base.muscleGroup,
          },
          select: {
            id: true,
          },
        })

        baseIds.set(code, exercise.id)
      }

      for (const row of rows) {
        const exerciseId = baseIds.get(
          row.codigo_base,
        )

        if (!exerciseId) {
          throw new Error(
            `Exercício-base não encontrado: ${row.codigo_base}`,
          )
        }

        const newImageUrl = optionalText(
          row.imagem_url,
        )

        const commonData = {
          name: row.nome,
          equipment: optionalText(
            row.equipamento,
          ),
          subgroup: optionalText(row.grupo),
          description: optionalText(
            row.variacao,
          ),
          instructions: optionalText(
            row.instrucoes,
          ),
          safetyNotes: optionalText(
            row.cuidados,
          ),
          muscleExplanation:
            muscleExplanation(row),
          needsEditorialReview:
            row.status ===
            'REVISAR_GRUPO_PRIMARIO',
        }

        await tx.exerciseVariation.upsert({
          where: {
            code: row.codigo,
          },

          update: {
            ...commonData,

            // Não apaga imagem existente
            // quando a célula CSV está vazia.
            ...(newImageUrl
              ? { imageUrl: newImageUrl }
              : {}),
          },

          create: {
            exerciseId,
            trainerId: null,
            code: row.codigo,
            category:
              CATEGORIES[row.categoria],
            level: LEVELS[row.nivel],
            ...commonData,
            imageUrl: newImageUrl,
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
  console.log(`Novas bases previstas: ${newBaseCount}`)
  console.log(
    `Novas variações previstas: ${newVariationCount}`,
  )
  console.log(
    `Nomes atualizados previstos: ${nameChanges.length}`,
  )
  console.log(
    `Imagens atualizadas previstas: ${imageChanges.length}`,
  )
  console.log('IDs existentes preservados.')
  console.log('Nenhuma variação existente foi excluída.')
  console.log('Status das variações existentes preservados.')
  console.log('Novas variações criadas em DRAFT.')
}

main()
  .catch((error) => {
    console.error('\nERRO NA IMPORTAÇÃO:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
