import { Request, Response } from 'express';
import prisma, { ensureCleanDatabase, syncUserToSupabaseAuth } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/bcrypt.util';
import { generateTokens } from '../../utils/jwt.util';
import { ApiResponse } from '../../types/express';
import { generateSlug } from '../../utils/slug.util';
import logger from '../../utils/logger.util';
import { emailService } from '../../services/email.service';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Synchronise automatiquement l'essai gratuit B2C de 7 jours :
 * - Tout compte B2C créé il y a moins de 7 jours n'ayant jamais eu de log d'essai reçoit ses 7 jours automatiquement.
 * - Tout essai local de 7 jours expiré sans abonnement payant bascule automatiquement `isPro -> false`.
 */
async function syncB2CTrialForUser(user: {
    id: string;
    role: string;
    companyId: string | null;
    isPro: boolean;
    createdAt: Date;
}): Promise<boolean> {
    if (user.companyId || user.role !== 'USER') {
        return Boolean(user.isPro);
    }

    const latestSubLog = await prisma.auditLog.findFirst({
        where: {
            userId: user.id,
            action: 'B2C_TRIAL_SUBSCRIPTION',
        },
        orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    if (!latestSubLog) {
        const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
        if (accountAgeMs < SEVEN_DAYS_MS) {
            const trialEndsAt = new Date(new Date(user.createdAt).getTime() + SEVEN_DAYS_MS).toISOString();
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'B2C_TRIAL_SUBSCRIPTION',
                    entityType: 'user',
                    entityId: user.id,
                    changes: {
                        planName: 'KlikNode PRO (Essai 7 jours)',
                        isTrial: true,
                        trialEndsAt,
                        paidConfirmed: false,
                        activatedAt: new Date().toISOString(),
                    },
                },
            }).catch(() => {});
            if (!user.isPro) {
                await prisma.user.update({ where: { id: user.id }, data: { isPro: true } }).catch(() => {});
            }
            return true;
        }
        return Boolean(user.isPro);
    }

    const subMeta = (latestSubLog.changes && typeof latestSubLog.changes === 'object')
        ? (latestSubLog.changes as any)
        : null;

    if (subMeta && !subMeta.stripeSubscriptionId && !subMeta.paidConfirmed && subMeta.trialEndsAt) {
        const isStillInTrial = new Date(subMeta.trialEndsAt).getTime() > Date.now();
        if (user.isPro !== isStillInTrial) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isPro: isStillInTrial },
            }).catch(() => {});
        }
        return isStillInTrial;
    }

    return Boolean(user.isPro);
}

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
export const login = async (req: Request, res: Response<ApiResponse>) => {
    try {
        await ensureCleanDatabase();
        const { email, password, cardId, rememberMe } = req.body;
        const isRememberMe = Boolean(rememberMe);

        // Rechercher l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                company: {
                    include: {
                        subscription: {
                            include: { plan: true },
                        },
                    },
                },
                card: true,
            },
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

        // Vérifier le mot de passe (public.users puis fallback auth.users Supabase)
        let isPasswordValid = false;
        if (user.passwordHash && user.passwordHash.startsWith('$2')) {
            isPasswordValid = await comparePassword(password, user.passwordHash);
        }
        if (!isPasswordValid) {
            try {
                const authRows = await prisma.$queryRaw<Array<{ encrypted_password: string | null }>>`
                    SELECT encrypted_password FROM auth.users WHERE lower(email) = ${email.toLowerCase()} LIMIT 1
                `;
                if (authRows.length > 0 && authRows[0].encrypted_password) {
                    isPasswordValid = await comparePassword(password, authRows[0].encrypted_password);
                }
            } catch (e) {
                // Ignore if auth.users is not accessible
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email ou mot de passe incorrect',
                },
            });
        }

        // Si un UID de carte physique NFC (`cardId`) est transmis lors de la connexion d'un collaborateur/utilisateur,
        // associer automatiquement la carte physique au profil digital de l'utilisateur
        if (cardId && user.card && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
            const cleanUid = String(cardId).replace(/:/g, '').trim().toUpperCase();
            await prisma.physicalCard.updateMany({
                where: {
                    uid: { equals: cleanUid, mode: 'insensitive' },
                    pairedCardId: null,
                },
                data: {
                    status: 'paired',
                    pairedCardId: user.card.id,
                    pairedAt: new Date(),
                },
            }).catch(() => {});
        }

        // Générer les tokens (30 jours si "Rester connecté", sinon 7 jours)
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            role: user.role as any,
            companyId: user.companyId || undefined,
        }, isRememberMe);

        // Si l'utilisateur est un collaborateur d'entreprise (companyId défini),
        // son statut PRO dépend exclusivement du plan B2B actif de son entreprise
        let effectiveIsPro = Boolean((user as any).isPro);
        if (user.companyId && user.role === 'USER') {
            const companySub = user.company?.subscription;
            const companyPlan = companySub?.plan;
            const isSubActive = !companySub || companySub.status === 'active' || companySub.status === 'trialing';
            effectiveIsPro = Boolean(
                companyPlan &&
                isSubActive &&
                Number(companyPlan.priceEur) > 0 &&
                String(companyPlan.slug || '').toLowerCase() !== 'free' &&
                String(companyPlan.name || '').toLowerCase() !== 'free'
            );
        } else if (!user.companyId && user.role === 'USER') {
            effectiveIsPro = await syncB2CTrialForUser({
                id: user.id,
                role: user.role,
                companyId: user.companyId,
                isPro: Boolean((user as any).isPro),
                createdAt: user.createdAt,
            });
        }

        const refreshDurationMs = (isRememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;

        // Sauvegarder le refresh token et mettre à jour lastLoginAt (+ synchroniser isPro si besoin) en parallèle
        await Promise.all([
            prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: tokens.refreshToken,
                    expiresAt: new Date(Date.now() + refreshDurationMs),
                },
            }).catch(() => {}),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    ...((user as any).isPro !== effectiveIsPro ? { isPro: effectiveIsPro } : {}),
                },
            }).catch(() => {}),
        ]);

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
                    role: user.role as any,
                    companyId: user.companyId,
                    companyName: user.company?.name,
                    avatarUrl: user.avatarUrl,
                    isActive: user.isActive,
                    isPro: effectiveIsPro,
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

        // Créer l'utilisateur B2C avec sa semaine d'essai gratuit (7 jours) activée d'office
        const trialEndsAt = new Date(Date.now() + SEVEN_DAYS_MS).toISOString();
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                firstName,
                lastName,
                role: 'USER',
                isPro: true,
                language: 'fr',
            },
        });

        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'B2C_TRIAL_SUBSCRIPTION',
                entityType: 'user',
                entityId: user.id,
                changes: {
                    planName: 'KlikNode PRO (Essai 7 jours)',
                    isTrial: true,
                    trialEndsAt,
                    paidConfirmed: false,
                    activatedAt: new Date().toISOString(),
                },
            },
        }).catch(() => {});

        await syncUserToSupabaseAuth({
            id: user.id,
            email: user.email,
            passwordHash,
            firstName: user.firstName,
            lastName: user.lastName,
            role: 'USER',
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
            role: user.role as any,
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
                    role: user.role as any,
                    isPro: true,
                },
                trialEndsAt,
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

        // Préserver le mode "Rester connecté" (30 jours) si le token précédent avait > 8 jours de validité
        const wasLongSession = (storedToken.expiresAt.getTime() - storedToken.createdAt.getTime()) > 8 * 24 * 60 * 60 * 1000;

        // Générer de nouveaux tokens
        const newTokens = generateTokens({
            id: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
            companyId: storedToken.user.companyId || undefined,
        }, wasLongSession);

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
                expiresAt: new Date(Date.now() + (wasLongSession ? 30 : 7) * 24 * 60 * 60 * 1000),
            },
        });

        // Synchroniser l'expiration éventuelle des 7 jours d'essai gratuit B2C lors du refresh token
        const refreshedIsPro = await syncB2CTrialForUser({
            id: storedToken.user.id,
            role: storedToken.user.role,
            companyId: storedToken.user.companyId,
            isPro: Boolean((storedToken.user as any).isPro),
            createdAt: storedToken.user.createdAt,
        });

        return res.status(200).json({
            success: true,
            data: { tokens: newTokens, isPro: refreshedIsPro },
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
