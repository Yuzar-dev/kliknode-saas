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
    const userId = users[0].id;

    const newLinks = [{ platform: 'test', url: 'https://test.com', id: '123', isActive: true, label: 'test' }];

    const payload = {
        id: uuidv4(),
        user_id: userId,
        public_slug: userId,
        social_links: newLinks,
        updated_at: new Date().toISOString()
    };

    console.log("Testing insert. Payload:", payload);
    const { error: insertError } = await supabase.from('cards').insert(payload);

    console.log("Insert Error:", insertError);
}
run();
