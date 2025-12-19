-- Create todos table
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ownership
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assignment (for employer use)
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_page_id UUID REFERENCES public.company_pages(id) ON DELETE CASCADE,
  
  -- Metadata
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own todos (created or assigned)
CREATE POLICY "Users can view own todos"
ON public.todos FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid()
);

-- 2. Employer admins can view todos they assigned to employees
CREATE POLICY "Employer admins can view assigned todos"
ON public.todos FOR SELECT
TO authenticated
USING (
  assigned_by = auth.uid() AND
  company_page_id IS NOT NULL
);

-- 3. Users can create their own todos
CREATE POLICY "Users can create own todos"
ON public.todos FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- 4. Users can update their own todos or assigned todos
CREATE POLICY "Users can update own todos"
ON public.todos FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- 5. Users can delete their own todos
CREATE POLICY "Users can delete own todos"
ON public.todos FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 6. Employer admins can delete todos they assigned
CREATE POLICY "Employer admins can delete assigned todos"
ON public.todos FOR DELETE
TO authenticated
USING (
  assigned_by = auth.uid() AND
  company_page_id IS NOT NULL
);

-- Indexes
CREATE INDEX idx_todos_created_by ON public.todos(created_by);
CREATE INDEX idx_todos_assigned_to ON public.todos(assigned_to);
CREATE INDEX idx_todos_company_page_id ON public.todos(company_page_id);

-- Trigger for updated_at
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();