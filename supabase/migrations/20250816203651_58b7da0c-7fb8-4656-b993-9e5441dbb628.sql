-- Create enum types if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'edit_status') THEN
    CREATE TYPE edit_status AS ENUM ('pending','approved','rejected','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
    CREATE TYPE report_reason AS ENUM ('fake','spam','unsafe','unreferenced');
  END IF;
END $$;

-- Check if tool_edit_requests table exists and add missing columns
DO $$ 
BEGIN
  -- Add current_snapshot column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tool_edit_requests' 
                 AND column_name = 'current_snapshot') THEN
    ALTER TABLE public.tool_edit_requests ADD COLUMN current_snapshot JSONB;
  END IF;
  
  -- Add proposed_changes column if it doesn't exist (rename requested_changes)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tool_edit_requests' 
                 AND column_name = 'proposed_changes') THEN
    -- If requested_changes exists, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tool_edit_requests' 
               AND column_name = 'requested_changes') THEN
      ALTER TABLE public.tool_edit_requests RENAME COLUMN requested_changes TO proposed_changes;
    ELSE
      ALTER TABLE public.tool_edit_requests ADD COLUMN proposed_changes JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
  END IF;
  
  -- Add rejection_reason column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tool_edit_requests' 
                 AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.tool_edit_requests ADD COLUMN rejection_reason TEXT;
  END IF;
  
  -- Add version_at_submit column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tool_edit_requests' 
                 AND column_name = 'version_at_submit') THEN
    ALTER TABLE public.tool_edit_requests ADD COLUMN version_at_submit INTEGER;
  END IF;
  
  -- Add decided_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tool_edit_requests' 
                 AND column_name = 'decided_at') THEN
    ALTER TABLE public.tool_edit_requests ADD COLUMN decided_at TIMESTAMPTZ;
  END IF;
  
  -- Handle status column conversion to enum with proper type casting
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'tool_edit_requests' 
             AND column_name = 'status' 
             AND data_type = 'text') THEN
    -- Update any invalid status values to 'pending'
    UPDATE tool_edit_requests SET status = 'pending' 
    WHERE status NOT IN ('pending', 'approved', 'rejected', 'cancelled');
    
    -- Drop the default constraint if it exists
    ALTER TABLE public.tool_edit_requests ALTER COLUMN status DROP DEFAULT;
    
    -- Convert the type with explicit casting
    ALTER TABLE public.tool_edit_requests ALTER COLUMN status TYPE edit_status 
    USING CASE 
      WHEN status = 'pending' THEN 'pending'::edit_status
      WHEN status = 'approved' THEN 'approved'::edit_status
      WHEN status = 'rejected' THEN 'rejected'::edit_status
      WHEN status = 'cancelled' THEN 'cancelled'::edit_status
      ELSE 'pending'::edit_status
    END;
    
    -- Set the new default
    ALTER TABLE public.tool_edit_requests ALTER COLUMN status SET DEFAULT 'pending'::edit_status;
  END IF;
END $$;

-- Tool reports table
CREATE TABLE IF NOT EXISTS public.tool_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id      UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reason       report_reason NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_reports_tool ON public.tool_reports(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_reports_reporter ON public.tool_reports(reporter_id);

-- Prevent duplicate reports from same user for same tool with same reason
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tool_reports_user_tool_reason
ON public.tool_reports(tool_id, reporter_id, reason);

-- Moderation log for audit trail
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,          -- 'tool','tool_edit_request','tool_report'
  target_id   UUID NOT NULL,
  action      TEXT NOT NULL,          -- 'approve','reject','remove','dismiss_report','warn_owner','edit_tool'
  meta        JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Notifications table (extend existing or create if needed)
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,          -- 'tool_edit_submitted','tool_edit_approved','tool_edit_rejected','tool_removed'
  payload     JSONB,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Create missing indexes for tool_edit_requests
CREATE INDEX IF NOT EXISTS idx_tool_edit_requests_tool ON public.tool_edit_requests(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_edit_requests_user ON public.tool_edit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_edit_requests_status ON public.tool_edit_requests(status);

-- Ensure one pending request per user per tool
CREATE UNIQUE INDEX IF NOT EXISTS uniq_edit_req_pending
ON public.tool_edit_requests(tool_id, user_id)
WHERE status = 'pending';

-- Enable RLS on all tables
ALTER TABLE public.tool_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Users can create edit requests" ON public.tool_edit_requests;
DROP POLICY IF EXISTS "Users can view their own edit requests" ON public.tool_edit_requests;
DROP POLICY IF EXISTS "Admins can manage all edit requests" ON public.tool_edit_requests;

-- RLS Policies for tool_edit_requests
CREATE POLICY "Users can create edit requests"
  ON public.tool_edit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own edit requests"
  ON public.tool_edit_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all edit requests"
  ON public.tool_edit_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- RLS Policies for tool_reports
CREATE POLICY "Users can create tool reports"
  ON public.tool_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.tool_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all tool reports"
  ON public.tool_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- RLS Policies for moderation_log
CREATE POLICY "Admins can view moderation log"
  ON public.moderation_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

CREATE POLICY "Admins can create moderation entries"
  ON public.moderation_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);