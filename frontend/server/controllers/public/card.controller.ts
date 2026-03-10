import prisma from '../../config/database';
import { Request, Response } from 'express';
/**
 * Récupère les données publiques d'une carte via son slug
 */
export const getPublicCard = async (req: Request, res: Response) => {
    try {
        const slug = req.params.slug as string;

        const card = await prisma.card.findUnique({
            where: { publicSlug: slug },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        role: true,
                        avatarUrl: true,
                        company: {
                            include: {
                                branding: true
                            }
                        }
                    }
                }
            }
        });

        if (!card || !card.isPublic || card.deletedAt) {
            return res.status(404).json({
                success: false,
                error: 'Carte introuvable ou privée.'
            });
        }

        // Incrémenter le compteur de vues
        await prisma.card.update({
            where: { id: card.id },
            data: { viewCount: { increment: 1 } }
        });

        // Enregistrer le scan (async sans attendre pour la performance)
        prisma.cardScan.create({
            data: {
                cardId: card.id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        }).catch(err => console.error('Error logging scan:', err));

        return res.json({
            success: true,
            data: card
        });
    } catch (error: any) {
        console.error('Error fetching public card:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la carte.'
        });
    }
};

/**
 * Enregistre un lead (échange de contact)
 * Fonctionne pour B2C (companyId peut être null) et B2B
 */
export const exchangeContact = async (req: Request, res: Response) => {
    try {
        const slug = req.params.slug as string;
        const { firstName, lastName, email, phone, notes } = req.body;

        const card = await prisma.card.findUnique({
            where: { publicSlug: slug },
            include: {
                user: {
                    select: {
                        id: true,
                        companyId: true
                    }
                }
            }
        });

        if (!card) {
            return res.status(404).json({
                success: false,
                error: 'Carte introuvable.'
            });
        }

        const leadData: any = {
            cardId: card.id,
            userId: card.userId,
            firstName,
            lastName,
            email,
            phone,
            notes,
            source: 'web_link',
        };

        // Relier à la company uniquement si l'utilisateur en a une (B2B)
        if (card.user.companyId) {
            leadData.companyId = card.user.companyId;
        }

        const lead = await prisma.contactLead.create({ data: leadData });

        return res.json({
            success: true,
            message: 'Contact partagé avec succès !',
            data: lead
        });
    } catch (error: any) {
        console.error('Error creating contact lead:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi de vos informations.'
        });
    }
};
