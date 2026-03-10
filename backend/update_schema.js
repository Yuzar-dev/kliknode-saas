const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres.hpyclqmbzqhlbqrkxdsm:yt4em4N7EY.!L*&@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Supabase');
        await client.query("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_visible BOOLEAN DEFAULT true;");
        console.log('Successfully added bio_visible column');
    } catch (err) {
        console.error('Error executing query:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
