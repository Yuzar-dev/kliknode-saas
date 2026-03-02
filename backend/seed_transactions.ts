import { PrismaClient, TransactionStatus, PaymentMethod, Currency } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Ajout de transactions de test...');

    const tesla = await prisma.company.findFirst({ where: { slug: 'tesla' } });
    if (!tesla) {
        console.log('❌ Entreprise Tesla non trouvée.');
        return;
    }

    const subscription = await prisma.subscription.findUnique({
        where: { companyId: tesla.id }
    });

    if (!subscription) {
        console.log('❌ Aucun abonnement trouvé pour Tesla.');
        return;
    }

    const transactionsData = [
        { amount: 49.00, invoiceNumber: 'INV-2023-001', createdAt: new Date('2023-09-24') },
        { amount: 49.00, invoiceNumber: 'INV-2023-002', createdAt: new Date('2023-08-24') },
        { amount: 49.00, invoiceNumber: 'INV-2023-003', createdAt: new Date('2023-07-24') }
    ];

    for (const data of transactionsData) {
        await prisma.transaction.create({
            data: {
                companyId: tesla.id,
                subscriptionId: subscription.id,
                amount: data.amount,
                currency: Currency.EUR,
                status: TransactionStatus.succeeded,
                paymentMethod: PaymentMethod.stripe,
                invoiceNumber: data.invoiceNumber,
                invoicePdfUrl: 'https://example.com/invoice.pdf',
                processedAt: data.createdAt,
                createdAt: data.createdAt
            }
        });
        console.log(`  - Transaction ajoutée : ${data.amount}€ (${data.invoiceNumber})`);
    }

    console.log('✅ Fin de l\'ajout des transactions.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
