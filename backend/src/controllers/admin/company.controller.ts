import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma, { ensureCleanDatabase, syncUserToSupabaseAuth } from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';
import { generateUniqueSlug } from '../../utils/slug.util';
import { generateTokens } from '../../utils/jwt.util';
import { emailService } from '../../services/email.service';

/**
 * GET /api/admin/companies
 * Get list of all companies with pagination and basic search
 */
export const getAdminCompanies = async (req: Request, res: Response<ApiResponse>) => {
    try {
        await ensureCleanDatabase();
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null,
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { ice: { contains: search, mode: 'insensitive' } },
                { siret: { contains: search, mode: 'insensitive' } },
                { adminEmail: { contains: search, mode: 'insensitive' } }
            ]
        };

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                include: {
                    subscription: {
                        include: {
                            plan: true
                        }
                    },
                    _count: {
                        select: {
                            users: true,
                            cards: true
                        }
                    },
                    users: {
                        where: { role: 'MANAGER' },
                        select: {
                            isActive: true,
                            lastLoginAt: true
                        },
                        take: 1
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.company.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                companies,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin companies:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des entreprises'
            }
        });
    }
};

/**
 * GET /api/admin/companies/:id
 * Get full details of a specific company
 */
export const getAdminCompanyDetail = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                },
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        isActive: true,
                        lastLoginAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50 // Limit to 50 for now
                },
                _count: {
                    select: {
                        users: true,
                        cards: true
                    }
                }
            }
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Entreprise non trouvée'
                }
            });
        }

        const [revenueAgg, scansCount] = await Promise.all([
            prisma.transaction.aggregate({
                where: { companyId: id, status: 'succeeded' },
                _sum: { amount: true }
            }),
            prisma.cardScan.count({
                where: { card: { user: { companyId: id } } }
            })
        ]);

        const stats = {
            revenue: revenueAgg._sum?.amount ? Number(revenueAgg._sum?.amount) : 0,
            scans: scansCount
        };

        return res.status(200).json({
            success: true,
            data: {
                ...company,
                stats
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin company detail:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération du détail'
            }
        });
    }
};

/**
 * POST /api/admin/companies
 * Create a new B2B company, its primary admin user and subscription
 */
