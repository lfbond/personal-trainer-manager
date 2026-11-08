import { prisma } from '../lib/prisma.js'

async function main() {
  try {
    await prisma.$connect()

    console.log('✅ Conexão com PostgreSQL estabelecida!')

    const totalStudents = await prisma.student.count()

    console.log(`📊 Total de alunos cadastrados: ${totalStudents}`)
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void main()