import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ApiResponse } from '../../types/express';
import logger from '../../utils/logger.util';

/**
 * GET /api/admin/audit-logs
 * List all audit logs with pagination and filters
 */
export const getAdminAuditLogs = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const {
            page = '1',
            limit = '20',
            search,
            action,
            entityType,
            startDate,
            endDate
        } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const where: any = {};

        if (search) {
            where.OR = [
                { ipAddress: { contains: search as string, mode: 'insensitive' } },
                { user: { email: { contains: search as string, mode: 'insensitive' } } },
                { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
                { user: { lastName: { contains: search as string, mode: 'insensitive' } } }
            ];
        }

        if (action) {
            where.action = action as string;
        }

        if (entityType) {
            where.entityType = entityType as string;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.auditLog.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                logs,
                pagination: {
                    total,
                    page: parseInt(page as string),
                    limit: take,
                    totalPages: Math.ceil(total / take)
                }
            }
        });
    } catch (error: any) {
        logger.error('Failed to fetch admin audit logs:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des logs d\'audit'
            }
        });
    }
};

/**
 * GET /api/admin/audit-logs/:id
 * Get details of a specific audit log
 */
export const getAdminAuditLogDetails = async (req: Request, res: Response<ApiResponse>) => {
    try {
        const id = String(req.params.id);

        const log = await prisma.auditLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'LOG_NOT_FOUND',
                    message: 'Entrée de log introuvable'
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: log
        });
    } catch (error: any) {
        logger.error('Failed to fetch audit log details:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Erreur lors de la récupération des détails du log'
            }
        });
    }
};
