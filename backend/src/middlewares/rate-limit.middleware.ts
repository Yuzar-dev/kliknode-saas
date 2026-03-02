import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
const loginMax = parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5');
const signupMax = parseInt(process.env.RATE_LIMIT_SIGNUP_MAX || '3');

/**
 * Rate limiter général pour l'API
 */
export const apiRateLimiter = rateLimit({
    windowMs,
    max: maxRequests,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Trop de requêtes, veuillez réessayer plus tard',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter strict pour le login (5 tentatives/min)
 */
export const loginRateLimiter = rateLimit({
    windowMs,
    max: loginMax,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Trop de tentatives de connexion, veuillez réessayer dans 1 minute',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter pour le signup (3 inscriptions/min)
 */
export const signupRateLimiter = rateLimit({
    windowMs,
    max: signupMax,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Trop d\'inscriptions, veuillez réessayer plus tard',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
