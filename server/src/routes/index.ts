import { Router } from 'express'

import { healthRoutes } from './health.routes.js'
import { databaseHealthRoutes } from './database-health.routes.js'

export const routes = Router()

routes.use('/health', healthRoutes)
routes.use('/database-health', databaseHealthRoutes)