import { Router } from 'express'

import { prisma } from '../lib/prisma.js'

export const databaseHealthRoutes = Router()

databaseHealthRoutes.get('/', async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    return response.status(200).json({
      status: 'ok',
      database: 'connected',
    })
  } catch (error) {
    next(error)
  }
})