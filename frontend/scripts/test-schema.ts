import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
    const { data, error } = await supabase.from('cards').select('*').limit(1);
    console.log("Keys in cards table:", data && data.length > 0 ? Object.keys(data[0]) : "No data");
    console.log("Error:", error);
}
run();