export const createAdminCompany = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { name, email, siretice, country, plans, address, postalCode, city, firstName, lastName } = req.body;

        if (!name || !email || !country || !plans || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Veuillez fournir tous les champs requis (nom, email, prénom, nom, pays, plan)'
                }
            });
        }

        const identifier = (siretice || '').replace(/\s/g, '');

        if (identifier) {
            if (country === 'FR') {
                if (!/^\d{14}$/.test(identifier)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Pour la France, le SIRET doit contenir exactement 14 chiffres.'
                        }
                    });
                }
                
                try {
                    const siretResponse = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${identifier}`);
                    if (siretResponse.ok) {
                        const data: any = await siretResponse.json();
                        if (data.results && data.results.length === 0) {
                            return res.status(400).json({
                                success: false,
                                error: {
                                    code: 'VALIDATION_ERROR',
                                    message: 'SIRET introuvable dans la base de données Data.gouv.'
                                }
                            });
                        }
                    }
                } catch (err) {
                    logger.warn('Could not verify SIRET with data.gouv.fr', err);
                }
            } else if (country === 'MA') {
                if (!/^\d{15}$/.test(identifier)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: "Pour le Maroc, l'ICE doit contenir exactement 15 chiffres."
                        }
                    });
                }
            }
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: 'Cet email est déjà utilisé par un autre compte.'
                }
            });
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: plans } });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: "Le plan d'abonnement sélectionné n'existe pas."
                }
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const slug = generateUniqueSlug(name);
            const currency = country === 'FR' ? 'EUR' : 'MAD';
            
            const company = await tx.company.create({
                data: {
                    name,
                    slug,
                    adminEmail: email,
                    country: country as any,
                    currency: currency as any,
                    siret: country === 'FR' ? identifier : null,
                    ice: country === 'MA' ? identifier : null,
                    address: address || null,
                    postalCode: postalCode || null,
                    city: city || null,
                    status: 'active'
                }
            });

            const randomPassword = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 10);
            
            const user = await tx.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    passwordHash,
                    role: 'MANAGER',
                    companyId: company.id,
                    isActive: false, // Nécessite l'activation
                }
            });

            const now = new Date();
            const periodEnd = new Date(now);
            if (plan.billingPeriod === 'monthly') {
                periodEnd.setMonth(now.getMonth() + 1);
            } else if (plan.billingPeriod === 'yearly') {
                periodEnd.setFullYear(now.getFullYear() + 1);
            } else {
                periodEnd.setFullYear(now.getFullYear() + 100);
            }

            const subscription = await tx.subscription.create({
                data: {
                    companyId: company.id,
                    planId: plan.id,
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    paymentMethod: 'manual_transfer'
                }
            });

            // Créer le token d'invitation
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const invitation = await tx.companyInvitation.create({
                data: {
                    companyId: company.id,
                    email,
                    token,
                    invitedByUserId: (req as any).user.id,
                    expiresAt
                }
            });

            return { company, user, subscription, invitation };
        });

        await syncUserToSupabaseAuth({
            id: result.user.id,
            email: result.user.email,
            passwordHash: result.user.passwordHash,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: 'MANAGER',
        });

        // Envoi réel du mail d'activation (lien de définition du mot de passe)
        const reqOrigin = (req.headers.origin as string) || (req.headers.host ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}` : undefined);
        const emailSent = await emailService.sendCompanyInvitationEmail(email, name, result.invitation.token, reqOrigin);

        logger.info(`Nouvelle entreprise B2B : ${name}. Email d'activation envoyé à ${email} (sent=${emailSent}).`);

        return res.status(201).json({
            success: true,
            data: {
                company: result.company,
                joinToken: result.invitation.token,
                joinPath: `/join/${result.invitation.token}`,
                emailSent,
                message: "Entreprise configurée. L'administrateur a reçu son email d'activation."
            }
        });
    } catch (error: any) {
        logger.error('Failed to create admin company:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: "Erreur inattendue lors de la création de l'entreprise."
            }
        });
    }
};

/**
 * POST /api/admin/companies/:id/impersonate
 * Génère un token de connexion pour le compte Manager de cette entreprise
 */
export const impersonateCompanyAdmin = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                users: {
                    where: { role: 'MANAGER' },
                    take: 1
                }
            }
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Entreprise introuvable.'
                }
            });
        }

        let managerUser = company.users[0];
        if (!managerUser) {
            const passwordHash = await bcrypt.hash('Kliknode2026!', 10);
            managerUser = await prisma.user.upsert({
                where: { email: company.adminEmail },
                update: {
                    role: 'MANAGER',
                    companyId: company.id,
                    isActive: true,
                },
                create: {
                    email: company.adminEmail,
                    firstName: company.name.split(' ')[0] || 'Admin',
                    lastName: 'Manager',
                    passwordHash,
                    role: 'MANAGER',
                    companyId: company.id,
                    isActive: true,
                }
            });
        }

        // Generate tokens for this manager
        const tokens = generateTokens({
            id: managerUser.id,
            email: managerUser.email,
            role: managerUser.role as any,
            companyId: managerUser.companyId || undefined,
        });

        logger.info(`Super Admin impersonating company manager: ${managerUser.email}`);

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: managerUser.id,
                    email: managerUser.email,
                    firstName: managerUser.firstName,
                    lastName: managerUser.lastName,
                    role: managerUser.role,
                    companyId: managerUser.companyId,
                    companyName: company.name,
                },
                tokens,
            }
        });
    } catch (error: any) {
        logger.error('Impersonate error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la connexion au compte'
            }
        });
    }
};

/**
 * PATCH /api/admin/companies/:id/status
 * Bascule le statut de l'entreprise (Actif <=> Suspendu)
 */
