import { Router } from 'express'

import { loginController } from '../controllers/auth.controller.js'
import { loginRateLimiter } from '../middlewares/login-rate-limit.middleware.js'

import {
  publicInvitationRoutes,
} from './organization-invitations.routes.js'

const authRoutes = Router()

authRoutes.post('/login', loginRateLimiter, loginController)
authRoutes.use('/invitations', publicInvitationRoutes)

export { authRoutes }