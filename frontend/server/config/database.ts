import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.util';

// Injection automatique de pgbouncer=true et connection_limit=1 pour Vercel serverless
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && dbUrl.includes(':6543')) {
    if (!dbUrl.includes('pgbouncer=true')) {
        dbUrl = dbUrl.includes('?') ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true`;
    }
    if (!dbUrl.includes('connection_limit=')) {
        dbUrl = `${dbUrl}&connection_limit=1`;
    }
}

// Instance unique de Prisma Client
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Gérer la connexion/déconnexion proprement
prisma.$connect()
    .then(() => {
        logger.info('✅ Database connected successfully');
    })
    .catch((error) => {
        logger.error('❌ Database connection failed:', error);
        process.exit(1);
    });

// Fermer la connexion lors de l'arrêt de l'application
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger.info('Database disconnected');
});

export default prisma;
