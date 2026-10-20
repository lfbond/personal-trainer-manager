import { Router } from 'express'

import { loginController } from '../controllers/auth.controller.js'
import { loginRateLimiter } from '../middlewares/login-rate-limit.middleware.js'

const authRoutes = Router()

authRoutes.post('/login', loginRateLimiter, loginController)

export { authRoutes }
