-- Fix remaining functions missing search_path

-- are_users_connected (already has it via select query but marking explicitly)
CREATE OR REPLACE FUNCTION public.are_users_connected(user1_id uuid, user2_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE (user_1_id = LEAST(user1_id, user2_id) AND user_2_id = GREATEST(user1_id, user2_id))
  );
$function$;

-- get_user_connections_count
CREATE OR REPLACE FUNCTION public.get_user_connections_count(user_id_param uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.connections
  WHERE user_1_id = user_id_param OR user_2_id = user_id_param;
$function$;

-- find_or_create_dm - already has it but refreshing
CREATE OR REPLACE FUNCTION public.find_or_create_dm(other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  conv_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if conversation already exists between these two users
  SELECT id INTO conv_id
  FROM public.conversations
  WHERE (participant_1_id = current_user_id AND participant_2_id = other_user_id)
     OR (participant_1_id = other_user_id AND participant_2_id = current_user_id);

  -- If conversation doesn't exist, create it
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (current_user_id, other_user_id)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$function$;