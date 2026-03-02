import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiResponse } from '../types/express';

/**
 * Middleware de validation avec Zod
 * Valide le body, query ou params de la requête
 */
export const validateMiddleware = (schema: AnyZodObject) => {
    return async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Erreur de validation des données',
                        details: error.errors.map((err) => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
            }

            return next(error);
        }
    };
};
