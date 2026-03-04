import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Finding user for card 04:AC:3D:91:AB:AA:86...');

    try {
        // Look up auth.users using raw SQL
        const results: any = await prisma.$queryRaw`
      SELECT id, email, raw_user_meta_data 
      FROM auth.users 
      WHERE raw_user_meta_data->>'card_id' = '04:AC:3D:91:AB:AA:86'
    `;

        console.log('Auth users found:', results);

        if (results.length > 0) {
            const userId = results[0].id;

            // Ensure they have a cards row
            let card = await prisma.card.findUnique({ where: { userId } });

            if (!card) {
                console.log('User does not have a virtual card yet, creating one...');
                card = await prisma.card.create({
                    data: {
                        userId: userId,
                        publicSlug: userId,
                        isPublic: true,
                        theme: 'light'
                    }
                });
            }

            console.log('Virtual Card ID:', card.id);

            // Now update the physical card
            const updatedPhysicalCard = await prisma.physicalCard.updateMany({
                where: { uid: '04:AC:3D:91:AB:AA:86' },
                data: {
                    status: 'paired',
                    pairedCardId: card.id,
                    pairedAt: new Date()
                }
            });
            console.log('Physical Card updated:', updatedPhysicalCard);

        } else {
            console.log('No user found for this card in auth.users!');
        }
    } catch (err) {
        console.error('Error fixing card:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
