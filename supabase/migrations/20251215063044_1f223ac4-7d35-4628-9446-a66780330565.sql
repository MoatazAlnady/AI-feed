-- Phase 1: Database Schema Changes

-- 1.1 Create enum for company employee roles
CREATE TYPE public.company_role AS ENUM ('admin', 'manager', 'employee');

-- 1.2 Modify company_pages table - add domain and subscription fields
ALTER TABLE public.company_pages 
ADD COLUMN IF NOT EXISTS domain text UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_plan_id uuid REFERENCES pricing_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS max_employees integer DEFAULT 1;

-- 1.3 Modify jobs table - link to company pages
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS company_page_id uuid REFERENCES company_pages(id);

-- 1.4 Create company_employees table
CREATE TABLE IF NOT EXISTS public.company_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_page_id uuid REFERENCES company_pages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role company_role DEFAULT 'employee' NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_page_id, user_id)
);

-- 1.5 Create company_invitations table
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_page_id uuid REFERENCES company_pages(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role company_role DEFAULT 'employee' NOT NULL,
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.6 Add employer pricing plans
INSERT INTO public.pricing_plans (name, description, price, currency, billing_interval, features, max_users, is_active) VALUES
('Starter', 'For small teams getting started', 49.00, 'USD', 'monthly', '{"jobs": 5, "projects": 10, "talent_search": true}', 3, true),
('Professional', 'For growing businesses', 149.00, 'USD', 'monthly', '{"jobs": 25, "projects": 50, "talent_search": true, "analytics": true}', 10, true),
('Enterprise', 'For large organizations', 399.00, 'USD', 'monthly', '{"jobs": -1, "projects": -1, "talent_search": true, "analytics": true, "api_access": true}', 50, true)
ON CONFLICT DO NOTHING;

-- Phase 2: Security Definer Functions (to avoid RLS recursion)

-- 2.1 Function to check if user is a company employee
CREATE OR REPLACE FUNCTION public.is_company_employee(company_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_employees
    WHERE company_page_id = company_id AND user_id = user_uuid
  );
$$;

-- 2.2 Function to check if user is a company admin
CREATE OR REPLACE FUNCTION public.is_company_admin(company_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_employees
    WHERE company_page_id = company_id 
    AND user_id = user_uuid 
    AND role = 'admin'
  );
$$;

-- 2.3 Function to get user's company id
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_page_id FROM public.company_employees
  WHERE user_id = user_uuid
  LIMIT 1;
$$;

-- 2.4 Function to check if company has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_pages
    WHERE id = company_id 
    AND subscription_status = 'active'
    AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  );
$$;

-- Phase 2: RLS Policies

-- 2.5 Enable RLS on new tables
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- 2.6 Company Employees RLS Policies

-- Users can view employees in their own company
CREATE POLICY "Users can view employees in their company"
ON public.company_employees
FOR SELECT
USING (
  public.is_company_employee(company_page_id, auth.uid())
);

-- Company admins can insert new employees
CREATE POLICY "Company admins can add employees"
ON public.company_employees
FOR INSERT
WITH CHECK (
  public.is_company_admin(company_page_id, auth.uid())
  OR 
  -- Allow first employee (company creator) to add themselves as admin
  NOT EXISTS (SELECT 1 FROM public.company_employees WHERE company_page_id = company_employees.company_page_id)
);

-- Company admins can update employees (but not themselves)
CREATE POLICY "Company admins can update employees"
ON public.company_employees
FOR UPDATE
USING (
  public.is_company_admin(company_page_id, auth.uid())
  AND user_id != auth.uid()
);

-- Company admins can remove employees (but not themselves)
CREATE POLICY "Company admins can remove employees"
ON public.company_employees
FOR DELETE
USING (
  public.is_company_admin(company_page_id, auth.uid())
  AND user_id != auth.uid()
);

-- 2.7 Company Invitations RLS Policies

-- Company admins can view invitations for their company
CREATE POLICY "Company admins can view invitations"
ON public.company_invitations
FOR SELECT
USING (
  public.is_company_admin(company_page_id, auth.uid())
);

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.company_invitations
FOR SELECT
USING (true);

-- Company admins can create invitations
CREATE POLICY "Company admins can create invitations"
ON public.company_invitations
FOR INSERT
WITH CHECK (
  public.is_company_admin(company_page_id, auth.uid())
  AND invited_by = auth.uid()
);

-- Company admins can update invitations
CREATE POLICY "Company admins can update invitations"
ON public.company_invitations
FOR UPDATE
USING (
  public.is_company_admin(company_page_id, auth.uid())
);

-- Invited users can update their own invitation (to accept/decline)
CREATE POLICY "Invited users can accept invitations"
ON public.company_invitations
FOR UPDATE
USING (
  status = 'pending'
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = company_invitations.email
  )
);

-- Company admins can delete invitations
CREATE POLICY "Company admins can delete invitations"
ON public.company_invitations
FOR DELETE
USING (
  public.is_company_admin(company_page_id, auth.uid())
);

-- 2.8 Update employer_projects RLS - projects only visible to company members
DROP POLICY IF EXISTS "Users can view their own projects" ON public.employer_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.employer_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.employer_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.employer_projects;

-- Add company_page_id to employer_projects
ALTER TABLE public.employer_projects 
ADD COLUMN IF NOT EXISTS company_page_id uuid REFERENCES company_pages(id);

-- Projects visible to company members
CREATE POLICY "Company members can view company projects"
ON public.employer_projects
FOR SELECT
USING (
  public.is_company_employee(company_page_id, auth.uid())
  OR user_id = auth.uid()
);

-- Company members with active subscription can create projects
CREATE POLICY "Company members can create projects"
ON public.employer_projects
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    company_page_id IS NULL 
    OR (
      public.is_company_employee(company_page_id, auth.uid())
      AND public.has_active_subscription(company_page_id)
    )
  )
);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
ON public.employer_projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
ON public.employer_projects
FOR DELETE
USING (auth.uid() = user_id);

-- 2.9 Add index for performance
CREATE INDEX IF NOT EXISTS idx_company_employees_user_id ON public.company_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_company_id ON public.company_employees(company_page_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON public.company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON public.company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_employer_projects_company_id ON public.employer_projects(company_page_id);