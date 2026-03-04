import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query(`ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "social_links" JSONB DEFAULT '[]'::jsonb`);
    console.log("Column added successfully:", res);
  } catch (e) {
    console.error("Error adding column:", e);
  } finally {
    await pool.end();
  }
}
run();
