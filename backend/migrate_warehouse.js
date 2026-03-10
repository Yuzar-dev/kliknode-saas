const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres.hpyclqmbzqhlbqrkxdsm:yt4em4N7EY.!L*&@aws-1-eu-west-1.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Supabase');

        // 1. Rename 'casablanca' value to 'oujda' in Warehouse enum
        // PostgreSQL doesn't allow direct RENAME for enum values easily in older versions, 
        // but since it's a new value we can add and update, or try RENAME VALUE (supported in PG 10+)
        try {
            await client.query("ALTER TYPE \"Warehouse\" RENAME VALUE 'casablanca' TO 'oujda';");
            console.log('✅ Renamed Casablanca to Oujda in Warehouse enum');
        } catch (e) {
            console.log('Enum rename error (might already be oujda):', e.message);
            // If rename fails, try adding and updating as fallback if needed (but RENAME VALUE is standard now)
        }

        // 2. Update existing records in cards table
        const cardsUpdate = await client.query("UPDATE public.cards SET warehouse = 'oujda' WHERE warehouse = 'casablanca';");
        console.log(`✅ Updated ${cardsUpdate.rowCount} records in cards table`);

        // 3. Update existing records in physical_cards table
        const pCardsUpdate = await client.query("UPDATE public.physical_cards SET warehouse = 'oujda' WHERE warehouse = 'casablanca';");
        console.log(`✅ Updated ${pCardsUpdate.rowCount} records in physical_cards table`);

        // 4. Update existing records in inventory table
        const invUpdate = await client.query("UPDATE public.inventory SET warehouse = 'oujda' WHERE warehouse = 'casablanca';");
        console.log(`✅ Updated ${invUpdate.rowCount} records in inventory table`);

    } catch (err) {
        console.error('❌ Error executing migration:', err);
    } finally {
        await client.end();
    }
}

run();
