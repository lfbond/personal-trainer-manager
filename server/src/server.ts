import express from 'express'
import cors from 'cors'

import { env } from './lib/env.js'
import { routes } from './routes/index.js'
import { AppError } from './lib/app-error.js'
import { errorHandler } from './lib/error-handler.js'

const app = express()

app.use(
  cors({
    origin: env.WEB_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
)

app.use(express.json())

app.use(routes)

app.use((_request, _response, next) => {
  next(new AppError('Rota não encontrada.', 404))
})

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Servidor HTTP iniciado na porta ${env.PORT}.`)
})

