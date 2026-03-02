import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.util';

// Instance unique de Prisma Client
const prisma = new PrismaClient({
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
