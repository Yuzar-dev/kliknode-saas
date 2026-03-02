import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/express';

type UserRole = 'super_admin' | 'company_admin' | 'employee' | 'operator';

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

/**
 * Raccourcis pour les rôles communs
 */
export const requireSuperAdmin = roleMiddleware(['super_admin']);
export const requireCompanyAdmin = roleMiddleware(['company_admin', 'super_admin']);
export const requireOperator = roleMiddleware(['operator', 'super_admin']);
export const requireEmployee = roleMiddleware(['employee', 'company_admin', 'super_admin']);
