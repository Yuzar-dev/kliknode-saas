import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);
async function run() {
    const { data: rows, error: err2 } = await supabase.from('social_links').select('*').limit(5);
    console.log("social_links table:", err2 ? err2.message : "Exists!");
    if (rows) console.log(`Found ${rows.length} rows in social_links...`);
}
run();
