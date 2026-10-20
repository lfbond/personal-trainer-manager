import type { RequestHandler } from "express";

import { AppError } from "../lib/app-error.js";
import { verifyAccessToken } from "../lib/jwt.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
    const authorizarion = req.headers.authorization

    if (!authorizarion?.startsWith('Bearer ')) {
        return next(new AppError('Token de autenticação não inoformado. ', 401))
    }

    const token = authorizarion.slice(7).trim()

    if(!token) {
        return next(new AppError('Token de autenticação não informado. ',401))
    }

    try {
        const userId = await verifyAccessToken(token)

        _res.locals.userId = userId

        return next()
    } catch {
        return next(new AppError('Token inválido ou expirado. ', 401))
    }
}
