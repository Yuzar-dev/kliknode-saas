import { Request, Response } from 'express';
import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/bcrypt.util';
import { generateTokens } from '../../utils/jwt.util';
import { ApiResponse } from '../../types/express';
import { generateSlug } from '../../utils/slug.util';
import logger from '../../utils/logger.util';
import { emailService } from '../../services/email.service';

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
export const login = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { email, password } = req.body;

        // Rechercher l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { company: true },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email ou mot de passe incorrect',
                },
            });
        }

        // Vérifier si le compte est actif
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCOUNT_DISABLED',
                    message: 'Votre compte a été désactivé',
                },
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email ou mot de passe incorrect',
                },
            });
        }

        // Générer les tokens
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId || undefined,
        });

        // Sauvegarder le refresh token
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            },
        });

        // Mettre à jour lastLoginAt
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        logger.info(`User ${user.email} logged in successfully`);

        // Retourner la réponse
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    companyId: user.companyId,
                    companyName: user.company?.name,
                },
                tokens,
            },
        });
    } catch (error: any) {
        logger.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Une erreur est survenue lors de la connexion',
            },
        });
    }
};

/**
 * POST /api/auth/register
 * Inscription utilisateur (B2C)
 */
export const register = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { firstName, lastName, email, password, cardUid } = req.body;

        // Vérifier si l'email existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_ALREADY_EXISTS',
                    message: 'Cet email est déjà utilisé',
                },
            });
        }

        // Hash du mot de passe
        const passwordHash = await hashPassword(password);

        // Créer l'utilisateur (employee sans company)
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                firstName,
                lastName,
                role: 'employee',
                language: 'fr',
            },
        });

        // Créer la carte virtuelle associée
        const slug = generateSlug(`${firstName}-${lastName}-${user.id.slice(0, 8)}`);

        const card = await prisma.card.create({
            data: {
                userId: user.id,
                publicSlug: slug,
                firstName,
                lastName,
                email: email.toLowerCase(),
            },
        });

        // Si cardUid fourni → Pairer la carte physique avec la carte digitale
        if (cardUid) {
            try {
                await prisma.physicalCard.update({
                    where: { uid: cardUid },
                    data: {
                        pairedCardId: card.id,
                        pairedAt: new Date(),
                        status: 'paired',
                    },
                });
                logger.info(`Physical card ${cardUid} paired with digital card ${card.id} during registration`);
            } catch (pairError: any) {
                logger.warn(`Failed to pair card ${cardUid} during registration:`, pairError);
                // On ne bloque pas l'inscription si le pairage échoue
            }
        }

        // Générer les tokens
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // Sauvegarder le refresh token
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        logger.info(`New user registered: ${user.email}${cardUid ? ` (with card ${cardUid})` : ''}`);

        // TODO: Envoyer email de bienvenue

        return res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                tokens,
                card: {
                    publicSlug: card.publicSlug,
                },
            },
        });
    } catch (error: any) {
        logger.error('Register error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Une erreur est survenue lors de l\'inscription',
            },
        });
    }
};

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation du mot de passe
 */
export const forgotPassword = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { email } = req.body;

        // Rechercher l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        // Toujours retourner succès (sécurité - ne pas révéler si email existe)
        if (!user) {
            return res.status(200).json({
                success: true,
                data: {
                    message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
                },
            });
        }

        // Générer un token de reset
        const token = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        // Sauvegarder le token (expire dans 1h)
        await prisma.passwordReset.create({
            data: {
                email: user.email,
                token,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
            },
        });

        logger.info(`Password reset requested for: ${user.email}`);

        // Envoyer l'email avec le lien de reset
        await emailService.sendPasswordResetEmail(user.email, token);

        return res.status(200).json({
            success: true,
            data: {
                message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
            },
        });
    } catch (error: any) {
        logger.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Une erreur est survenue',
            },
        });
    }
};

/**
 * POST /api/auth/reset-password
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { token, password } = req.body;

        // Rechercher le token
        const resetToken = await prisma.passwordReset.findFirst({
            where: {
                token,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token invalide ou expiré',
                },
            });
        }

        // Hash du nouveau mot de passe
        const passwordHash = await hashPassword(password);

        // Mettre à jour le mot de passe
        await prisma.user.update({
            where: { email: resetToken.email },
            data: { passwordHash },
        });

        // Marquer le token comme utilisé
        await prisma.passwordReset.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        });

        logger.info(`Password reset successful for: ${resetToken.email}`);

        return res.status(200).json({
            success: true,
            data: {
                message: 'Mot de passe réinitialisé avec succès',
            },
        });
    } catch (error: any) {
        logger.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Une erreur est survenue',
            },
        });
    }
};

/**
 * POST /api/auth/refresh-token
 * Rafraîchir l'access token
 */
export const refreshToken = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { refreshToken: token } = req.body;

        // Vérifier si le token existe et n'est pas révoqué
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        if (!storedToken) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Refresh token invalide ou expiré',
                },
            });
        }

        // Générer de nouveaux tokens
        const newTokens = generateTokens({
            id: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
            companyId: storedToken.user.companyId || undefined,
        });

        // Révoquer l'ancien refresh token
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        // Sauvegarder le nouveau refresh token
        await prisma.refreshToken.create({
            data: {
                userId: storedToken.user.id,
                token: newTokens.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return res.status(200).json({
            success: true,
            data: { tokens: newTokens },
        });
    } catch (error: any) {
        logger.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Une erreur est survenue',
            },
        });
    }
};
