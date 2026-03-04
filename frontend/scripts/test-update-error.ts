import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: users, error: err } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
        console.log("No users.", err);
        return;
    }
    const userId = users[0].id;
    console.log("Testing links update for user", userId);

    const { data: cardData } = await supabase.from('cards').select('*').eq('user_id', userId).single();
    console.log("Card found:", cardData?.id);

    if (!cardData) return;

    const newLinks = cardData.social_links || [];

    const { error } = await supabase
        .from('cards')
        .update({
            social_links: newLinks,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    console.log("Update Error:", error);
}
run();
