import prisma from '../../config/database';
import { Request, Response } from 'express';

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        const departments = await prisma.department.findMany({
            where: {
                companyId
            },
            include: {
                _count: {
                    select: { users: true }
                },
                users: {
                    take: 3,
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedDepartments = departments.map(dept => {
            const memberCount = dept._count.users;
            const activeSample = dept.users.filter(u => u.user.isActive).length;
            const activityPercent = memberCount > 0
                ? Math.min(100, Math.max(45, Math.round((activeSample / Math.min(memberCount, 3)) * 85)))
                : 0;

            return {
                id: dept.id,
                name: dept.name,
                createdAt: dept.createdAt,
                memberCount,
                activityPercent,
                topMembers: dept.users.map(u => ({
                    id: u.user.id,
                    firstName: u.user.firstName,
                    lastName: u.user.lastName,
                    avatarUrl: u.user.avatarUrl
                }))
            };
        });

        res.json({
            success: true,
            data: formattedDepartments
        });
        return;

    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { name } = req.body;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        if (!name || !name.trim()) {
            res.status(400).json({ success: false, error: 'Le nom du département est requis' });
            return;
        }

        const dept = await prisma.department.create({
            data: {
                companyId,
                name: name.trim()
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: dept.id,
                name: dept.name,
                createdAt: dept.createdAt,
                memberCount: 0,
                activityPercent: 0,
                topMembers: []
            }
        });
        return;
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la création du département' });
        return;
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const id = req.params.id as string;
        const { name } = req.body;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        if (!name || !name.trim()) {
            res.status(400).json({ success: false, error: 'Le nom du département est requis' });
            return;
        }

        const existing = await prisma.department.findFirst({
            where: { id, companyId }
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Département introuvable' });
            return;
        }

        const updated = await prisma.department.update({
            where: { id },
            data: { name: name.trim() }
        });

        res.json({
            success: true,
            data: updated,
            message: 'Département renommé avec succès'
        });
        return;
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la modification du département' });
        return;
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const id = req.params.id as string;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const existing = await prisma.department.findFirst({
            where: { id, companyId }
        });

        if (!existing) {
            res.status(404).json({ success: false, error: 'Département introuvable' });
            return;
        }

        await prisma.department.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Département supprimé avec succès'
        });
        return;
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression du département' });
        return;
    }
};
