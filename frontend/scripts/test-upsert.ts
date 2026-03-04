import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
    // get a user
    const { data: users, error: err } = await supabase.from('users').select('id').limit(1);
    const userId = users[0].id;
    console.log("Testing links update for user", userId);

    const { data: cardData } = await supabase.from('cards').select('id, public_slug').eq('user_id', userId).single();
    console.log("Card data:", cardData);

    const { error } = await supabase
        .from('cards')
        .upsert({
            id: cardData?.id || uuidv4(),
            user_id: userId,
            social_links: [{ platform: 'test', url: 'test', id: '123', isActive: true, label: 'test' }],
            public_slug: cardData?.public_slug || userId,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    console.log("Upsert Error:", error);

    const { error: error2 } = await supabase
        .from('cards')
        .update({
            social_links: [{ platform: 'test', url: 'test', id: '123', isActive: true, label: 'test' }],
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    console.log("Update Error:", error2);
}
run();
