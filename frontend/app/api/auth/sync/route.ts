import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=true')) {
    dbUrl = dbUrl.includes('?') ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true`;
}

const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-please-change-in-production-12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-please-change-in-production-67890';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[AUTH SYNC] Supabase User error', authError);
            return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
        }

        // Get user from DB to get the correct role and companyId
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser) {
            console.error('[AUTH SYNC] User not found in db', user.id);
            return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const payload = {
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role.toUpperCase(),
            companyId: dbUser.companyId || undefined,
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: dbUser.id,
                    email: dbUser.email,
                    firstName: dbUser.firstName,
                    lastName: dbUser.lastName,
                    role: dbUser.role.toUpperCase(),
                    companyId: dbUser.companyId,
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
    } catch (error) {
        console.error('[AUTH SYNC] Internal Server Error:', error);
        return NextResponse.json({ success: false, message: 'Erreur interne' }, { status: 500 });
    }
}
