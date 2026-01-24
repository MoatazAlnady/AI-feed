-- 1. Create SECURITY DEFINER function to check group admin/creator without recursion
CREATE OR REPLACE FUNCTION public.is_group_admin_or_creator(_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is the group creator
  IF EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = _group_id AND creator_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is admin/owner/moderator in group_members
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'moderator')
      AND status = 'active'
  );
END;
$$;

-- 2. Create function to check if user can invite to group
CREATE OR REPLACE FUNCTION public.can_invite_to_group(_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_setting TEXT;
  is_member BOOLEAN;
  is_admin BOOLEAN;
BEGIN
  -- Get group invite setting
  SELECT who_can_invite INTO invite_setting FROM public.groups WHERE id = _group_id;
  
  -- Check membership
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid() AND status = 'active'
  ) INTO is_member;
  
  -- Check admin status (includes creator)
  is_admin := public.is_group_admin_or_creator(_group_id);
  
  -- Apply permission logic
  IF invite_setting = 'everyone' THEN
    RETURN true;
  ELSIF invite_setting = 'members' THEN
    RETURN is_member OR is_admin;
  ELSIF invite_setting = 'admins' THEN
    RETURN is_admin;
  ELSE
    RETURN is_admin; -- Default to admins only
  END IF;
END;
$$;

-- 3. Drop the recursive policy causing infinite recursion
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;

-- 4. Create new non-recursive policies
-- SELECT: Anyone can view group members (for public groups, member lists are visible)
CREATE POLICY "Anyone can view group members"
ON public.group_members
FOR SELECT
USING (true);

-- UPDATE: Only admins/creators can update members
CREATE POLICY "Admins can update members"
ON public.group_members
FOR UPDATE
USING (public.is_group_admin_or_creator(group_id));

-- DELETE: Only admins/creators can delete members (or user can leave)
CREATE POLICY "Admins can delete members or self leave"
ON public.group_members
FOR DELETE
USING (
  public.is_group_admin_or_creator(group_id) 
  OR user_id = auth.uid()
);

-- 5. Create trigger to auto-add creator as owner when group is created
CREATE OR REPLACE FUNCTION public.auto_add_group_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.creator_id, 'owner', 'active')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_add_group_creator ON public.groups;
CREATE TRIGGER trigger_auto_add_group_creator
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_group_creator_as_member();

-- 6. Backfill: Add missing owner rows for existing groups
INSERT INTO public.group_members (group_id, user_id, role, status)
SELECT g.id, g.creator_id, 'owner', 'active'
FROM public.groups g
WHERE g.creator_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = g.id AND gm.user_id = g.creator_id
  )
ON CONFLICT DO NOTHING;