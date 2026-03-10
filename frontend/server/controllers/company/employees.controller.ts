import prisma from '../../config/database';
import { Request, Response } from 'express';
export const getEmployees = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;

        if (!companyId) {
            res.status(400).json({
                success: false,
                error: 'Company ID missing from user context'
            });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const departmentId = req.query.departmentId as string;
        const status = req.query.status as string; // 'active', 'inactive', 'pending'

        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: any = {
            companyId,
            deletedAt: null,
            // Exclude company_admin from the list if desired, or keep them. Usually employees list includes everyone.
            // role: { in: ['employee', 'company_admin'] } 
        };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { card: { publicSlug: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (departmentId && departmentId !== 'all') {
            where.departments = {
                some: {
                    departmentId: departmentId
                }
            };
        }

        if (status && status !== 'all') {
            if (status === 'active') {
                where.isActive = true;
            } else if (status === 'inactive') {
                where.isActive = false;
            }
            // 'pending' could be based on emailVerifiedAt or invitation status
        }

        // Execute query
        const [total, employees] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    card: {
                        select: {
                            id: true,
                            publicSlug: true,
                            isPublic: true,
                            viewCount: true
                        }
                    },
                    departments: {
                        include: {
                            department: true
                        }
                    }
                }
            })
        ]);

        const totalPages = Math.ceil(total / limit);

        // Map response to match frontend needs
        const formattedEmployees = employees.map(emp => ({
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone,
            role: emp.role,
            avatarUrl: emp.avatarUrl,
            isActive: emp.isActive,
            // Card details
            badgeId: emp.card?.publicSlug || 'N/A',
            cardStatus: emp.isActive ? (emp.card?.isPublic ? 'Active' : 'Inactive') : 'Suspended', // Simplified logic
            // Department (taking the first one for list view)
            department: emp.departments.length > 0 ? emp.departments[0].department.name : 'Aucun',
            departmentId: emp.departments.length > 0 ? emp.departments[0].departmentId : null
        }));

        res.json({
            success: true,
            data: formattedEmployees,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
        return;

    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
};
