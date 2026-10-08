import type { Request, Response} from 'express'

import { HealthService } from '../services/health.service.js'

export class HealthController {
    handle(_req: Request, res: Response) {
        const healthService = new HealthService()

        const result = healthService.execute()

        return res.status(200).json(result)
    }
}