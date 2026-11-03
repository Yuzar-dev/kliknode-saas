import prisma from '../../config/database';
import { Request, Response } from 'express';

/**
 * Récupère la liste des leads (contacts) de l'entreprise
 */
export const getLeads = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        const { search, employeeId, startDate, endDate, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {
            companyId,
        };

        if (search) {
            where.OR = [
                { firstName: { contains: String(search), mode: 'insensitive' } },
                { lastName: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { companyName: { contains: String(search), mode: 'insensitive' } },
            ];
        }

        if (employeeId && employeeId !== 'all') {
            where.userId = String(employeeId);
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) where.createdAt.lte = new Date(String(endDate));
        }

        const [leads, total] = await Promise.all([
            prisma.contactLead.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit),
            }),
            prisma.contactLead.count({ where }),
        ]);

        res.json({
            success: true,
            data: leads,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            }
        });
        return;

    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

export const updateLead = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const id = req.params.id as string;
        const { firstName, lastName, email, phone, companyName, notes } = req.body;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const existing = await prisma.contactLead.findFirst({
            where: { id, companyId }
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Contact introuvable' });
            return;
        }

        const updated = await prisma.contactLead.update({
            where: { id },
            data: {
                firstName: firstName !== undefined ? firstName : existing.firstName,
                lastName: lastName !== undefined ? lastName : existing.lastName,
                email: email !== undefined ? email : existing.email,
                phone: phone !== undefined ? phone : existing.phone,
                companyName: companyName !== undefined ? companyName : existing.companyName,
                notes: notes !== undefined ? notes : existing.notes,
            }
        });

        res.json({
            success: true,
            data: updated,
            message: 'Contact mis à jour avec succès'
        });
        return;
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du contact' });
        return;
    }
};

export const deleteLead = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const id = req.params.id as string;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const existing = await prisma.contactLead.findFirst({
            where: { id, companyId }
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Contact introuvable' });
            return;
        }

        await prisma.contactLead.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Contact supprimé avec succès'
        });
        return;
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression du contact' });
        return;
    }
};

export const getCompanyCrmConfig = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID missing' });
        }
        const { getCrmConfig } = await import('../../services/crm-sync.service');
        const config = getCrmConfig(`company:${companyId}`);
        return res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error getting company CRM config:', error);
        return res.status(500).json({ success: false, error: 'Erreur lors de la récupération de la configuration CRM' });
    }
};

export const saveCompanyCrmConfig = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID missing' });
        }
        const { provider, enabled, autoSync, apiKey, webhookUrl, tiimeCompanyId } = req.body;
        const { saveCrmConfig } = await import('../../services/crm-sync.service');
        const updated = saveCrmConfig(`company:${companyId}`, {
            provider: provider || 'tiime',
            enabled: Boolean(enabled),
            autoSync: autoSync !== undefined ? Boolean(autoSync) : true,
            apiKey: apiKey !== undefined ? String(apiKey).trim() : '',
            webhookUrl: webhookUrl !== undefined ? String(webhookUrl).trim() : '',
            tiimeCompanyId: tiimeCompanyId !== undefined ? String(tiimeCompanyId).trim() : '',
        });
        return res.json({
            success: true,
            data: updated,
            message: `Configuration ${updated.provider.toUpperCase()} enregistrée avec succès.`
        });
    } catch (error) {
        console.error('Error saving company CRM config:', error);
        return res.status(500).json({ success: false, error: 'Erreur lors de la sauvegarde CRM' });
    }
};

export const syncCompanyLeadsToCrm = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, error: 'Company ID missing' });
        }
        const leads = await prisma.contactLead.findMany({
            where: { companyId },
            include: {
                user: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        if (leads.length === 0) {
            return res.json({
                success: true,
                data: { syncedCount: 0, failedCount: 0, message: 'Aucun contact à synchroniser pour le moment.' }
            });
        }

        const { syncLeadsBatchToCrm } = await import('../../services/crm-sync.service');
        const result = await syncLeadsBatchToCrm(
            `company:${companyId}`,
            leads.map(l => ({
                ...l,
                ownerName: l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : 'Équipe'
            }))
        );

        return res.json({
            success: result.syncedCount > 0,
            data: result,
            message: result.message
        });
    } catch (error) {
        console.error('Error syncing company leads to CRM:', error);
        return res.status(500).json({ success: false, error: 'Erreur lors de la synchronisation CRM' });
    }
};
