import prisma from '../../config/database';
import { Request, Response } from 'express';
import { syncAllInventoryFromCardsAndOrders } from '../../services/stock-sync.service';

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

        const cardsWithViews = await prisma.card.groupBy({
            by: ['userId'],
            where: { user: { companyId } },
            _sum: { viewCount: true }
        });

        const totalViews = cardsWithViews.reduce((acc, curr) => acc + (curr._sum.viewCount || 0), 0);

        const recentScans = await prisma.cardScan.findMany({
            where: {
                card: {
                    user: { companyId }
                }
            },
            take: 10,
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

        const hardwareOrders = await prisma.hardwareOrder.findMany({
            where: { companyId },
            take: 5,
            orderBy: { createdAt: 'desc' }
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
                    cardName: `${scan.card.firstName || ''} ${scan.card.lastName || ''}`.trim() || 'Carte KlikNode'
                })),
                recentLeads: recentLeads.map(lead => ({
                    ...lead,
                    capturedBy: `${lead.card.firstName || ''} ${lead.card.lastName || ''}`.trim()
                })),
                hardwareOrders
            }
        });
        return;

    } catch (error) {
        console.error('Error fetching company dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

export const createHardwareOrder = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { quantity, shippingAddress, warehouse } = req.body;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const qty = Number(quantity) || 1;
        if (qty < 1 || qty > 500) {
            res.status(400).json({ success: false, error: 'Quantité invalide (1 à 500 cartes)' });
            return;
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        const finalAddress = shippingAddress?.trim() || company?.address || `${company?.city || 'Paris'}, ${company?.country || 'FR'}`;
        const finalWarehouse = warehouse === 'oujda' ? 'oujda' : (company?.country === 'MA' ? 'oujda' : 'paris');
        const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const order = await prisma.hardwareOrder.create({
            data: {
                companyId,
                orderNumber,
                quantity: qty,
                status: 'pending',
                warehouse: finalWarehouse,
                shippingAddress: finalAddress,
            }
        });

        await syncAllInventoryFromCardsAndOrders();

        res.status(201).json({
            success: true,
            data: order,
            message: `Commande ${orderNumber} (${qty} carte(s)) enregistrée avec succès`
        });
        return;
    } catch (error) {
        console.error('Error creating hardware order:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la création de la commande' });
        return;
    }
};
