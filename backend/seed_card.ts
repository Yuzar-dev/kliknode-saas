import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding public profile test data...');

    // 1. Trouver l'utilisateur admin@vcard.io
    let user = await prisma.user.findUnique({
        where: { email: 'admin@vcard.io' }
    });

    if (!user) {
        console.log('Utilisateur admin@vcard.io non trouvé, arrêt du seed.');
        return;
    }

    // Associer l'utilisateur à Tesla s'il ne l'est pas
    const tesla = await prisma.company.findUnique({ where: { slug: 'tesla' } });
    if (tesla && !user.companyId) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: { companyId: tesla.id }
        });
    }

    // 2. Créer une carte pour cet utilisateur
    const card = await prisma.card.upsert({
        where: { userId: user.id },
        update: {
            publicSlug: 'alex-morgan',
            firstName: 'Alex',
            lastName: 'Morgan',
            jobTitle: 'Senior Product Designer',
            companyName: 'TechFlow',
            bio: 'Expert en design de produits SaaS. Passionné par l\'expérience utilisateur et les interfaces modernes.',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop',
            coverUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop',
            phoneMobile: '+33 6 12 34 56 78',
            email: 'alex@techflow.com',
            website: 'https://alexmorgan.design',
            city: 'Paris',
            country: 'France',
            isPublic: true,
            theme: 'light',
            primaryColor: '#2463eb'
        },
        create: {
            userId: user.id,
            publicSlug: 'alex-morgan',
            firstName: 'Alex',
            lastName: 'Morgan',
            jobTitle: 'Senior Product Designer',
            companyName: 'TechFlow',
            bio: 'Expert en design de produits SaaS. Passionné par l\'expérience utilisateur et les interfaces modernes.',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop',
            coverUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop',
            phoneMobile: '+33 6 12 34 56 78',
            email: 'alex@techflow.com',
            website: 'https://alexmorgan.design',
            city: 'Paris',
            country: 'France',
            isPublic: true,
            theme: 'light',
            primaryColor: '#2463eb'
        }
    });

    // 3. Ajouter des liens sociaux
    await prisma.socialLink.deleteMany({ where: { cardId: card.id } });

    const socialLinks = [
        { platform: 'LinkedIn', url: 'https://linkedin.com/in/alexmorgan', label: 'LinkedIn', icon: 'work', order: 1 },
        { platform: 'GitHub', url: 'https://github.com/alexmorgan', label: 'GitHub', icon: 'code', order: 2 },
        { platform: 'Twitter', url: 'https://twitter.com/alexmorgan', label: 'X', icon: 'alternate_email', order: 3 },
        { platform: 'Website', url: 'https://alexmorgan.design', label: 'Portfolio', icon: 'language', order: 4 }
    ];

    for (const link of socialLinks) {
        await prisma.socialLink.create({
            data: {
                cardId: card.id,
                ...link
            }
        });
    }

    console.log('✅ Seed terminé !');
    console.log('Carte disponible sur : http://localhost:3001/p/alex-morgan');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
