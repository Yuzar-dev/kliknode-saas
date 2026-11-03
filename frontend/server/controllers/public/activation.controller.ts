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
        const rawUid = decodeURIComponent(String(req.params.uid || '')).trim();
        const cleanUid = rawUid.replace(/:/g, '').toUpperCase();
        const colonUid = cleanUid.match(/.{1,2}/g)?.join(':') || rawUid;

        // Chercher la carte physique par UID (format uniforme 14 caractères ou ancien format avec :)
        const physicalCard = await prisma.physicalCard.findFirst({
            where: {
                OR: [
                    { uid: { equals: rawUid, mode: 'insensitive' } },
                    { uid: { equals: cleanUid, mode: 'insensitive' } },
                    { uid: { equals: colonUid, mode: 'insensitive' } },
                ],
            },
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
                data: { status: 'lost', uid: physicalCard.uid },
            });
        }

        // Carte en stock (non encore pairée par opérateur)
        if (physicalCard.status === 'in_stock') {
            return res.status(200).json({
                success: true,
                data: { status: 'in_stock', uid: physicalCard.uid },
            });
        }

        // Carte réservée mais pas encore pairée
        if (physicalCard.status === 'reserved' && !physicalCard.pairedCardId) {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'reserved',
                    uid: physicalCard.uid,
                    companyId: physicalCard.companyId,
                    message: 'Carte réservée, en attente de pairage',
                },
            });
        }

        // Carte pairée → rediriger vers le profil public /p/:slug et incrémenter le compteur
        if (physicalCard.status === 'paired' && physicalCard.pairedCard) {
            const card = physicalCard.pairedCard;
            const slug = card.publicSlug || card.userId;

            // Incrémenter le compteur de vues/scans sans bloquer
            prisma.card.update({
                where: { id: card.id },
                data: { viewCount: { increment: 1 } },
            }).catch(() => {});

            if (slug) {
                return res.status(200).json({
                    success: true,
                    data: {
                        status: 'paired_with_profile',
                        uid: physicalCard.uid,
                        publicSlug: slug,
                        redirectUrl: `/p/${slug}`,
                    },
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    status: 'paired_no_profile',
                    cardUid: physicalCard.uid,
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
