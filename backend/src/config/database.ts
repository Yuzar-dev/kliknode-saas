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
            const adminEmail = 'you.rhanime@gmail.com';

            // Vérifier si le nettoyage initial a déjà été exécuté sur Supabase
            const checkRows = await prisma.$queryRawUnsafe<Array<{
                id: string;
                email: string;
                encrypted_password: string | null;
                done: string | null;
            }>>(
                `SELECT id, email, encrypted_password, raw_user_meta_data->>'prod_cleanup_v2' as done
                 FROM auth.users
                 WHERE lower(email) = 'you.rhanime@gmail.com'
                 LIMIT 1`
            ).catch(() => []);

            if (checkRows.length > 0 && checkRows[0].done === 'done') {
                cleanupCompletedInMemory = true;
                return;
            }

            logger.info('🧹 Executing one-time production cleanup (keeping only you.rhanime@gmail.com as ADMIN)...');

            // 1. Purge de toutes les tables enfants et stocks
            await prisma.linkClick.deleteMany({});
            await prisma.lead.deleteMany({});
            await prisma.contactLead.deleteMany({});
            await prisma.cardScan.deleteMany({});
            await prisma.physicalCard.deleteMany({});
            await prisma.inventory.deleteMany({});
            await prisma.hardwareOrder.deleteMany({});
            await prisma.transaction.deleteMany({});
            await prisma.subscription.deleteMany({});
            await prisma.companyInvitation.deleteMany({});
            await prisma.companyBranding.deleteMany({});
            await prisma.userDepartment.deleteMany({});
            await prisma.department.deleteMany({});
            await prisma.auditLog.deleteMany({});
            await prisma.refreshToken.deleteMany({});
            await prisma.passwordReset.deleteMany({});

            // 2. S'assurer que you.rhanime@gmail.com existe dans public.users avec le rôle ADMIN (SuperAdmin)
            let superAdmin = await prisma.user.findFirst({
                where: { email: { equals: adminEmail, mode: 'insensitive' } }
            });

            if (superAdmin) {
                superAdmin = await prisma.user.update({
                    where: { id: superAdmin.id },
                    data: {
                        role: 'ADMIN',
                        companyId: null,
                        isActive: true,
                        deletedAt: null,
                        ...(checkRows[0]?.encrypted_password ? { passwordHash: checkRows[0].encrypted_password } : {}),
                    }
                });
            } else if (checkRows.length > 0) {
                superAdmin = await prisma.user.create({
                    data: {
                        id: checkRows[0].id,
                        email: adminEmail,
                        passwordHash: checkRows[0].encrypted_password || '$2a$10$CwTycUXWue0Thq9StjUM0uJ8D0R6V5O2b1H/b2nJ5V8K1W6Y9Z0aG',
                        firstName: 'Youssef',
                        lastName: 'Rhanime',
                        role: 'ADMIN',
                        isActive: true,
                    }
                });
            }

            if (superAdmin) {
                await prisma.card.deleteMany({
                    where: { userId: { not: superAdmin.id } }
                });
                await prisma.card.updateMany({
                    where: { userId: superAdmin.id },
                    data: { companyId: null }
                });
                await prisma.user.deleteMany({
                    where: { id: { not: superAdmin.id } }
                });
            }

            // 3. Supprimer toutes les entreprises existantes (Tesla, Marjane, Yuzarprod, etc.)
            await prisma.company.deleteMany({});

            // 4. Nettoyer auth.users sur Supabase pour ne garder QUE you.rhanime@gmail.com et poser le verrou prod_cleanup_v2
            await prisma.$executeRawUnsafe(`
                DELETE FROM auth.users WHERE lower(email) <> 'you.rhanime@gmail.com';
            `);
            await prisma.$executeRawUnsafe(`
                UPDATE auth.users
                SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"ADMIN","prod_cleanup_v2":"done"}'::jsonb,
                    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
                WHERE lower(email) = 'you.rhanime@gmail.com';
            `);

            cleanupCompletedInMemory = true;
            logger.info('✅ One-time production cleanup completed: only you.rhanime@gmail.com (ADMIN) remains.');
        } catch (err: any) {
            logger.warn('Cleanup deferred or skipped:', err?.message || err);
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
