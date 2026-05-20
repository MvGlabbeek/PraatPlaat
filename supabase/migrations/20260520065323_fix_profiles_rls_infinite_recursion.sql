/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Admin policies on `profiles` table query the `profiles` table itself to check admin role
    - This causes infinite recursion because the SELECT triggers the same RLS policies

  2. Solution
    - Create a SECURITY DEFINER helper function `public.is_admin()` that bypasses RLS
    - Replace all self-referencing admin checks in profiles policies with this function
    - Lock down the helper: immutable search_path, revoke public/anon/authenticated EXECUTE

  3. Security Changes
    - Drop and recreate admin policies on `profiles` to use `is_admin()` instead of subquery
    - Helper function uses SECURITY DEFINER with restricted search_path
    - EXECUTE revoked from public, anon, authenticated (only used internally by RLS)
*/

-- Create a helper function that checks admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
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

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Drop the broken admin policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Recreate them using the helper function (no self-referencing subquery)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());