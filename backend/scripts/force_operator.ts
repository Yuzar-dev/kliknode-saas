import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function promoteOperator() {
    const email = 'yuzar.prod@gmail.com';
    console.log(`📡 Connexion à la base de données...`);

    const authUser: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM auth.users WHERE email = '${email}'`);

    if (authUser.length > 0) {
        console.log(`✅ Utilisateur trouvé dans auth.users: ${authUser[0].id}`);

        const profile: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM public.profiles WHERE email = '${email}'`);

        if (profile.length > 0) {
            console.log(`🔄 Mise à jour du rôle dans public.profiles...`);
            await prisma.$executeRawUnsafe(`UPDATE public.profiles SET role = 'operator' WHERE email = '${email}'`);
        } else {
            console.log(`➕ Création du profil manquant...`);
            await prisma.$executeRawUnsafe(`
              INSERT INTO public.profiles (id, email, first_name, last_name, role)
              VALUES ('${authUser[0].id}', '${email}', 'Yuzar', 'Prod', 'operator')
          `);
        }

        await prisma.$executeRawUnsafe(`UPDATE public.users SET role = 'operator' WHERE email = '${email}'`);
        console.log(`✅ SUPER_ADMIN/OPERATOR créé avec succès pour ${email} !`);
    } else {
        console.log(`❌ L'utilisateur n'existe pas dans Supabase Auth. Tu dois d'abord créer un compte sur /signup`);
    }
}

promoteOperator().catch(console.error).finally(() => prisma.$disconnect());
