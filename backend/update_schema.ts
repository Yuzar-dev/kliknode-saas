import prisma from './src/config/database';

async function main() {
    try {
        console.log('Attempting to update Supabase schema via Prisma...');
        // Utilisation de $executeRawUnsafe pour exécuter la commande SQL brute
        await prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_visible BOOLEAN DEFAULT true;`);
        console.log('✅ Successfully added bio_visible column to profiles table.');
    } catch (error) {
        console.error('❌ Error executing SQL:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
