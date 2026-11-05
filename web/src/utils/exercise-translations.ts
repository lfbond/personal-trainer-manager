const exerciseNames: Record<string, string> = {
  // PEITORAL
  'Chest Press': 'Supino na máquina',
  'Cable Chest Press': 'Supino no cabo',
  'Cable Fly no banco': 'Crucifixo no banco com cabos',
  'Floor Press': 'Supino no chão',
  'Peck Deck': 'Crucifixo na máquina',
  'Squeeze Press': 'Supino com compressão dos halteres',

  // OMBROS
  'Arnold Press': 'Desenvolvimento Arnold',
  'Face Pull': 'Puxada para o rosto',
  'Push Press': 'Desenvolvimento com impulso',

  // PERNAS E GLÚTEOS
  'Belt Squat': 'Agachamento com cinturão',
  'Donkey Calf Raise': 'Elevação de panturrilha tipo burrinho',
  'Farmer Calf Raise': 'Elevação de panturrilha com carga nas mãos',
  'Good Morning': 'Bom dia',
  'Hack Squat': 'Agachamento Hack',
  'Hip Thrust': 'Elevação pélvica',
  'Leg Press': 'Prensa de pernas',
  'Pendulum Squat': 'Agachamento pendular',
  'Pull Through': 'Extensão de quadril no cabo',
  'Step-up': 'Subida no banco',
  'Walking Lunge': 'Afundo caminhando',

  // BRAÇOS
  'JM Press': 'Supino JM para tríceps',
  'Pallof Press': 'Press anti-rotação Pallof',
  'Renegade Row': 'Remada em posição de prancha',
  'Tate Press': 'Extensão de tríceps Tate',
  'Tríceps cross-body': 'Tríceps cruzado',
  'Tríceps pushdown': 'Tríceps na polia alta',

  // ABDÔMEN E CORE
  'Crunch': 'Abdominal curto',
  'Dead Bug': 'Inseto morto',
  'Dragon Flag': 'Elevação corporal Dragon Flag',
  'Russian Twist': 'Rotação russa',
  'Sit-up': 'Abdominal completo',
  'Suitcase Carry': 'Caminhada com carga unilateral',
  'Turkish Get-Up': 'Levantamento turco',
  'Windmill': 'Moinho de vento',
  'Wood Chop': 'Rotação diagonal de tronco',
}

export function getExerciseDisplayName(name: string): string {
  const originalName = name.trim()

  const separators = [' — ', ' – ', ' - ']

  const separator = separators.find((item) =>
    originalName.includes(item),
  )

  if (separator) {
    const [baseName, ...variationParts] = originalName.split(separator)

    const normalizedBaseName = baseName.trim()
    const translatedBase = exerciseNames[normalizedBaseName]

    if (translatedBase) {
      const variation = variationParts.join(separator).trim()

      return `${translatedBase} — ${variation} (${normalizedBaseName})`
    }
  }

  const translation = exerciseNames[originalName]

  return translation
    ? `${translation} (${originalName})`
    : originalName
}