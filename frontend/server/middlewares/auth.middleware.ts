import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { ApiResponse } from '../types/express';
import logger from '../utils/logger.util';

/**
 * Middleware d'authentification
 * Vérifie le JWT dans le header Authorization
 */
export const authMiddleware = (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token d\'authentification manquant',
                },
            });
            return;
        }

        const token = authHeader.substring(7); // Enlever "Bearer "

        // Vérifier et décoder le token
        const decoded = verifyAccessToken(token);

        // Ajouter les infos user à la requête
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role as any,
            companyId: decoded.companyId,
        };

        next();
        return;
    } catch (error: any) {
        logger.error('Auth middleware error:', error);

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token expiré, veuillez vous reconnecter',
                },
            });
            return;
        }

        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token invalide',
                },
            });
            return;
        }

        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentification échouée',
            },
        });
        return;
    }
};
