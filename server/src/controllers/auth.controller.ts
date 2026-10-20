import type { RequestHandler } from 'express'

import { loginSchema } from '../schemas/auth.schema.js'
import { login } from '../services/auth.service.js'

export const loginController: RequestHandler = async (req, res) => {
  const credentials = loginSchema.parse(req.body)

  const result = await login(credentials)

  res.status(200).json(result)
}
