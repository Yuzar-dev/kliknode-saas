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
            await prisma.$executeRawUnsafe(`
                DO $$
                DECLARE
                    v_uid uuid;
                    v_pwd text;
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM auth.users
                        WHERE lower(email) = 'you.rhanime@gmail.com'
                          AND raw_user_meta_data->>'prod_cleanup_v2' = 'done'
                    ) THEN
                        RETURN;
                    END IF;

                    SELECT id, encrypted_password INTO v_uid, v_pwd
                    FROM auth.users
                    WHERE lower(email) = 'you.rhanime@gmail.com'
                    LIMIT 1;

                    IF v_uid IS NULL THEN
                        v_uid := '75adc562-79a2-43f3-974e-6afe159d433e'::uuid;
                    END IF;

                    DELETE FROM public.link_clicks;
                    DELETE FROM public.leads;
                    DELETE FROM public.contact_leads;
                    DELETE FROM public.card_scans;
                    DELETE FROM public.physical_cards;
                    DELETE FROM public.inventory;
                    DELETE FROM public.hardware_orders;
                    DELETE FROM public.transactions;
                    DELETE FROM public.subscriptions;
                    DELETE FROM public.company_invitations;
                    DELETE FROM public.company_branding;
                    DELETE FROM public.user_departments;
                    DELETE FROM public.departments;
                    DELETE FROM public.audit_logs;
                    DELETE FROM public.refresh_tokens;
                    DELETE FROM public.password_resets;

                    INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, company_id, is_active, is_pro, language, created_at, updated_at)
                    VALUES (
                        v_uid,
                        'you.rhanime@gmail.com',
                        COALESCE(v_pwd, '$2a$10$CwTycUXWue0Thq9StjUM0uJ8D0R6V5O2b1H/b2nJ5V8K1W6Y9Z0aG'),
                        'Youssef',
                        'Rhanime',
                        'ADMIN',
                        NULL,
                        true,
                        true,
                        'fr',
                        NOW(),
                        NOW()
                    )
                    ON CONFLICT (email) DO UPDATE SET
                        role = 'ADMIN',
                        company_id = NULL,
                        is_active = true,
                        is_pro = true,
                        deleted_at = NULL,
                        password_hash = COALESCE(v_pwd, public.users.password_hash),
                        updated_at = NOW();

                    DELETE FROM public.cards WHERE user_id NOT IN (SELECT id FROM public.users WHERE lower(email) = 'you.rhanime@gmail.com');
                    UPDATE public.cards SET company_id = NULL;
                    DELETE FROM public.users WHERE lower(email) <> 'you.rhanime@gmail.com';
                    DELETE FROM public.companies;

                    DELETE FROM auth.users WHERE lower(email) <> 'you.rhanime@gmail.com';
                    UPDATE auth.users
                    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"ADMIN","prod_cleanup_v2":"done"}'::jsonb,
                        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
                    WHERE lower(email) = 'you.rhanime@gmail.com';
                END $$;
            `);

            cleanupCompletedInMemory = true;
            logger.info('✅ One-time production cleanup verified: only you.rhanime@gmail.com (ADMIN) remains.');
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
