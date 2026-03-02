import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚨 DÉMARRAGE DU NETTOYAGE COMPLET DE LA BASE DE DONNÉES (WIPE V1) 🚨');

    const modelsToWipe = [
        { name: "Audit Logs", action: () => prisma.auditLog.deleteMany() },
        { name: "Scans de Cartes", action: () => prisma.cardScan.deleteMany() },
        { name: "Liens Sociaux", action: () => prisma.socialLink.deleteMany() },
        { name: "Leads Contacts", action: () => prisma.contactLead.deleteMany() },
        { name: "Cartes Physiques", action: () => prisma.physicalCard.deleteMany() },
        { name: "Cartes Virtuelles", action: () => prisma.card.deleteMany() },
        { name: "Commandes Matériel", action: () => prisma.hardwareOrder.deleteMany() },
        { name: "Inventaire", action: () => prisma.inventory.deleteMany() },
        { name: "Transactions", action: () => prisma.transaction.deleteMany() },
        { name: "Abonnements", action: () => prisma.subscription.deleteMany() },
        { name: "Invitations Entreprises", action: () => prisma.companyInvitation.deleteMany() },
        { name: "Liaisons Départements", action: () => prisma.userDepartment.deleteMany() },
        { name: "Départements", action: () => prisma.department.deleteMany() },
        { name: "Brandings", action: () => prisma.companyBranding.deleteMany() },
        { name: "Refresh Tokens", action: () => prisma.refreshToken.deleteMany() },
        { name: "Utilisateurs", action: () => prisma.user.deleteMany() },
        { name: "Entreprises", action: () => prisma.company.deleteMany() },
    ];

    for (let i = 0; i < modelsToWipe.length; i++) {
        const step = modelsToWipe[i];
        console.log(`🧹 ${i + 1}/${modelsToWipe.length} Suppression des ${step.name}...`);
        try {
            await step.action();
        } catch (error: any) {
            console.log(`⚠️ Impossible de supprimer ${step.name} (peut-être la table n'existe pas en DB). Passage à la suite.`);
        }
    }

    console.log('✅ Base de données purgée avec succès !');

    // 2. Création de l'opérateur officiel
    console.log('---');
    console.log('👑 CRÉATION DU COMPTE SUPER_ADMIN OPÉRATEUR 👑');

    const adminEmail = 'yuzar.prod@gmail.com';
    const tempPassword = 'Kliknode_Prod_2026!'; // Mot de passe fort provisoire
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const operator = await prisma.user.create({
        data: {
            email: adminEmail,
            passwordHash: passwordHash,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'super_admin',
            isActive: true,
        },
    });

    console.log(`✅ Compte opérateur créé (ID: ${operator.id})`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔐 Mot de passe provisoire: ${tempPassword}`);
    console.log('---');
    console.log('🚨 ACTION REQUISE : SUPPRESSION MANUELLE SUR SUPABASE 🚨');
    console.log('Veuillez maintenant vous connecter à votre Dashboard Supabase.');
    console.log('Allez dans Authentication -> Users, et supprimez TOUS les utilisateurs restants.');
}

main()
    .catch((e) => {
        console.error('Erreur lors du nettoyage :', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
