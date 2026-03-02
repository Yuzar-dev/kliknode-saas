import { Request, Response } from 'express';
import prisma from '../../config/database';
import logger from '../../utils/logger.util';
import { ApiResponse } from '../../types/express';

/**
 * GET /api/public/activate/:uid
 * Détecte le statut d'une carte physique scannée par NFC
 *
 * Retourne :
 *  - not_found       → UID inconnu
 *  - in_stock        → Carte non encore encadrée par un opérateur
 *  - paired_no_profile → Carte pairée mais utilisateur sans profil complet
 *  - paired_with_profile → Carte pairée ET profil existant → redirige vers /p/:slug
 *  - lost            → Carte déclarée perdue
 */
export const activateCard = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { uid } = req.params;

        // Chercher la carte physique par UID
        const physicalCard = await prisma.physicalCard.findUnique({
            where: { uid },
            include: {
                pairedCard: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        socialLinks: {
                            where: { isActive: true },
                        },
                    },
                },
            },
        });

        // Carte introuvable
        if (!physicalCard) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'CARD_NOT_FOUND',
                    message: 'Carte inconnue',
                },
                data: { status: 'not_found' },
            });
        }

        // Carte déclarée perdue
        if (physicalCard.status === 'lost') {
            return res.status(200).json({
                success: true,
                data: { status: 'lost' },
            });
        }

        // Carte en stock (non encore pairée par opérateur)
        if (physicalCard.status === 'in_stock') {
            return res.status(200).json({
                success: true,
                data: { status: 'in_stock' },
            });
        }

        // Carte réservée mais pas encore pairée
        if (physicalCard.status === 'reserved' && !physicalCard.pairedCardId) {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'reserved',
                    message: 'Carte réservée, en attente de pairage',
                },
            });
        }

        // Carte pairée → vérifier si le profil est complet
        if (physicalCard.status === 'paired' && physicalCard.pairedCard) {
            const card = physicalCard.pairedCard;
            const hasProfile = card.user && card.firstName && card.lastName;

            if (hasProfile) {
                return res.status(200).json({
                    success: true,
                    data: {
                        status: 'paired_with_profile',
                        publicSlug: card.publicSlug,
                        redirectUrl: `/p/${card.publicSlug}`,
                    },
                });
            }

            // Pairée mais profil incomplet → l'utilisateur doit créer un compte
            return res.status(200).json({
                success: true,
                data: {
                    status: 'paired_no_profile',
                    cardUid: uid,
                },
            });
        }

        // Fallback — statut inconnu
        return res.status(200).json({
            success: true,
            data: {
                status: physicalCard.status,
                message: 'Statut de carte non géré',
            },
        });
    } catch (error: any) {
        logger.error('Activation error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la vérification de la carte',
            },
        });
    }
};
