import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';
import { apiRateLimiter } from './middlewares/rate-limit.middleware';
import logger from './utils/logger.util';

// Charger les variables d'environnement
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Middlewares globaux
 */
// Sécurité
app.use(helmet());

// CORS
app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    })
);

// Parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
app.use('/api', apiRateLimiter);

/**
 * Welcome page
 */
app.get('/', (_req, res) => {
    res.status(200).json({
        success: true,
        data: {
            message: '🚀 Bienvenue sur V-Card SaaS API',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            endpoints: {
                health: '/health',
                api: '/api',
                auth: '/api/auth',
            },
            documentation: {
                postman: 'Importez la collection Postman',
                swagger: 'À venir',
            },
        },
    });
});

/**
 * Health check
 */
app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

/**
 * Routes API
 */
app.use('/api', routes);

/**
 * Gestion des erreurs 404
 */
app.use(notFoundMiddleware);

/**
 * Middleware de gestion globale des erreurs (doit être en dernier)
 */
app.use(errorMiddleware);

if (!process.env.VERCEL) {
    /**
     * Démarrage du serveur si exécuté localement
     */
    const server = app.listen(PORT, () => {
        logger.info(`🚀 Server running on http://localhost:${PORT}`);
        logger.info(`📚 API available at http://localhost:${PORT}/api`);
        logger.info(`🏥 Health check at http://localhost:${PORT}/health`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    /**
     * Gestion propre de l'arrêt du serveur
     */
    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        logger.info('SIGINT signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });
}

export default app;
