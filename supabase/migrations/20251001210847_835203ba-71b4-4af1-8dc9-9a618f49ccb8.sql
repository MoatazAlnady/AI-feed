-- Ensure trigger to create user_profiles on new auth.users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill missing user_profiles for existing users
INSERT INTO public.user_profiles (id, full_name, account_type, newsletter_subscription)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'account_type', 'creator'),
  COALESCE((u.raw_user_meta_data->>'newsletter_subscription')::boolean, false)
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.id = u.id
WHERE up.id IS NULL;

-- Generate handles for any profiles missing one
SELECT public.backfill_user_handles();