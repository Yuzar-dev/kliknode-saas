// Extension du type Request d'Express pour inclure les propriétés customisées
import { Request } from 'express';

export interface AuthUser {
    id: string;
    email: string;
    role: 'USER' | 'EMPLOYEE' | 'MANAGER' | 'OPERATOR' | 'ADMIN';
    companyId?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta?: PaginationMeta;
}
