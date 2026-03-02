import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/express';
import logger from '../utils/logger.util';

/**
 * Middleware de gestion globale des erreurs
 * Doit être placé en dernier dans la chaîne de middlewares
 */
export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
) => {
    // Logger l'erreur
    logger.error('Error caught by error middleware:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.id,
    });

    // Erreur de validation Prisma
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'Cette valeur existe déjà dans la base de données',
                details: err.meta,
            },
        });
    }

    // Erreur Prisma générale
    if (err.code?.startsWith('P')) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Erreur de base de données',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            },
        });
    }

    // Erreur 404 - Not Found
    if (err.status === 404) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: err.message || 'Ressource non trouvée',
            },
        });
    }

    // Erreur 400 - Bad Request
    if (err.status === 400) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'BAD_REQUEST',
                message: err.message || 'Requête invalide',
            },
        });
    }

    // Erreur par défaut (500 Internal Server Error)
    return res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message || 'Une erreur est survenue',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        },
    });
};

/**
 * Middleware pour les routes non trouvées (404)
 */
export const notFoundMiddleware = (req: Request, res: Response<ApiResponse>) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.path} non trouvée`,
        },
    });
};
