import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCompanyDashboardStats = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        // 1. Employee & Card Stats
        const totalEmployees = await prisma.user.count({
            where: { companyId, deletedAt: null }
        });

        const activeCards = await prisma.card.count({
            where: {
                user: { companyId },
                isPublic: true,
                deletedAt: null
            }
        });

        // 2. Engagement Stats (Total Views across all company cards)
        const cardsWithViews = await prisma.card.groupBy({
            by: ['userId'],
            where: { user: { companyId } },
            _sum: { viewCount: true }
        });

        const totalViews = cardsWithViews.reduce((acc, curr) => acc + (curr._sum.viewCount || 0), 0);

        // 3. Recent Scans (Activity Feed)
        // Get generic recent scans for cards belonging to this company
        const recentScans = await prisma.cardScan.findMany({
            where: {
                card: {
                    user: { companyId }
                }
            },
            take: 5,
            orderBy: { scannedAt: 'desc' },
            include: {
                card: {
                    select: {
                        firstName: true,
                        lastName: true,
                        publicSlug: true
                    }
                }
            }
        });

        // 4. Contact Leads (New Connections)
        const recentLeads = await prisma.contactLead.findMany({
            where: { companyId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                card: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: {
                stats: {
                    employees: totalEmployees,
                    activeCards,
                    totalViews,
                },
                recentScans: recentScans.map(scan => ({
                    ...scan,
                    cardName: `${scan.card.firstName} ${scan.card.lastName}`
                })),
                recentLeads: recentLeads.map(lead => ({
                    ...lead,
                    capturedBy: `${lead.card.firstName} ${lead.card.lastName}`
                }))
            }
        });
        return;

    } catch (error) {
        console.error('Error fetching company dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};
