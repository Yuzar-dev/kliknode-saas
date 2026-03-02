import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Ajout des départements de test...');

    const companies = await prisma.company.findMany();

    for (const company of companies) {
        console.log(`Traitement de l'entreprise : ${company.name}`);

        const depts = [
            'Direction Générale',
            'Ventes & Marketing',
            'Tech & Innovation',
            'Ressources Humaines',
            'Finance'
        ];

        for (const deptName of depts) {
            const dept = await prisma.department.create({
                data: {
                    name: deptName,
                    companyId: company.id
                }
            });
            console.log(`  - Département créé : ${dept.name}`);
        }

        // Assigner les utilisateurs existants à des départements au hasard
        const users = await prisma.user.findMany({
            where: { companyId: company.id }
        });

        const createdDepts = await prisma.department.findMany({
            where: { companyId: company.id }
        });

        for (const user of users) {
            const randomDept = createdDepts[Math.floor(Math.random() * createdDepts.length)];
            await prisma.userDepartment.create({
                data: {
                    userId: user.id,
                    departmentId: randomDept.id
                }
            });
            console.log(`  - Utilisateur ${user.email} assigné à ${randomDept.name}`);
        }
    }

    console.log('✅ Fin de l\'ajout des départements.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
