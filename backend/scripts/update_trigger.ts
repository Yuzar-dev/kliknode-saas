import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Replacing Supabase Auth Trigger...');

  const sql = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_card_id UUID := gen_random_uuid();
  v_physical_uid TEXT := new.raw_user_meta_data->>'card_id';
BEGIN
  -- 1. Insert into public.users
  insert into public.users (
    id, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    created_at, 
    updated_at
  )
  values (
    new.id, 
    new.email, 
    '', 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    'USER'::public."UserRole", 
    now(), 
    now()
  );

  -- 2. Insert into public.cards (Initial blank Virtual Card)
  insert into public.cards (
    id, 
    user_id, 
    public_slug, 
    first_name, 
    last_name, 
    is_public, 
    created_at, 
    updated_at
  )
  values (
    v_card_id, 
    new.id, 
    new.id::text, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name',
    true, 
    now(), 
    now()
  );

  -- 3. Pair physical card if card_id was provided
  if v_physical_uid is not null and v_physical_uid != '' then
    update public.physical_cards
    set 
      status = 'paired'::public."PhysicalCardStatus",
      paired_card_id = v_card_id,
      paired_at = now()
    where uid = v_physical_uid and status = 'reserved'::public."PhysicalCardStatus";
  end if;

  return new;
END;
$$;
  `;

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('Trigger successfully replaced!');
  } catch (err) {
    console.error('Error replacing trigger:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
