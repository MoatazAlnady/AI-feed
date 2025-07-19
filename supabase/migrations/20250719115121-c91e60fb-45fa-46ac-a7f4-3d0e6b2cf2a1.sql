-- Fix the infinite recursion in organization_members RLS policy
-- The issue is likely a self-referencing policy

-- First, let's drop the problematic policies
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Admin can manage organization members" ON organization_members;

-- Create corrected policies without recursion
CREATE POLICY "Users can view organization members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_members.organization_id 
      AND (
        organizations.admin_user_id = auth.uid() 
        OR organization_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin can manage organization members" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_members.organization_id 
      AND organizations.admin_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_members.organization_id 
      AND organizations.admin_user_id = auth.uid()
    )
  );