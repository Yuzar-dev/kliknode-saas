const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Listing ALL cards (public.cards):');
        const cards = await prisma.$queryRawUnsafe(`SELECT * FROM public.cards`);
        console.log(JSON.stringify(cards, null, 2));

        console.log('Listing ALL physical_cards (public.physical_cards):');
        const pCards = await prisma.$queryRawUnsafe(`SELECT * FROM public.physical_cards`);
        console.log(JSON.stringify(pCards, null, 2));

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
