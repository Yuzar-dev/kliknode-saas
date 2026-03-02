import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        // Construction du filtre
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

        if (employeeId) {
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
