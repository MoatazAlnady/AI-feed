-- Create a function to check if users have a pending connection request between them
CREATE OR REPLACE FUNCTION public.has_pending_connection_request(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.connection_requests
    WHERE status = 'pending'
      AND (
        (requester_id = user_a AND recipient_id = user_b)
        OR (requester_id = user_b AND recipient_id = user_a)
      )
  )
$$;

-- Update the RLS policy to also allow viewing profiles of users with pending connection requests
DROP POLICY IF EXISTS "Restricted profile access" ON public.user_profiles;

CREATE POLICY "Restricted profile access" ON public.user_profiles
FOR SELECT
TO public
USING (
  auth.uid() = id 
  OR is_admin() 
  OR are_users_connected(auth.uid(), id)
  OR has_pending_connection_request(auth.uid(), id)
);