import { PrismaClient, ContactSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Ajout de leads de test...');

    const tesla = await prisma.company.findFirst({ where: { slug: 'tesla' } });
    if (!tesla) {
        console.log('❌ Entreprise Tesla non trouvée.');
        return;
    }

    const employees = await prisma.user.findMany({
        where: { companyId: tesla.id, role: 'employee' }
    });

    if (employees.length === 0) {
        console.log('❌ Aucun employé trouvé pour Tesla.');
        return;
    }

    const cards = await prisma.card.findMany({
        where: { userId: { in: employees.map(e => e.id) } }
    });

    const leadsData = [
        { firstName: 'Sarah', lastName: 'Connor', email: 'sarah@cyberdyne.com', phone: '+33 6 12 34 56 78', companyName: 'Cyberdyne Systems' },
        { firstName: 'John', lastName: 'Matrix', email: 'john.m@commando.mil', phone: '+33 7 89 01 23 45', companyName: 'Commando Unit' },
        { firstName: 'Ellen', lastName: 'Ripley', email: 'ripley@weyland.corp', phone: '+33 6 45 67 89 01', companyName: 'Weyland-Yutani' },
        { firstName: 'Rick', lastName: 'Blaine', email: 'rick@casablanca.net', phone: '+33 1 23 45 67 89', companyName: 'Café Américain' },
        { firstName: 'Tony', lastName: 'Stark', email: 'tony@stark.com', phone: '+1 212 555 1234', companyName: 'Stark Industries' }
    ];

    for (let i = 0; i < leadsData.length; i++) {
        const lead = leadsData[i];
        const randomCard = cards[Math.floor(Math.random() * cards.length)];

        if (!randomCard) continue;

        await prisma.contactLead.create({
            data: {
                ...lead,
                companyId: tesla.id,
                userId: randomCard.userId,
                cardId: randomCard.id,
                source: ContactSource.qr_scan
            }
        });
        console.log(`  - Lead ajouté : ${lead.firstName} ${lead.lastName} (par ${randomCard.firstName})`);
    }

    console.log('✅ Fin de l\'ajout des leads.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
