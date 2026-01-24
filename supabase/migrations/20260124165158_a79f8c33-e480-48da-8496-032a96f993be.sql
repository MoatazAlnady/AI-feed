-- Allow group creators to add themselves as members
CREATE POLICY "Creators can add themselves as members"
ON public.group_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM groups 
    WHERE id = group_id 
    AND creator_id = auth.uid()
  )
);

-- Fix existing data: Add you as owner of your group
INSERT INTO group_members (group_id, user_id, role, status)
VALUES (
  'bb7c5cdc-d319-48ce-870e-896830c81fee',
  'f603cf89-6e48-4fd4-b3f8-dadeed2f949c',
  'owner',
  'active'
);