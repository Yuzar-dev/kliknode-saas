import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

/**
 * Configuration du logger Winston
 */
export const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'vcard-saas-backend' },
    transports: process.env.VERCEL ? [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ] : [
        // Fichier d'erreurs
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Fichier combiné (tous les logs)
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// En développement, log aussi dans la console
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

export default logger;
