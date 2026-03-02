import prisma from '../config/database';
import logger from '../utils/logger.util';

interface AuditLogData {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Service pour logger les actions sensibles dans audit_logs
 */
export class AuditService {
    /**
     * Créer un log d'audit
     */
    static async log(data: AuditLogData): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    changes: data.changes || null,
                    ipAddress: data.ipAddress || null,
                    userAgent: data.userAgent || null,
                },
            });

            logger.info('Audit log created:', {
                action: data.action,
                entityType: data.entityType,
                userId: data.userId,
            });
        } catch (error) {
            logger.error('Failed to create audit log:', error);
            // Ne pas bloquer l'exécution si le log échoue
        }
    }

    /**
     * Logger une création
     */
    static async logCreate(
        userId: string,
        entityType: string,
        entityId: string,
        data: any,
        req?: any
    ): Promise<void> {
        await this.log({
            userId,
            action: `${entityType.toLowerCase()}.created`,
            entityType,
            entityId,
            changes: { new: data },
            ipAddress: req?.ip,
            userAgent: req?.get('user-agent'),
        });
    }

    /**
     * Logger une modification
     */
    static async logUpdate(
        userId: string,
        entityType: string,
        entityId: string,
        oldData: any,
        newData: any,
        req?: any
    ): Promise<void> {
        await this.log({
            userId,
            action: `${entityType.toLowerCase()}.updated`,
            entityType,
            entityId,
            changes: { old: oldData, new: newData },
            ipAddress: req?.ip,
            userAgent: req?.get('user-agent'),
        });
    }

    /**
     * Logger une suppression
     */
    static async logDelete(
        userId: string,
        entityType: string,
        entityId: string,
        data: any,
        req?: any
    ): Promise<void> {
        await this.log({
            userId,
            action: `${entityType.toLowerCase()}.deleted`,
            entityType,
            entityId,
            changes: { old: data },
            ipAddress: req?.ip,
            userAgent: req?.get('user-agent'),
        });
    }
}

export default AuditService;
