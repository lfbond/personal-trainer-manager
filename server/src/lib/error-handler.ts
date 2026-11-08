import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { AppError } from './app-error.js'

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
    })

    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Os dados informados são inválidos.',
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: 'Verifique o valor informado neste campo.',
      })),
    })

    return
  }

  console.error('Erro interno da API:', error)

  response.status(500).json({
    message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
  })
}