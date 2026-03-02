import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    companyId?: string;
}

/**
 * Génère un access token JWT
 */
export const generateAccessToken = (user: AuthUser): string => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
    };

    // @ts-ignore - TypeScript strict check on jwt.sign expiresIn
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Génère un refresh token JWT
 */
export const generateRefreshToken = (user: AuthUser): string => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
    };

    // @ts-ignore - TypeScript strict check on jwt.sign expiresIn
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Vérifie et décode un access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Vérifie et décode un refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};

/**
 * Génère les deux tokens (access + refresh)
 */
export const generateTokens = (user: AuthUser) => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    };
};
