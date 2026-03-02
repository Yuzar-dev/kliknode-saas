import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSTIC DE LA BASE DE DONNÉES ---');

    const companyCount = await prisma.company.count();
    console.log(`Nombre d'entreprises : ${companyCount}`);

    const companies = await prisma.company.findMany({
        select: { id: true, name: true, slug: true }
    });
    console.log('Entreprises :', JSON.stringify(companies, null, 2));

    const userCount = await prisma.user.count();
    console.log(`Nombre d'utilisateurs : ${userCount}`);

    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, companyId: true },
        take: 10
    });
    console.log('10 premiers utilisateurs :', JSON.stringify(users, null, 2));

    const departmentCount = await prisma.department.count();
    console.log(`Nombre de départements : ${departmentCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
