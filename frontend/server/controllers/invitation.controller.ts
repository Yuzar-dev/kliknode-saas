import { Request, Response } from 'express';
import prisma, { syncUserToSupabaseAuth } from '../config/database';
import { ApiResponse } from '../types/express';
import { hashPassword } from '../utils/bcrypt.util';
import { generateTokens } from '../utils/jwt.util';
import logger from '../utils/logger.util';

/**
 * GET /api/invitations/verify/:token
 * Vérifie la validité d'un token d'invitation
 */
export const verifyInvitation = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const token = String(req.params.token);

        const invitation = await prisma.companyInvitation.findUnique({
            where: { token },
            include: { company: true }
        });

        if (!invitation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Invitation introuvable ou invalide'
                }
            });
        }

        if (invitation.acceptedAt) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Cette invitation a déjà été acceptée'
                }
            });
        }

        if (invitation.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'EXPIRED',
                    message: 'Cette invitation a expiré'
                }
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: invitation.email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Utilisateur associé introuvable'
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                company: {
                    id: invitation.company.id,
                    name: invitation.company.name,
                    logo: (invitation.company as any).branding ? (invitation.company as any).branding.logoLightUrl : null,
                },
                user: {
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error: any) {
        logger.error('Error verifying invitation:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la vérification de l\'invitation'
            }
        });
    }
};

/**
 * POST /api/invitations/accept/:token
 * Accepte l'invitation, définit le mot de passe et connecte l'utilisateur
 */
export const acceptInvitation = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const token = String(req.params.token);
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Un mot de passe d\'au moins 8 caractères est requis'
                }
            });
        }

        const invitation = await prisma.companyInvitation.findUnique({
            where: { token },
            include: { company: true }
        });

        if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invitation invalide ou expirée'
                }
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: invitation.email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Utilisateur introuvable'
                }
            });
        }

        // Hasher le nouveau mot de passe
        const passwordHash = await hashPassword(password);

        // Mettre à jour l'utilisateur et l'invitation
        const updatedUser = await prisma.$transaction(async (tx) => {
            // Mettre à jour l'invitation
            await tx.companyInvitation.update({
                where: { id: invitation.id },
                data: { acceptedAt: new Date() }
            });

            // Mettre à jour l'utilisateur
            return await tx.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    isActive: true,
                    emailVerifiedAt: new Date(),
                    lastLoginAt: new Date()
                },
                include: { company: true }
            });
        });

        // Confirmer l'email et synchroniser le mot de passe dans Supabase Auth (auth.users)
        await syncUserToSupabaseAuth({
            id: updatedUser.id,
            email: updatedUser.email,
            passwordHash,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: String(updatedUser.role),
        });

        // Générer les tokens de connexion
        const tokens = generateTokens({
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role as any,
            companyId: updatedUser.companyId || undefined,
        });

        // Sauvegarder le refresh token
        await prisma.refreshToken.create({
            data: {
                userId: updatedUser.id,
                token: tokens.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            },
        });

        logger.info(`User ${updatedUser.email} activated account and logged in via invitation`);

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    role: updatedUser.role as any,
                    companyId: updatedUser.companyId,
                    companyName: updatedUser.company?.name,
                },
                tokens,
            }
        });

    } catch (error: any) {
        logger.error('Error accepting invitation:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de l\'acceptation de l\'invitation'
            }
        });
    }
};
