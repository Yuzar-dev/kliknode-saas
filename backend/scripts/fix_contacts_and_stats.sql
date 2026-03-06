-- Fix contacts_leads Table Schema
ALTER TABLE "contacts_leads" ALTER COLUMN "company_id" DROP NOT NULL;

-- Enable RLS for contacts_leads
ALTER TABLE "contacts_leads" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public contact exchange)
DROP POLICY IF EXISTS "Anyone can insert contacts_leads" ON "contacts_leads";
CREATE POLICY "Anyone can insert contacts_leads" ON "contacts_leads" 
  FOR INSERT WITH CHECK (true);

-- Allow users to see their own leads
DROP POLICY IF EXISTS "Users can view their own leads" ON "contacts_leads";
CREATE POLICY "Users can view their own leads" ON "contacts_leads" 
  FOR SELECT USING (auth.uid() = user_id);

-- Ensure card_scans table also has RLS if needed, but for now we focus on the reported bugs.
