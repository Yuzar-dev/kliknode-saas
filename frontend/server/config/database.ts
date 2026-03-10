import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.util';

// CONTOURNEMENT BUG SUPABASE : Le pooler Transaction (6543) de Supavisor a un bug connu avec Prisma ("Cannot coerce JSON").
// La solution officielle est d'utiliser le port direct/Session (5432) avec connection_limit=1 sur Vercel.
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && dbUrl.includes(':6543')) {
    // Force utilisation du port 5432
    dbUrl = dbUrl.replace(':6543', ':5432');
    // Retire le paramètre pgbouncer car il n'est plus nécessaire sur le port 5432
    dbUrl = dbUrl.replace('?pgbouncer=true&', '?').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
}
// Ajoute connection_limit=1 si absent pour optimiser le serverless sans épuiser les DB connections
if (dbUrl && !dbUrl.includes('connection_limit=')) {
    dbUrl = dbUrl.includes('?') ? `${dbUrl}&connection_limit=1` : `${dbUrl}?connection_limit=1`;
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
