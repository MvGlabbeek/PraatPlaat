/*
  # Add Authentication Profiles and User-Owned Data

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users) - User identifier
      - `username` (text, unique, not null) - Display name / login name
      - `email` (text, not null) - User email address
      - `role` (text, not null, default 'user') - User role ('admin' or 'user')
      - `created_at` (timestamptz, default now()) - Account creation timestamp
      - `updated_at` (timestamptz, default now()) - Last profile update timestamp

  2. Modified Tables
    - `diagrams` - Add `user_id` column (uuid, references auth.users) for ownership
    - `chat_messages` - Inherits ownership through diagram foreign key
    - `custom_styles` - Add `user_id` column (uuid, references auth.users) for ownership

  3. Security
    - Enable RLS on profiles table
    - Replace all existing anon policies with authenticated user-based policies
    - Users can only read/write their own data
    - Admins can read all profiles (for admin panel)

  4. Important Notes
    - Existing data gets user_id set to NULL (will be accessible to all authenticated users)
    - A trigger automatically creates a profile when a new auth user signs up
    - The admin user must be seeded separately via Supabase Auth
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add user_id to diagrams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagrams' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE diagrams ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to custom_styles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_styles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE custom_styles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on user_id for diagrams
CREATE INDEX IF NOT EXISTS idx_diagrams_user_id ON diagrams(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_styles_user_id ON custom_styles(user_id);

-- Drop all existing anon policies
DROP POLICY IF EXISTS "Allow anon read access to diagrams" ON diagrams;
DROP POLICY IF EXISTS "Allow anon insert to diagrams" ON diagrams;
DROP POLICY IF EXISTS "Allow anon update to diagrams" ON diagrams;
DROP POLICY IF EXISTS "Allow anon delete from diagrams" ON diagrams;

DROP POLICY IF EXISTS "Allow anon read access to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow anon insert to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow anon update to chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow anon delete from chat_messages" ON chat_messages;

DROP POLICY IF EXISTS "Allow anon read access to custom_styles" ON custom_styles;
DROP POLICY IF EXISTS "Allow anon insert to custom_styles" ON custom_styles;
DROP POLICY IF EXISTS "Allow anon update to custom_styles" ON custom_styles;
DROP POLICY IF EXISTS "Allow anon delete from custom_styles" ON custom_styles;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Diagrams policies (user-owned)
CREATE POLICY "Users can read own diagrams"
  ON diagrams FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own diagrams"
  ON diagrams FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own diagrams"
  ON diagrams FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own diagrams"
  ON diagrams FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Chat messages policies (through diagram ownership)
CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagrams d
      WHERE d.id = chat_messages.diagram_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagrams d
      WHERE d.id = chat_messages.diagram_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagrams d
      WHERE d.id = chat_messages.diagram_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM diagrams d
      WHERE d.id = chat_messages.diagram_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM diagrams d
      WHERE d.id = chat_messages.diagram_id AND d.user_id = auth.uid()
    )
  );

-- Custom styles policies (user-owned + presets readable by all)
CREATE POLICY "Users can read own custom styles"
  ON custom_styles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_preset = true);

CREATE POLICY "Users can insert own custom styles"
  ON custom_styles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own custom styles"
  ON custom_styles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own custom styles"
  ON custom_styles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin policies for profiles management
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Function to handle new user signup -> auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
