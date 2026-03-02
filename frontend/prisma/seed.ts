import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/utils/bcrypt.util';
import { generateSlug } from '../server/utils/slug.util';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Nettoyer la base (seulement en dev !)
    if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Cleaning database...');
        await prisma.auditLog.deleteMany();
        await prisma.refreshToken.deleteMany();
        await prisma.passwordReset.deleteMany();
        await prisma.companyInvitation.deleteMany();
        await prisma.contactLead.deleteMany();
        await prisma.cardScan.deleteMany();
        await prisma.socialLink.deleteMany();
        await prisma.physicalCard.deleteMany();
        await prisma.card.deleteMany();
        await prisma.userDepartment.deleteMany();
        await prisma.department.deleteMany();
        await prisma.hardwareOrder.deleteMany();
        await prisma.inventory.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.subscription.deleteMany();
        await prisma.companyBranding.deleteMany();
        await prisma.user.deleteMany();
        await prisma.company.deleteMany();
        await prisma.subscriptionPlan.deleteMany();
        await prisma.promoCode.deleteMany();
        console.log('✅ Database cleaned\n');
    }

    // ========================================
    // 1. CRÉER LES PLANS D'ABONNEMENT
    // ========================================
    console.log('📋 Creating subscription plans...');

    await prisma.subscriptionPlan.create({
        data: {
            name: 'Free',
            slug: 'free',
            priceEur: 0,
            priceMad: 0,
            billingPeriod: 'monthly',
            maxLicenses: 1,
            features: {
                cards: 1,
                custom_branding: false,
                analytics: false,
                api_access: false,
            },
            isActive: true,
        },
    });

    const planPro = await prisma.subscriptionPlan.create({
        data: {
            name: 'Pro Monthly',
            slug: 'pro-monthly',
            priceEur: 29.99,
            priceMad: 299,
            billingPeriod: 'monthly',
            maxLicenses: 50,
            features: {
                cards: 50,
                custom_branding: true,
                analytics: true,
                api_access: false,
            },
            isActive: true,
            stripePriceIdEur: 'price_test_pro_eur',
        },
    });

    const planBusiness = await prisma.subscriptionPlan.create({
        data: {
            name: 'Business Corp',
            slug: 'business-corp',
            priceEur: 99.99,
            priceMad: 999,
            billingPeriod: 'monthly',
            maxLicenses: -1, // illimité
            features: {
                cards: -1,
                custom_branding: true,
                analytics: true,
                api_access: true,
                priority_support: true,
            },
            isActive: true,
            stripePriceIdEur: 'price_test_business_eur',
        },
    });

    console.log(`✅ Created ${3} subscription plans\n`);

    // ========================================
    // 2. CRÉER CODES PROMO
    // ========================================
    console.log('🎫 Creating promo codes...');

    await prisma.promoCode.create({
        data: {
            code: 'WELCOME20',
            discountPercent: 20,
            maxUses: 100,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours
            isActive: true,
        },
    });

    await prisma.promoCode.create({
        data: {
            code: 'LAUNCH50',
            discountPercent: 50,
            maxUses: 50,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            isActive: true,
        },
    });

    console.log(`✅ Created ${2} promo codes\n`);

    // ========================================
    // 3. CRÉER SUPER ADMIN
    // ========================================
    console.log('👑 Creating super admin...');

    const adminPassword = await hashPassword('Admin123!');
    const superAdmin = await prisma.user.create({
        data: {
            email: 'admin@vcard.io',
            passwordHash: adminPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'super_admin',
            isActive: true,
            language: 'fr',
            emailVerifiedAt: new Date(),
        },
    });

    console.log(`✅ Super admin created: ${superAdmin.email}\n`);

    // ========================================
    // 4. CRÉER ENTREPRISES
    // ========================================
    console.log('🏢 Creating companies...');

    // Entreprise 1 : Tesla (France)
    const companyTesla = await prisma.company.create({
        data: {
            name: 'Tesla France',
            slug: 'tesla',
            siret: '12345678901234',
            country: 'FR',
            currency: 'EUR',
            domain: '@tesla.com',
            address: '123 Avenue des Champs-Élysées',
            city: 'Paris',
            postalCode: '75008',
            phone: '+33 1 23 45 67 89',
            adminEmail: 'admin@tesla.com',
            status: 'active',
        },
    });

    // Entreprise 2 : Marjane (Maroc)
    const companyMarjane = await prisma.company.create({
        data: {
            name: 'Marjane Holding',
            slug: 'marjane',
            ice: 'MA001234567',
            country: 'MA',
            currency: 'MAD',
            domain: '@marjane.ma',
            address: 'Boulevard Zerktouni',
            city: 'Casablanca',
            postalCode: '20000',
            phone: '+212 5 22 12 34 56',
            adminEmail: 'admin@marjane.ma',
            status: 'active',
        },
    });

    console.log(`✅ Created ${2} companies\n`);

    // ========================================
    // 5. CRÉER SUBSCRIPTIONS
    // ========================================
    console.log('💳 Creating subscriptions...');

    await prisma.subscription.create({
        data: {
            companyId: companyTesla.id,
            planId: planBusiness.id,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentMethod: 'stripe',
            stripeSubscriptionId: 'sub_test_tesla_123',
        },
    });

    await prisma.subscription.create({
        data: {
            companyId: companyMarjane.id,
            planId: planPro.id,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentMethod: 'manual_transfer',
        },
    });

    console.log(`✅ Created ${2} subscriptions\n`);

    // ========================================
    // 6. CRÉER UTILISATEURS ET CARTES
    // ========================================
    console.log('👥 Creating users and cards...');

    const defaultPassword = await hashPassword('User123!');

    // Admin Tesla
    const teslaAdmin = await prisma.user.create({
        data: {
            email: 'elon@tesla.com',
            passwordHash: defaultPassword,
            firstName: 'Elon',
            lastName: 'Musk',
            role: 'company_admin',
            companyId: companyTesla.id,
            isActive: true,
            emailVerifiedAt: new Date(),
        },
    });

    await prisma.card.create({
        data: {
            userId: teslaAdmin.id,
            publicSlug: generateSlug('elon-musk-tesla'),
            firstName: 'Elon',
            lastName: 'Musk',
            jobTitle: 'CEO',
            companyName: 'Tesla France',
            email: 'elon@tesla.com',
            phoneMobile: '+33 6 12 34 56 78',
            theme: 'dark',
            primaryColor: '#E82127',
        },
    });

    // Employés Tesla
    const teslaEmployees = [
        { firstName: 'Marie', lastName: 'Curie', jobTitle: 'Chief Technology Officer' },
        { firstName: 'Pierre', lastName: 'Dupont', jobTitle: 'Sales Director' },
        { firstName: 'Sophie', lastName: 'Martin', jobTitle: 'Marketing Manager' },
    ];

    for (const emp of teslaEmployees) {
        const user = await prisma.user.create({
            data: {
                email: `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@tesla.com`,
                passwordHash: defaultPassword,
                firstName: emp.firstName,
                lastName: emp.lastName,
                role: 'employee',
                companyId: companyTesla.id,
                isActive: true,
                emailVerifiedAt: new Date(),
            },
        });

        await prisma.card.create({
            data: {
                userId: user.id,
                publicSlug: generateSlug(`${emp.firstName}-${emp.lastName}-tesla`),
                firstName: emp.firstName,
                lastName: emp.lastName,
                jobTitle: emp.jobTitle,
                companyName: 'Tesla France',
                email: user.email,
                theme: 'light',
            },
        });
    }

    // Admin Marjane
    const marjaneAdmin = await prisma.user.create({
        data: {
            email: 'admin@marjane.ma',
            passwordHash: defaultPassword,
            firstName: 'Ahmed',
            lastName: 'Benali',
            role: 'company_admin',
            companyId: companyMarjane.id,
            isActive: true,
            emailVerifiedAt: new Date(),
        },
    });

    await prisma.card.create({
        data: {
            userId: marjaneAdmin.id,
            publicSlug: generateSlug('ahmed-benali-marjane'),
            firstName: 'Ahmed',
            lastName: 'Benali',
            jobTitle: 'Directeur Général',
            companyName: 'Marjane Holding',
            email: 'admin@marjane.ma',
            phoneMobile: '+212 6 12 34 56 78',
            theme: 'light',
            primaryColor: '#00A651',
        },
    });

    console.log(`✅ Created ${6} users with cards\n`);

    // ========================================
    // 7. CRÉER INVENTORY
    // ========================================
    console.log('📦 Creating inventory...');

    await prisma.inventory.create({
        data: {
            sku: 'NFC-CARD-PREMIUM',
            warehouse: 'paris',
            quantityPhysical: 100,
            quantityReserved: 10,
            quantityAvailable: 90,
            lastAdjustmentAt: new Date(),
        },
    });

    await prisma.inventory.create({
        data: {
            sku: 'NFC-CARD-PREMIUM',
            warehouse: 'oujda',
            quantityPhysical: 50,
            quantityReserved: 5,
            quantityAvailable: 45,
            lastAdjustmentAt: new Date(),
        },
    });

    console.log(`✅ Created ${2} inventory entries\n`);

    // ========================================
    // 8. CRÉER UN OPÉRATEUR
    // ========================================
    console.log('📦 Creating operator...');

    const operatorPassword = await hashPassword('Operator123!');
    await prisma.user.create({
        data: {
            email: 'operator.paris@vcard.io',
            passwordHash: operatorPassword,
            firstName: 'Jean',
            lastName: 'Logistique',
            role: 'operator',
            isActive: true,
            emailVerifiedAt: new Date(),
        },
    });

    console.log(`✅ Created ${1} operator\n`);

    console.log('🎉 Seed completed successfully!\n');
    console.log('📝 CREDENTIALS:');
    console.log('   Super Admin:  admin@vcard.io / Admin123!');
    console.log('   Tesla Admin:  elon@tesla.com / User123!');
    console.log('   Marjane Admin: admin@marjane.ma / User123!');
    console.log('   Operator:     operator.paris@vcard.io / Operator123!\n');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
