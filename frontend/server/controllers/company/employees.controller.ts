import prisma, { syncUserToSupabaseAuth } from '../../config/database';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

const generateSlug = (firstName?: string | null, lastName?: string | null) => {
    const base = `${firstName || 'user'}-${lastName || 'card'}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
};

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
        const status = req.query.status as string;

        const skip = (page - 1) * limit;

        const where: any = {
            companyId,
            deletedAt: null,
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
            } else if (status === 'inactive' || status === 'suspended') {
                where.isActive = false;
            }
        }

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
                            viewCount: true,
                            jobTitle: true
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

        const formattedEmployees = employees.map(emp => ({
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone,
            role: emp.role,
            avatarUrl: emp.avatarUrl,
            isActive: emp.isActive,
            jobTitle: emp.card?.jobTitle || '',
            badgeId: emp.card?.publicSlug || 'N/A',
            cardStatus: emp.isActive ? (emp.card?.isPublic ? 'Active' : 'Inactive') : 'Suspended',
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

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const { firstName, lastName, email, phone, jobTitle, departmentId, password } = req.body;

        if (!email || !firstName || !lastName) {
            res.status(400).json({ success: false, error: 'Prénom, nom et email sont requis' });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existing) {
            res.status(409).json({ success: false, error: 'Cet email est déjà utilisé' });
            return;
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { branding: true }
        });
        const rawPassword = password || 'Kliknode2026!';
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        const publicSlug = generateSlug(firstName, lastName);

        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                passwordHash,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone || null,
                role: 'USER',
                companyId,
                isActive: true,
                card: {
                    create: {
                        companyId,
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        email: email.toLowerCase().trim(),
                        phoneMobile: phone || null,
                        jobTitle: jobTitle || 'Collaborateur',
                        companyName: company?.name || '',
                        primaryColor: company?.branding?.primaryColor || '#0666EB',
                        publicSlug,
                        isPublic: true,
                    }
                },
                ...(departmentId && departmentId !== 'none' ? {
                    departments: {
                        create: {
                            departmentId
                        }
                    }
                } : {})
            },
            include: {
                card: true,
                departments: { include: { department: true } }
            }
        });

        await syncUserToSupabaseAuth({
            id: newUser.id,
            email: newUser.email,
            passwordHash,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: 'USER',
        });

        res.status(201).json({
            success: true,
            data: newUser,
            temporaryPassword: rawPassword
        });
        return;
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la création du collaborateur' });
        return;
    }
};

export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const id = req.params.id as string;
        const { firstName, lastName, email, phone, jobTitle, departmentId } = req.body;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const employee = await prisma.user.findFirst({
            where: { id, companyId, deletedAt: null },
            include: { card: true }
        });

        if (!employee) {
            res.status(404).json({ success: false, error: 'Collaborateur introuvable' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id },
                data: {
                    firstName: firstName !== undefined ? firstName : employee.firstName,
                    lastName: lastName !== undefined ? lastName : employee.lastName,
                    email: email !== undefined ? email.toLowerCase().trim() : employee.email,
                    phone: phone !== undefined ? phone : employee.phone,
                }
            });

            if (employee.card) {
                await tx.card.update({
                    where: { id: employee.card.id },
                    data: {
                        firstName: firstName !== undefined ? firstName : employee.card.firstName,
                        lastName: lastName !== undefined ? lastName : employee.card.lastName,
                        email: email !== undefined ? email.toLowerCase().trim() : employee.card.email,
                        phoneMobile: phone !== undefined ? phone : employee.card.phoneMobile,
                        jobTitle: jobTitle !== undefined ? jobTitle : employee.card.jobTitle,
                    }
                });
            }

            if (departmentId !== undefined) {
                await tx.userDepartment.deleteMany({ where: { userId: id } });
                if (departmentId && departmentId !== 'none') {
                    await tx.userDepartment.create({
                        data: { userId: id, departmentId }
                    });
                }
            }
        });

        res.json({ success: true, message: 'Collaborateur mis à jour avec succès' });
        return;
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du collaborateur' });
        return;
    }
};

export const toggleEmployeeStatus = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const id = req.params.id as string;

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const employee = await prisma.user.findFirst({
            where: { id, companyId, deletedAt: null },
            include: { card: true }
        });

        if (!employee) {
            res.status(404).json({ success: false, error: 'Collaborateur introuvable' });
            return;
        }

        const newStatus = !employee.isActive;

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id },
                data: { isActive: newStatus }
            });
            if (employee.card) {
                await tx.card.update({
                    where: { id: employee.card.id },
                    data: { isPublic: newStatus }
                });
            }
        });

        res.json({
            success: true,
            data: { isActive: newStatus },
            message: newStatus ? 'Collaborateur réactivé' : 'Collaborateur suspendu'
        });
        return;
    } catch (error) {
        console.error('Error toggling employee status:', error);
        res.status(500).json({ success: false, error: 'Erreur lors du changement de statut' });
        return;
    }
};

export const resetEmployeePassword = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const id = req.params.id as string;
        const { newPassword } = req.body || {};

        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const employee = await prisma.user.findFirst({
            where: { id, companyId, deletedAt: null }
        });

        if (!employee) {
            res.status(404).json({ success: false, error: 'Collaborateur introuvable' });
            return;
        }

        const tempPassword = newPassword || `Klik-${Math.random().toString(36).substring(2, 8).toUpperCase()}!`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        await prisma.user.update({
            where: { id },
            data: { passwordHash }
        });

        res.json({
            success: true,
            data: { temporaryPassword: tempPassword },
            message: 'Mot de passe réinitialisé avec succès'
        });
        return;
    } catch (error) {
        console.error('Error resetting employee password:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la réinitialisation du mot de passe' });
        return;
    }
};

export const importEmployeesCsv = async (req: Request, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ success: false, error: 'Company ID missing' });
            return;
        }

        const { employees } = req.body;
        if (!Array.isArray(employees) || employees.length === 0) {
            res.status(400).json({ success: false, error: 'Aucun collaborateur à importer' });
            return;
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        const passwordHash = await bcrypt.hash('Kliknode2026!', 10);
        let createdCount = 0;
        let skippedCount = 0;

        for (const emp of employees) {
            const email = (emp.email || '').toLowerCase().trim();
            if (!email) {
                skippedCount++;
                continue;
            }
            const exists = await prisma.user.findUnique({ where: { email } });
            if (exists) {
                skippedCount++;
                continue;
            }

            const firstName = (emp.firstName || 'Collaborateur').trim();
            const lastName = (emp.lastName || '').trim();
            const publicSlug = generateSlug(firstName, lastName);

            await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    phone: emp.phone || null,
                    role: 'USER',
                    companyId,
                    isActive: true,
                    card: {
                        create: {
                            companyId,
                            firstName,
                            lastName,
                            email,
                            phoneMobile: emp.phone || null,
                            jobTitle: emp.jobTitle || 'Collaborateur',
                            companyName: company?.name || '',
                            publicSlug,
                            isPublic: true,
                        }
                    }
                }
            });
            createdCount++;
        }

        res.json({
            success: true,
            data: { createdCount, skippedCount },
            message: `${createdCount} collaborateur(s) importé(s), ${skippedCount} ignoré(s)`
        });
        return;
    } catch (error) {
        console.error('Error importing employees CSV:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de l\'import CSV' });
        return;
    }
};
