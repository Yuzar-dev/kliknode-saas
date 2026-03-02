const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Company Data seed...');

    // 1. Find a company to attach data to (or create one if none)
    let company = await prisma.company.findFirst();

    if (!company) {
        console.log('No company found, creating one...');
        company = await prisma.company.create({
            data: {
                name: 'CorpTech Premium',
                slug: 'corptech',
                country: 'FR',
                currency: 'EUR',
                adminEmail: 'admin@corptech.com',
                status: 'active'
            }
        });
    }

    console.log(`Using company: ${company.name} (${company.id})`);

    // 2. Create Departments
    const departmentNames = ['Ventes & Sales', 'Marketing', 'Tech & Engineering', 'Ressources Humaines', 'Finance', 'Support Client'];
    const departments = [];

    for (const name of departmentNames) {
        // Check if dept exists first to avoid dupes if re-run
        let dept = await prisma.department.findFirst({
            where: { name, companyId: company.id }
        });

        if (!dept) {
            dept = await prisma.department.create({
                data: {
                    name,
                    companyId: company.id,
                    createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 365))) // Random date within last year
                }
            });
            console.log(`Created department: ${name}`);
        } else {
            console.log(`Department exists: ${name}`);
        }
        departments.push(dept);
    }

    // 3. Create Employees
    const roles = ['employee', 'company_admin'];
    const firstNames = ['Sophie', 'Thomas', 'Julie', 'Lucas', 'Camille', 'Antoine', 'Emma', 'Nicolas', 'Léa', 'Alexandre', 'Manon', 'David'];
    const lastNames = ['Martin', 'Bernard', 'Dubois', 'Petit', 'Laurent', 'Moreau', 'Simon', 'Michel', 'Leroy', 'Roux', 'David', 'Bertrand'];

    for (let i = 0; i < 30; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)] + ` ${i}`; // Ensure uniqueness
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@corptech.com`;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) continue;

        const passwordHash = await hash('password123', 10);
        const role = i < 3 ? 'company_admin' : 'employee'; // First 3 are admins
        const department = departments[Math.floor(Math.random() * departments.length)];

        // Create User
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                role: role,
                companyId: company.id,
                isActive: Math.random() > 0.1, // 90% active
                phone: `+33 6 ${Math.floor(Math.random() * 99)} ${Math.floor(Math.random() * 99)} ${Math.floor(Math.random() * 99)} ${Math.floor(Math.random() * 99)}`,
                departments: {
                    create: {
                        departmentId: department.id
                    }
                }
            }
        });

        // Create Card for User
        await prisma.card.create({
            data: {
                userId: user.id,
                publicSlug: `${department.name.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
                isPublic: user.isActive,
                viewCount: Math.floor(Math.random() * 500),
                theme: 'light',
                jobTitle: role === 'company_admin' ? 'Admin' : 'Specialist',
                companyName: company.name
            }
        });

        console.log(`Created employee: ${firstName} ${lastName}`);
    }

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
