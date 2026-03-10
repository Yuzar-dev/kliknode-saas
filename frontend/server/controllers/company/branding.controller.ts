import prisma from '../../config/database';
import { Request, Response } from 'express';
/**
 * Récupère les paramètres de branding de l'entreprise
 */
export const getBranding = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        let branding = await prisma.companyBranding.findUnique({
            where: { companyId }
        });

        // Si aucun branding n'existe, on en crée un par défaut
        if (!branding) {
            branding = await prisma.companyBranding.create({
                data: {
                    companyId,
                    primaryColor: '#2766ec',
                    fontFamily: 'Inter',
                }
            });
        }

        res.json({
            success: true,
            data: branding
        });
        return;

    } catch (error) {
        console.error('Error fetching branding:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

/**
 * Met à jour les paramètres de branding de l'entreprise
 */
export const updateBranding = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { logoLightUrl, logoDarkUrl, primaryColor, fontFamily, lockPhoto, lockJobTitle, lockSocialLinks, forceLogo } = req.body;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        const branding = await prisma.companyBranding.upsert({
            where: { companyId },
            update: {
                logoLightUrl,
                logoDarkUrl,
                primaryColor,
                fontFamily,
                lockPhoto,
                lockJobTitle,
                lockSocialLinks,
                forceLogo,
                updatedAt: new Date()
            },
            create: {
                companyId,
                logoLightUrl,
                logoDarkUrl,
                primaryColor,
                fontFamily,
                lockPhoto,
                lockJobTitle,
                lockSocialLinks,
                forceLogo
            }
        });

        res.json({
            success: true,
            data: branding
        });
        return;

    } catch (error) {
        console.error('Error updating branding:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};
