/*
  # Fix security issues on handle_new_user function

  1. Security Changes
    - Set immutable search_path to prevent search path manipulation attacks
    - Revoke EXECUTE from `anon` role to prevent public RPC invocation
    - Revoke EXECUTE from `authenticated` role to prevent signed-in user RPC invocation
    - Function remains SECURITY DEFINER (required for trigger to insert into profiles)
    - Only the trigger on auth.users should invoke this function

  2. Notes
    - The function is recreated with SET search_path = '' so all references are schema-qualified
    - REVOKE ensures the function cannot be called directly via PostgREST /rpc endpoint
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
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
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;