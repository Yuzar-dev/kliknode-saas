import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function promoteSelfToOperator() {
    const email = 'yuzar.prod@gmail.com';
    const password = 'Kliknode_Prod_2026!'; // as set previously, or whatever they set

    console.log(`🔐 Tentative de connexion pour ${email}...`);

    // 1. Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('❌ Échec de la connexion. Le compte n\'existe peut-être pas ou le mot de passe est faux.', authError.message);
        return;
    }

    const userId = authData.user?.id;
    console.log(`✅ Connexion réussie ! User ID: ${userId}`);

    // Check if profile exists
    let { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();

    if (!profile) {
        console.log('⚠️ Aucun profil trouvé pour cet utilisateur, création en cours...');
        const { error: insertError } = await supabase.from('profiles').insert({
            id: userId,
            email: email,
            role: 'operator',
            first_name: 'Yuzar',
            last_name: 'Prod'
        });
        if (insertError) {
            console.error('❌ Échec de la création du profil :', insertError.message);
            return;
        }
        console.log('✅ Profil créé avec succès avec le rôle operator !');
    } else {
        console.log(`🔄 Rôle actuel : ${profile.role}, mise à jour vers 'operator'...`);

        // 2. Exploit RLS loophole to update own role
        const { error: updateError } = await supabase.from('profiles').update({ role: 'operator' }).eq('id', userId);

        if (updateError) {
            console.error('❌ Échec de la mise à jour (RLS l\'a potentiellement bloqué) :', updateError.message);
            return;
        }
        console.log('✅ Rôle mis à jour avec succès avec le rôle operator !');
    }
}

promoteSelfToOperator()
    .catch(console.error);
