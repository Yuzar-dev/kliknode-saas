import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/express';

type UserRole = 'USER' | 'EMPLOYEE' | 'MANAGER' | 'OPERATOR' | 'ADMIN';

/**
 * Middleware de vérification des rôles
 * Vérifie que l'utilisateur a l'un des rôles autorisés
 */
export const roleMiddleware = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        // Vérifier que l'utilisateur est authentifié
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentification requise',
                },
            });
            return;
        }

        // Vérifier le rôle
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Accès refusé : permissions insuffisantes',
                    details: {
                        requiredRoles: allowedRoles,
                        userRole: req.user.role,
                    },
                },
            });
            return;
        }

        next();
        return;
    };
};

// Specific role middlewares
export const requireSuperAdmin = roleMiddleware(['ADMIN']);
export const requireCompanyAdmin = roleMiddleware(['MANAGER', 'ADMIN']);
export const requireOperator = roleMiddleware(['OPERATOR', 'ADMIN']);
export const requireEmployee = roleMiddleware(['EMPLOYEE', 'MANAGER', 'ADMIN']);
