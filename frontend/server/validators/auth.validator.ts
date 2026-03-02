import { z } from 'zod';

/**
 * Schéma de validation pour le login
 */
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Email invalide'),
        password: z.string().min(1, 'Mot de passe requis'),
    }),
});

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = z.object({
    body: z.object({
        firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
        lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
        email: z.string().email('Email invalide'),
        password: z
            .string()
            .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
            .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
            .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
            .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    }),
});

/**
 * Schéma de validation pour forgot password
 */
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Email invalide'),
    }),
});

/**
 * Schéma de validation pour reset password
 */
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token requis'),
        password: z
            .string()
            .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
            .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
            .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
            .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    }),
});

/**
 * Schéma de validation pour refresh token
 */
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token requis'),
    }),
});

/**
 * Schéma de validation pour join company (invitation)
 */
export const joinCompanySchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token d\'invitation requis'),
        password: z
            .string()
            .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
            .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
            .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
            .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    }),
});
