import { Router } from "express";

import { HealthController } from "../controllers/health.controller.js";

export const healthRoutes = Router()

const healthController = new HealthController()

healthRoutes.get('/', (req, res) => {
    return healthController.handle(req,res)
})