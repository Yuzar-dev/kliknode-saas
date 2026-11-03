import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/express';
import prisma from '../config/database';
import logger from '../utils/logger.util';

/**
 * Middleware qui vérifie si l'utilisateur connecté possède le statut PRO (B2C) ou un rôle d'administration.
 * Bloque avec une erreur 403 Forbidden si l'utilisateur est standard.
 */
export const requireProMiddleware = async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentification requise pour cette action.',
                },
            });
            return;
        }

        // Les ADMIN et MANAGER ont accès d'office à toutes les fonctionnalités de la plateforme.
        if (req.user.role === 'ADMIN' || req.user.role === 'MANAGER') {
            next();
            return;
        }

        // Récupérer le statut isPro de l'utilisateur depuis la base de données en temps réel.
        const dbUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { isPro: true }
        });

        if (!dbUser || !dbUser.isPro) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'PRO_FEATURE_REQUIRED',
                    message: 'Cette fonctionnalité est réservée aux abonnés du Plan PRO KlikNode.',
                },
            });
            return;
        }

        next();
        return;
    } catch (error: any) {
        logger.error('Erreur dans requireProMiddleware:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Une erreur interne est survenue lors de la vérification de vos droits.',
            },
        });
        return;
    }
};
