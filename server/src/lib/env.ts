import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),

  WEB_URL: z.url().default('http://localhost:5173'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('As variáveis de ambiente são inválidas.')
  console.error(z.treeifyError(parsedEnv.error))

  throw new Error('Não foi possível iniciar a API.')
}

export const env = parsedEnv.data