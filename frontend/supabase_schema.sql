-- Supabase Schema Setup

-- 1. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  job_title TEXT,
  company_name TEXT,
  bio TEXT,
  email TEXT,
  phone_mobile TEXT,
  phone_office TEXT,
  city TEXT,
  country TEXT,
  website TEXT,
  public_slug TEXT UNIQUE,
  avatar_url TEXT,
  cover_url TEXT,
  primary_color TEXT DEFAULT '#0666EB',
  theme TEXT DEFAULT 'light',
  social_links JSONB DEFAULT '[]'::jsonb,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notification_last_read TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Create cards table
CREATE TYPE card_status AS ENUM ('UNASSIGNED', 'ACTIVE', 'INACTIVE', 'LOST');

CREATE TABLE public.cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL, -- Physical card UID (NFC chip)
  status card_status DEFAULT 'UNASSIGNED' NOT NULL,
  warehouse TEXT,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cards are viewable by everyone." ON public.cards
  FOR SELECT USING (true);

CREATE POLICY "Operators and authenticated users can insert cards." ON public.cards
  FOR INSERT WITH CHECK (true); -- Adjust RLS later for strict Operator roles

CREATE POLICY "Users can update their assigned cards or unassigned cards during activation." ON public.cards
  FOR UPDATE USING (
    status = 'UNASSIGNED' OR auth.uid() = assigned_user_id
  );

-- 3. Set up Storage for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload their own avatars."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can delete their own avatars."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Create contacts table (for Exchange Contact feature)
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a contact
CREATE POLICY "Anyone can insert contacts." ON public.contacts
  FOR INSERT WITH CHECK (true);

-- Only profile owner can view their contacts
CREATE POLICY "Users can view their own received contacts." ON public.contacts
  FOR SELECT USING ( auth.uid() = profile_id );

-- 5. Automatic Profile Creation on Signup
-- This function will be called by a trigger when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on INSERT in auth.users
-- Add analytics to cards
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Function to handle new user signup with optional card assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_card_id TEXT;
BEGIN
  -- Extract card_id from metadata if present
  v_card_id := NEW.raw_user_meta_data->>'card_id';

  -- Create profile
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'employee'
  );

  -- If a card_id was provided, link it immediately
  IF v_card_id IS NOT NULL THEN
    UPDATE public.cards 
    SET 
      status = 'ACTIVE', 
      assigned_user_id = NEW.id,
      updated_at = NOW()
    WHERE uid = v_card_id AND (status = 'UNASSIGNED' OR assigned_user_id IS NULL);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Enable Realtime for cards
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
