const { PrismaClient } = require('@prisma/client');

const supabaseUrl = "postgresql://postgres.hpyclqmbzqhlbqrkxdsm:yt4em4N7EY.!L*&@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: supabaseUrl,
        },
    },
});

async function main() {
    try {
        console.log('Listing tables in the Supabase public schema...');
        const tables = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`);
        console.log('Tables found:', tables);

        console.log('Attempting to add bio_visible column...');
        await prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_visible BOOLEAN DEFAULT true;`);
        console.log('✅ Successfully updated profiles table.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
