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
            const checkRows = await prisma.$queryRawUnsafe<Array<{
                id: string;
                email: string;
                encrypted_password: string | null;
                done: string | null;
            }>>(
                `SELECT id, email, encrypted_password, raw_user_meta_data->>'prod_cleanup_v3' as done
                 FROM auth.users
                 WHERE lower(email) = 'you.rhanime@gmail.com'
                 LIMIT 1`
            ).catch(() => []);

            if (checkRows.length > 0 && checkRows[0].done === 'done') {
                cleanupCompletedInMemory = true;
                return;
            }

            logger.info('🧹 Executing production cleanup v3 (removing all old users and active cards)...');

            // 1. Supprimer toutes les tables enfants des cartes et stocks en parallèle
            await Promise.allSettled([
                prisma.linkClick.deleteMany({}),
                prisma.lead.deleteMany({}),
                prisma.contactLead.deleteMany({}),
                prisma.cardScan.deleteMany({}),
                prisma.physicalCard.deleteMany({}),
                prisma.inventory.deleteMany({}),
                prisma.hardwareOrder.deleteMany({}),
                prisma.transaction.deleteMany({}),
                prisma.auditLog.deleteMany({}),
                prisma.userDepartment.deleteMany({}),
                prisma.passwordReset.deleteMany({}),
                prisma.$executeRawUnsafe(`DELETE FROM public.contacts`),
            ]);

            // 2. Supprimer TOUTES les cartes actives existantes (remise à 0 complète des cartes)
            await prisma.card.deleteMany({}).catch(() => {});
            await prisma.$executeRawUnsafe(`DELETE FROM public.cards`).catch(() => {});
            await prisma.$executeRawUnsafe(`DELETE FROM public.profiles WHERE lower(email) NOT IN ('you.rhanime@gmail.com', 'direction@yuzarprod.com')`).catch(() => {});

            // 3. Conserver uniquement you.rhanime@gmail.com (SuperAdmin) et direction@yuzarprod.com (YUZARPROD)
            const keepEmails = ['you.rhanime@gmail.com', 'direction@yuzarprod.com'];

            const usersToRemove = await prisma.user.findMany({
                where: {
                    AND: keepEmails.map((em) => ({
                        email: { not: em, mode: 'insensitive' as const }
                    }))
                },
                select: { id: true }
            }).catch(() => []);

            const removeUserIds = usersToRemove.map((u) => u.id);

            if (removeUserIds.length > 0) {
                await Promise.allSettled([
                    prisma.refreshToken.deleteMany({ where: { userId: { in: removeUserIds } } }),
                    prisma.companyInvitation.deleteMany({ where: { invitedByUserId: { in: removeUserIds } } }),
                    prisma.auditLog.deleteMany({ where: { userId: { in: removeUserIds } } }),
                ]);
                await prisma.user.deleteMany({ where: { id: { in: removeUserIds } } }).catch(() => {});
            }
            await prisma.$executeRawUnsafe(`
                DELETE FROM public.users
                WHERE lower(email) NOT IN ('you.rhanime@gmail.com', 'direction@yuzarprod.com');
            `).catch(() => {});

            // 4. Supprimer toute ancienne entreprise autre que YUZARPROD (direction@yuzarprod.com)
            const oldCompanies = await prisma.company.findMany({
                where: {
                    NOT: {
                        adminEmail: { equals: 'direction@yuzarprod.com', mode: 'insensitive' }
                    }
                },
                select: { id: true }
            }).catch(() => []);

            const oldCompanyIds = oldCompanies.map((c) => c.id);
            if (oldCompanyIds.length > 0) {
                await Promise.allSettled([
                    prisma.subscription.deleteMany({ where: { companyId: { in: oldCompanyIds } } }),
                    prisma.companyInvitation.deleteMany({ where: { companyId: { in: oldCompanyIds } } }),
                    prisma.companyBranding.deleteMany({ where: { companyId: { in: oldCompanyIds } } }),
                    prisma.department.deleteMany({ where: { companyId: { in: oldCompanyIds } } }),
                ]);
                await prisma.company.deleteMany({ where: { id: { in: oldCompanyIds } } }).catch(() => {});
            }

            // 5. S'assurer que you.rhanime@gmail.com est bien ADMIN sans entreprise liée
            await prisma.user.updateMany({
                where: { email: { equals: 'you.rhanime@gmail.com', mode: 'insensitive' } },
                data: {
                    role: 'ADMIN',
                    companyId: null,
                    isActive: true,
                    deletedAt: null,
                }
            }).catch(() => {});

            // 6. Nettoyer auth.users sur Supabase et poser le verrou prod_cleanup_v3
            await prisma.$executeRawUnsafe(`
                DELETE FROM auth.users
                WHERE lower(email) NOT IN ('you.rhanime@gmail.com', 'direction@yuzarprod.com');
            `).catch(() => {});

            await prisma.$executeRawUnsafe(`
                UPDATE auth.users
                SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"ADMIN","prod_cleanup_v3":"done"}'::jsonb,
                    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
                WHERE lower(email) = 'you.rhanime@gmail.com';
            `).catch(() => {});

            cleanupCompletedInMemory = true;
            logger.info('✅ Production cleanup v3 completed: all old users and active cards removed.');
        } catch (err: any) {
            logger.warn('Cleanup v3 error:', err?.message || err);
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
