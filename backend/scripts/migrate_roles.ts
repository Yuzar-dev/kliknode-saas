import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting custom schema migration...');

    try {
        // 1. Rename old enum
        await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" RENAME TO "UserRole_old";`);

        // 2. Create new enum
        await prisma.$executeRawUnsafe(`CREATE TYPE "UserRole" AS ENUM ('USER', 'EMPLOYEE', 'MANAGER', 'OPERATOR', 'ADMIN');`);

        // 3. Update the column with cast
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" TYPE "UserRole" USING (
        CASE role::text
          WHEN 'super_admin' THEN 'ADMIN'::"UserRole"
          WHEN 'company_admin' THEN 'MANAGER'::"UserRole"
          WHEN 'operator' THEN 'OPERATOR'::"UserRole"
          WHEN 'employee' THEN 'USER'::"UserRole"
          ELSE 'USER'::"UserRole"
        END
      );
    `);

        // 4. Drop old enum
        await prisma.$executeRawUnsafe(`DROP TYPE "UserRole_old";`);

        console.log('UserRole Enum successfully migrated!');

        // 5. Add company_id to cards if not exists
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "company_id" TEXT;
    `);

        // Create foreign key and index
        await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "cards_company_id_idx" ON "cards"("company_id");
    `);

        console.log('company_id successfully added to cards!');

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
