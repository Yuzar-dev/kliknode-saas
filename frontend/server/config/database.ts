import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.util';

// Utiliser le port Session (5432) avec un pool adapté (connection_limit=2 en prod serverless, 5 en local)
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && dbUrl.includes(':6543')) {
    dbUrl = dbUrl.replace(':6543', ':5432');
    dbUrl = dbUrl.replace('?pgbouncer=true&', '?').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
}
if (dbUrl && !dbUrl.includes('connection_limit=')) {
    const limit = process.env.NODE_ENV === 'production' ? 2 : 5;
    dbUrl = dbUrl.includes('?')
        ? `${dbUrl}&connection_limit=${limit}&pool_timeout=20`
        : `${dbUrl}?connection_limit=${limit}&pool_timeout=20`;
}

// Instance unique de Prisma Client
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

let cleanupCompletedInMemory = false;
let cleanupRunningPromise: Promise<void> | null = null;

/**
 * Nettoie une seule fois la base de données pour ne conserver QUE you.rhanime@gmail.com (ADMIN)
 * et supprimer toutes les anciennes entreprises (Tesla, Marjane, Yuzarprod...) et anciens comptes.
 * Un marqueur persistant `prod_cleanup_v2 = "done"` est enregistré dans `auth.users` pour ne jamais
 * supprimer les entreprises (ex: Yuzar), utilisateurs et opérateurs créés ensuite en production.
 */
export const ensureCleanDatabase = async (): Promise<void> => {
    if (cleanupCompletedInMemory) return;
    if (cleanupRunningPromise) return cleanupRunningPromise;

    cleanupRunningPromise = (async () => {
        try {
            // 1. S'assurer que you.rhanime@gmail.com est bien ADMIN sans entreprise liée
            await prisma.user.updateMany({
                where: { email: { equals: 'you.rhanime@gmail.com', mode: 'insensitive' } },
                data: {
                    role: 'ADMIN',
                    companyId: null,
                    isActive: true,
                    deletedAt: null,
                }
            }).catch(() => {});

            // 2. S'assurer que chaque compte adminEmail d'entreprise active (ex: direction@yuzarprod.com)
            // a bien son companyId et son rôle MANAGER rattachés, et nettoyer les noms INSEE "PRENOM NOM (ENSEIGNE)"
            const activeCompanies = await prisma.company.findMany({
                where: { deletedAt: null },
                select: { id: true, name: true, adminEmail: true },
            }).catch(() => []);

            for (const comp of activeCompanies) {
                const parenMatch = comp.name?.match(/^[^()]+\(([^()]+)\)\s*$/);
                const cleanedName = parenMatch ? parenMatch[1].trim() : comp.name;
                if (cleanedName && cleanedName !== comp.name) {
                    await prisma.company.update({
                        where: { id: comp.id },
                        data: { name: cleanedName },
                    }).catch(() => {});
                    await prisma.card.updateMany({
                        where: { OR: [{ companyId: comp.id }, { companyName: comp.name }] },
                        data: { companyName: cleanedName },
                    }).catch(() => {});
                }

                if (comp.adminEmail && comp.adminEmail.toLowerCase() !== 'you.rhanime@gmail.com') {
                    await prisma.user.updateMany({
                        where: { email: { equals: comp.adminEmail, mode: 'insensitive' } },
                        data: {
                            companyId: comp.id,
                            role: 'MANAGER',
                            isActive: true,
                        },
                    }).catch(() => {});
                }
            }

            cleanupCompletedInMemory = true;
        } catch (err: any) {
            logger.warn('Database integrity check error:', err?.message || err);
        } finally {
            cleanupRunningPromise = null;
        }
    })();

    return cleanupRunningPromise;
};

/**
 * Synchronise un utilisateur créé dans `public.users` vers `auth.users` (Supabase Authentication)
 * afin qu'il apparaisse immédiatement dans le tableau Authentication de Supabase.
 */
export const syncUserToSupabaseAuth = async (params: {
    id: string;
    email: string;
    passwordHash: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
    confirmed?: boolean;
}): Promise<void> => {
    try {
        const cleanEmail = params.email.toLowerCase().trim();
        const fullName = `${params.firstName || ''} ${params.lastName || ''}`.trim();
        const metaJson = JSON.stringify({
            sub: params.id,
            email: cleanEmail,
            first_name: params.firstName || '',
            last_name: params.lastName || '',
            full_name: fullName || cleanEmail,
            display_name: fullName || cleanEmail,
            role: params.role,
            email_verified: true,
        });

        await prisma.$executeRawUnsafe(
            `INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password,
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                $1::uuid,
                'authenticated',
                'authenticated',
                $2,
                $3,
                NOW(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                $4::jsonb,
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                raw_user_meta_data = COALESCE(auth.users.raw_user_meta_data, '{}'::jsonb) || EXCLUDED.raw_user_meta_data,
                email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
                updated_at = NOW()`,
            params.id,
            cleanEmail,
            params.passwordHash,
            metaJson
        );
    } catch (err: any) {
        logger.warn(`Could not sync user ${params.email} to auth.users:`, err?.message || err);
    }
};

// Gérer la connexion/déconnexion proprement
prisma.$connect()
    .then(async () => {
        logger.info('✅ Database connected successfully');
        await ensureCleanDatabase();
    })
    .catch((error) => {
        logger.error('❌ Database connection failed:', error);
    });

// Fermer la connexion lors de l'arrêt de l'application
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger.info('Database disconnected');
});

export default prisma;
