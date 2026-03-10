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

        // Fetch departments with stats
        const departments = await prisma.department.findMany({
            where: {
                companyId
            },
            include: {
                _count: {
                    select: { users: true }
                },
                users: {
                    take: 3, // Get top 3 members for avatars
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate "Activity" mock logic for now
        // In a real scenario, we would aggregate card scans for users in this department
        const formattedDepartments = departments.map(dept => {
            // Mock activity: 20-100% random per department for demo purposes
            // or based on actual scans if we had time to aggregate complex queries
            const memberCount = dept._count.users;
            const activityPercent = memberCount > 0 ? Math.floor(Math.random() * (100 - 40) + 40) : 0;

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
