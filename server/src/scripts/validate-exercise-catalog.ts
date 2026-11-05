
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'csv-parse/sync'

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

const MUSCLE_GROUPS: Record<string, string> = {
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

const CATEGORIES: Record<string, string> = {
  'Máquina/Cabo': 'MACHINE_CABLE',
  'Peso Livre': 'FREE_WEIGHT',
}

const LEVELS: Record<string, string> = {
  Iniciante: 'BEGINNER',
  'Intermediário': 'INTERMEDIATE',
  'Avançado': 'ADVANCED',
}

const EDITORIAL_STATUSES = new Set([
  'CANDIDATO_REVISAO',
  'REVISAR_GRUPO_PRIMARIO',
])

function main() {
  const filePath = resolve(
    process.cwd(),
    'src/data/exercise-catalog.csv',
  )

  console.log('\n=== VALIDAÇÃO DO CATÁLOGO ===\n')

  const csv = readFileSync(filePath, 'utf8')

  const rows = parse(csv, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as CatalogRow[]

  const errors: string[] = []
  const warnings: string[] = []

  const header = parse(csv, {
    to_line: 1,
    bom: true,
  })[0] as string[]

  for (const column of REQUIRED_COLUMNS) {
    if (!header.includes(column)) {
      errors.push(`Coluna obrigatória ausente: ${column}`)
    }
  }

  const variationCodes = new Set<string>()

  const baseExercises = new Map<
    string,
    { name: string; muscleGroup: string }
  >()

  const groupCounts = new Map<string, number>()
  const statusCounts = new Map<string, number>()

  rows.forEach((row, index) => {
    const line = index + 2

    for (const field of REQUIRED_VALUES) {
      if (!row[field]?.trim()) {
        errors.push(`Linha ${line}: campo "${field}" vazio`)
      }
    }

    if (row.codigo) {
      if (variationCodes.has(row.codigo)) {
        errors.push(
          `Linha ${line}: código duplicado ${row.codigo}`,
        )
      }

      variationCodes.add(row.codigo)
    }

    const muscleGroup = MUSCLE_GROUPS[row.grupo]

    if (!muscleGroup) {
      errors.push(
        `Linha ${line}: grupo desconhecido "${row.grupo}"`,
      )
    }

    if (!CATEGORIES[row.categoria]) {
      errors.push(
        `Linha ${line}: categoria inválida "${row.categoria}"`,
      )
    }

    if (!LEVELS[row.nivel]) {
      errors.push(
        `Linha ${line}: nível inválido "${row.nivel}"`,
      )
    }

    if (!EDITORIAL_STATUSES.has(row.status)) {
      errors.push(
        `Linha ${line}: status desconhecido "${row.status}"`,
      )
    }

    if (row.codigo_base) {
      const existingBase = baseExercises.get(row.codigo_base)

      if (
        existingBase &&
        (existingBase.name !== row.exercicio_base ||
          existingBase.muscleGroup !== muscleGroup)
      ) {
        errors.push(
          `Linha ${line}: exercício-base ${row.codigo_base} possui dados conflitantes`,
        )
      } else if (!existingBase) {
        baseExercises.set(row.codigo_base, {
          name: row.exercicio_base,
          muscleGroup,
        })
      }
    }

    groupCounts.set(
      row.grupo,
      (groupCounts.get(row.grupo) ?? 0) + 1,
    )

    statusCounts.set(
      row.status,
      (statusCounts.get(row.status) ?? 0) + 1,
    )

    if (row.status === 'REVISAR_GRUPO_PRIMARIO') {
      warnings.push(
        `Linha ${line}: revisar grupo muscular de ${row.nome}`,
      )
    }

    if (/pegada reversa/i.test(row.nome ?? '')) {
      errors.push(
        `Linha ${line}: exercício excluído (${row.nome})`,
      )
    }
  })

  console.log(`Variações: ${rows.length}`)
  console.log(`Exercícios-base: ${baseExercises.size}`)
  console.log(`Códigos únicos: ${variationCodes.size}`)

  console.log('\n--- GRUPOS MUSCULARES ---')

  for (const [group, count] of groupCounts) {
    console.log(`${group}: ${count}`)
  }

  console.log('\n--- STATUS EDITORIAL ---')

  for (const [status, count] of statusCounts) {
    console.log(`${status}: ${count}`)
  }

  console.log(`\nErros: ${errors.length}`)
  console.log(`Avisos: ${warnings.length}`)

  for (const error of errors) {
    console.error(`ERRO: ${error}`)
  }

  for (const warning of warnings) {
    console.warn(`AVISO: ${warning}`)
  }

  if (errors.length > 0) {
    console.error('\nCATÁLOGO REPROVADO')
    process.exitCode = 1
    return
  }

  console.log('\nCATÁLOGO VALIDADO ESTRUTURALMENTE')
  console.log('Nenhum registro foi gravado no banco.')
  console.log('A revisão técnica ainda é necessária.')
}

try {
  main()
} catch (error) {
  console.error('Falha ao validar catálogo:', error)
  process.exitCode = 1
}
