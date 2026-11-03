import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { verifyAccessToken } from '../utils/jwt.util';
import { ApiResponse } from '../types/express';
import logger from '../utils/logger.util';

// Cache léger en mémoire (60s) pour éviter de requêter `users` 10 fois en parallèle sur le Dashboard
const userCache = new Map<string, { data: { id: string; email: string; role: string; companyId: string | null }; expiresAt: number }>();

/**
 * Middleware d'authentification
 * Supporte à la fois les JWT locaux (POST /api/auth/login) et les JWT Supabase sans appel HTTP externe
 */
export const authMiddleware = async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
) => {
    try {
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

        const token = authHeader.substring(7);
        let userId: string | undefined;
        let fallbackEmail: string | undefined;

        // 1. Tenter la vérification du JWT signé par notre backend
        try {
            const payload = verifyAccessToken(token);
            userId = payload.userId;
            fallbackEmail = (payload as any).email;
        } catch {
            // 2. Fallback : décoder un éventuel JWT Supabase (champ `sub`)
            const decoded = jwt.decode(token) as { sub?: string; userId?: string; email?: string; exp?: number } | null;
            if (decoded && (!decoded.exp || decoded.exp * 1000 > Date.now())) {
                userId = decoded.userId || decoded.sub;
                fallbackEmail = decoded.email;
            }
        }

        if (!userId && !fallbackEmail) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token invalide ou expiré',
                },
            });
            return;
        }

        // 3. Vérifier le cache mémoire avant d'interroger PostgreSQL
        const cacheKey = userId || fallbackEmail || '';
        const cached = userCache.get(cacheKey);
        let dbUser = cached && cached.expiresAt > Date.now() ? cached.data : null;

        if (!dbUser) {
            let found = userId ? await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true, companyId: true }
            }) : null;

            if (!found && fallbackEmail) {
                found = await prisma.user.findFirst({
                    where: { email: { equals: fallbackEmail, mode: 'insensitive' } },
                    select: { id: true, email: true, role: true, companyId: true }
                });
            }

            if (found) {
                dbUser = {
                    id: found.id,
                    email: found.email,
                    role: String(found.role),
                    companyId: found.companyId,
                };
                userCache.set(cacheKey, { data: dbUser, expiresAt: Date.now() + 60_000 });
            }
        }

        if (!dbUser) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Utilisateur non trouvé dans la base de données',
                },
            });
            return;
        }

        req.user = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role as any,
            companyId: dbUser.companyId || undefined,
        };

        next();
        return;
    } catch (error: any) {
        logger.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de l\'authentification',
            },
        });
        return;
    }
};
