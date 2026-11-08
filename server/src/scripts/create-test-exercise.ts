
import { prisma } from '../lib/prisma.js'

async function main() {
  const exercise = await prisma.exercise.upsert({
    where: {
      code: 'CHEST_BENCH_PRESS',
    },
    update: {},
    create: {
      code: 'CHEST_BENCH_PRESS',
      name: 'Supino reto',
      muscleGroup: 'CHEST',
      description:
        'Exercício de empurrar horizontal para o treinamento dos músculos peitorais.',
    },
  })

  console.log({
    id: exercise.id,
    code: exercise.code,
    name: exercise.name,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
