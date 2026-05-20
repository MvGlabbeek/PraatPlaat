/*
  # Move is_admin() to private schema to prevent RPC exposure

  1. Problem
    - `public.is_admin()` is exposed via PostgREST at `/rest/v1/rpc/is_admin`
    - Authenticated users can call it directly, which is not intended

  2. Solution
    - Create a `private` schema that PostgREST does not expose
    - Move `is_admin()` into that schema
    - Update all RLS policies on `profiles` to reference `private.is_admin()`
    - Grant USAGE on the `private` schema and EXECUTE on the function to `authenticated`
      so RLS policies still work internally

  3. Security Changes
    - Drop `public.is_admin()` (no longer exposed via RPC)
    - Create `private.is_admin()` with SECURITY DEFINER and locked search_path
    - Revoke all default access; grant only what RLS needs
*/

-- Create private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Create the function in the private schema
CREATE OR REPLACE FUNCTION private.is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Lock down access: only authenticated role needs it (for RLS evaluation)
REVOKE ALL ON FUNCTION private.is_admin() FROM public;
REVOKE ALL ON FUNCTION private.is_admin() FROM anon;
REVOKE ALL ON FUNCTION private.is_admin() FROM authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- Update profiles RLS policies to use private.is_admin()
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (private.is_admin());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (private.is_admin());

-- Drop the old public function
DROP FUNCTION IF EXISTS public.is_admin();