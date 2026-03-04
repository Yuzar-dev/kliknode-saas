import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);
async function run() {
    const { data: cols, error: err } = await supabase.rpc('get_tables', {});
    // Wait, rpc might not exist. Let's just create a raw query if needed, or query information_schema if enabled, but standard REST can't.
    // Instead, let's just query an expected 'social_links' table.
    const { error: err2 } = await supabase.from('social_links').select('*').limit(1);
    console.log("social_links table:", err2 ? err2.message : "Exists!");
}
run();
