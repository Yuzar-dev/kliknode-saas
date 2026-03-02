import prisma from './src/config/database';

async function main() {
    try {
        console.log('Listing tables in the current database...');
        const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`;
        console.log('Tables found in "public" schema:', tables);

        // Check if profiles exists in any schema
        const allProfiles = await prisma.$queryRaw`SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE tablename = 'profiles';`;
        console.log('Search for "profiles" table across all schemas:', allProfiles);

    } catch (error) {
        console.error('❌ Error executing SQL:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