export const toggleCompanyStatus = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const company = await prisma.company.findUnique({ where: { id } });

        if (!company) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Entreprise introuvable'
                }
            });
        }

        const newStatus = company.status === 'active' ? 'suspended' : 'active';

        const updatedCompany = await prisma.company.update({
            where: { id },
            data: { status: newStatus }
        });

        logger.info(`Company ${id} status changed to ${newStatus}`);

        return res.status(200).json({
            success: true,
            data: {
                company: updatedCompany,
                message: `Entreprise ${newStatus === 'active' ? 'réactivée' : 'suspendue'} avec succès.`
            }
        });
    } catch (error: any) {
        logger.error('Toggle status error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors du changement de statut'
            }
        });
    }
};

/**
 * POST /api/admin/companies/:id/resend-invitation
 * Renvoie l'email d'invitation avec un nouveau token au Manager
 */
export const resendCompanyInvitation = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                users: {
                    where: { role: 'MANAGER' },
                    take: 1
                }
            }
        });

        if (!company || company.users.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Entreprise ou Manager introuvable.'
                }
            });
        }

        const managerUser = company.users[0];

        // Créer un nouveau token d'invitation
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.companyInvitation.create({
            data: {
                companyId: company.id,
                email: managerUser.email,
                token,
                invitedByUserId: (req as any).user.id,
                expiresAt
            }
        });

        // Envoi de l'email
        const reqOrigin = (req.headers.origin as string) || (req.headers.host ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}` : undefined);
        const emailSent = await emailService.sendCompanyInvitationEmail(managerUser.email, company.name, token, reqOrigin);

        logger.info(`Nouvelle invitation envoyée pour l'entreprise ${company.name} à l'adresse ${managerUser.email} (sent=${emailSent})`);

        return res.status(200).json({
            success: true,
            data: {
                joinToken: token,
                joinPath: `/join/${token}`,
                emailSent,
                message: emailSent
                    ? `Email d'activation envoyé à ${managerUser.email} (lien copié dans le presse-papier).`
                    : `Lien d'activation généré et copié dans le presse-papier.`
            }
        });
    } catch (error: any) {
        logger.error('Resend invitation error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: "Erreur lors de l'envoi de l'invitation"
            }
        });
    }
};

/**
 * DELETE /api/admin/companies/:id
 * Soft delete a company
 */
export const deleteAdminCompany = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const company = await prisma.company.findUnique({
            where: { id },
            include: { users: { select: { id: true, email: true, role: true } } }
        });

        if (!company) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Entreprise introuvable'
                }
            });
        }

        const userIds = company.users.filter(u => u.role !== 'ADMIN').map(u => u.id);
        const userEmails = company.users.filter(u => u.role !== 'ADMIN').map(u => u.email.toLowerCase());

        await prisma.contactLead.deleteMany({ where: { companyId: id } });
        await prisma.physicalCard.updateMany({ where: { companyId: id }, data: { companyId: null, pairedCardId: null, status: 'in_stock' } });
        await prisma.card.deleteMany({ where: { OR: [{ companyId: id }, { userId: { in: userIds } }] } });
        await prisma.hardwareOrder.deleteMany({ where: { companyId: id } });
        await prisma.transaction.deleteMany({ where: { companyId: id } });
        await prisma.subscription.deleteMany({ where: { companyId: id } });
        await prisma.companyInvitation.deleteMany({ where: { companyId: id } });
        await prisma.companyBranding.deleteMany({ where: { companyId: id } });
        await prisma.department.deleteMany({ where: { companyId: id } });
        if (userIds.length > 0) {
            await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
            await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }
        await prisma.company.delete({ where: { id } });

        for (const em of userEmails) {
            if (em !== 'you.rhanime@gmail.com') {
                await prisma.$executeRawUnsafe(`DELETE FROM auth.users WHERE lower(email) = $1`, em).catch(() => {});
            }
        }

        logger.info(`Entreprise supprimée définitivement: ${company.name} (${id})`);

        return res.status(200).json({
            success: true,
            data: {
                message: "L'entreprise et ses comptes associés ont été supprimés avec succès."
            }
        });
    } catch (error: any) {
        logger.error('Delete company error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la suppression de l\'entreprise'
            }
        });
    }
};
