-- =====================================================
-- SECURITY FIX 1: Company Invitation Token Exposure
-- Fix the policy that exposes ALL invitations to anyone
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON company_invitations;

-- Create a secure function to validate invitation tokens
-- This prevents exposing all invitations - you must know the exact token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_input text)
RETURNS TABLE (
  id uuid,
  email text,
  company_page_id uuid,
  role text,
  status text,
  expires_at timestamptz,
  company_name text,
  company_logo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.email,
    ci.company_page_id,
    ci.role::text,
    ci.status,
    ci.expires_at,
    cp.name as company_name,
    cp.logo_url as company_logo
  FROM company_invitations ci
  JOIN company_pages cp ON cp.id = ci.company_page_id
  WHERE ci.token = token_input 
  AND ci.status = 'pending'
  AND ci.expires_at > now();
END;
$$;

-- Grant execute to authenticated and anon (needed for accepting invites before login)
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon;

-- Create a new restrictive policy for company_invitations
-- Only company admins can view invitations for their company
CREATE POLICY "Company admins can view their invitations"
ON company_invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_employees ce
    WHERE ce.company_page_id = company_invitations.company_page_id
    AND ce.user_id = auth.uid()
    AND ce.role = 'admin'
  )
  OR
  -- Or the invited user can see their own invitation (by email match)
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- =====================================================
-- SECURITY FIX 2: Audit Log Additional Protection  
-- =====================================================

-- Drop existing policy if any
DROP POLICY IF EXISTS "Admins can view audit log" ON admin_audit_log;

-- Create enhanced audit log policy
CREATE POLICY "Admins can view recent audit logs"
ON admin_audit_log FOR SELECT
USING (
  public.is_admin()
);

-- Add index for performance on audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at 
ON admin_audit_log (created_at DESC);

-- Add comment explaining security model
COMMENT ON TABLE admin_audit_log IS 
'Admin audit log for tracking administrative actions. 
Access restricted to admin users only via RLS policy.';