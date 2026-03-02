const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:yt4em4N7EY.!L*&@db.hpyclqmbzqhlbqrkxdsm.supabase.co:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Supabase');

        // Add READY value
        try {
            await client.query("ALTER TYPE card_status ADD VALUE 'READY' AFTER 'UNASSIGNED';");
            console.log('Added READY to card_status');
        } catch (e) {
            console.log('READY might already exist or error:', e.message);
        }

        // Add ENCODED value
        try {
            await client.query("ALTER TYPE card_status ADD VALUE 'ENCODED' AFTER 'READY';");
            console.log('Added ENCODED to card_status');
        } catch (e) {
            console.log('ENCODED might already exist or error:', e.message);
        }

        // Update default status for the table
        await client.query("ALTER TABLE public.cards ALTER COLUMN status SET DEFAULT 'READY';");
        console.log('Updated default status to READY');

        // Fix RLS Policies for cards
        console.log('Updating RLS policies...');

        // Drop old update policy if exists (Supabase might have it named slightly differently, but we'll try the common name)
        try {
            await client.query('DROP POLICY IF EXISTS "Users can update their assigned cards or unassigned cards during activation." ON public.cards;');
        } catch (e) { console.log('Policy drop error:', e.message); }

        // Create new permissive update policy for operators and activation
        await client.query(`
            CREATE POLICY "Allow card updates for operators and during activation" 
            ON public.cards 
            FOR UPDATE 
            USING (
                (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'operator' OR 
                status = 'UNASSIGNED' OR 
                status = 'READY' OR 
                auth.uid() = assigned_user_id
            );
        `);
        console.log('Updated update policy');

        // Allow select for everyone (already exists but making sure)
        try {
            await client.query('DROP POLICY IF EXISTS "Cards are viewable by everyone." ON public.cards;');
            await client.query('CREATE POLICY "Cards are viewable by everyone." ON public.cards FOR SELECT USING (true);');
        } catch (e) { }

        // Migrate old UNASSIGNED cards to READY
        try {
            await client.query("UPDATE public.cards SET status = 'READY' WHERE status = 'UNASSIGNED';");
            console.log('Migrated UNASSIGNED cards to READY');
        } catch (e) { console.log('Migration error:', e.message); }

    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await client.end();
    }
}

run();
