import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
    const { data: users, error: err } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
        console.log("No users.");
        return;
    }
    const userId = users[0].id;
    console.log("Testing links update for user", userId);

    const { data: cardData } = await supabase.from('cards').select('id, public_slug').eq('user_id', userId).single();
    
    const newLinks = [{ platform: 'test', url: 'https://test.com', id: '123', isActive: true, label: 'test' }];

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
