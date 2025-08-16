-- Create enum types if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'edit_status') THEN
    CREATE TYPE edit_status AS ENUM ('pending','approved','rejected','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
    CREATE TYPE report_reason AS ENUM ('fake','spam','unsafe','unreferenced');
  END IF;
END $$;

-- Tool edit requests table
CREATE TABLE IF NOT EXISTS public.tool_edit_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id       UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  requester_id  UUID NOT NULL,
  current_snapshot JSONB NOT NULL,       -- copy of tool at request time
  proposed_changes JSONB NOT NULL,       -- only changed fields
  status        edit_status NOT NULL DEFAULT 'pending',
  admin_id      UUID,
  rejection_reason TEXT,
  version_at_submit INTEGER,             -- optional optimistic concurrency
  created_at    TIMESTAMPTZ DEFAULT now(),
  decided_at    TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tool_edit_requests_tool ON public.tool_edit_requests(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_edit_requests_requester ON public.tool_edit_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_tool_edit_requests_status ON public.tool_edit_requests(status);

-- Ensure one pending request per user per tool
CREATE UNIQUE INDEX IF NOT EXISTS uniq_edit_req_pending
ON public.tool_edit_requests(tool_id, requester_id)
WHERE status = 'pending';

-- Tool reports table
CREATE TABLE IF NOT EXISTS public.tool_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id      UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL,
  reason       report_reason NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_reports_tool ON public.tool_reports(tool_id);

-- Prevent duplicate reports from same user for same tool with same reason
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tool_reports_user_tool_reason
ON public.tool_reports(tool_id, reporter_id, reason);

-- Moderation log for audit trail
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL,
  target_type TEXT NOT NULL,          -- 'tool','tool_edit_request','tool_report'
  target_id   UUID NOT NULL,
  action      TEXT NOT NULL,          -- 'approve','reject','remove','dismiss_report','warn_owner','edit_tool'
  meta        JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Notifications table (extend existing or create if needed)
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  type        TEXT NOT NULL,          -- 'tool_edit_submitted','tool_edit_approved','tool_edit_rejected','tool_removed'
  payload     JSONB,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS on all tables
ALTER TABLE public.tool_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tool_edit_requests
CREATE POLICY "Users can create edit requests"
  ON public.tool_edit_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view their own edit requests"
  ON public.tool_edit_requests FOR SELECT
  USING (auth.uid() = requester_id);

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

-- Functions for handling edit requests
CREATE OR REPLACE FUNCTION public.approve_tool_edit_request(
  request_id UUID,
  admin_notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edit_request RECORD;
  proposed_data JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve edit requests';
  END IF;

  -- Get the edit request
  SELECT * INTO edit_request
  FROM tool_edit_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edit request not found or already processed';
  END IF;

  -- Apply the proposed changes to the tool
  proposed_data := edit_request.proposed_changes;
  
  UPDATE tools SET
    name = COALESCE(proposed_data->>'name', name),
    description = COALESCE(proposed_data->>'description', description),
    category_id = COALESCE((proposed_data->>'category_id')::UUID, category_id),
    subcategory = COALESCE(proposed_data->>'subcategory', subcategory),
    website = COALESCE(proposed_data->>'website', website),
    pricing = COALESCE(proposed_data->>'pricing', pricing),
    logo_url = COALESCE(proposed_data->>'logo_url', logo_url),
    features = CASE 
      WHEN proposed_data->'features' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(proposed_data->'features'))
      ELSE features
    END,
    pros = CASE 
      WHEN proposed_data->'pros' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(proposed_data->'pros'))
      ELSE pros
    END,
    cons = CASE 
      WHEN proposed_data->'cons' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(proposed_data->'cons'))
      ELSE cons
    END,
    tags = CASE 
      WHEN proposed_data->'tags' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(proposed_data->'tags'))
      ELSE tags
    END,
    updated_at = now()
  WHERE id = edit_request.tool_id;

  -- Update the edit request status
  UPDATE tool_edit_requests SET
    status = 'approved',
    admin_id = auth.uid(),
    decided_at = now()
  WHERE id = request_id;

  -- Log the action
  INSERT INTO moderation_log (actor_id, target_type, target_id, action, meta)
  VALUES (auth.uid(), 'tool_edit_request', request_id, 'approve', jsonb_build_object('admin_notes', admin_notes));

  -- Notify the requester
  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    edit_request.requester_id, 
    'tool_edit_approved',
    jsonb_build_object(
      'tool_id', edit_request.tool_id,
      'request_id', request_id,
      'admin_notes', admin_notes
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_tool_edit_request(
  request_id UUID,
  rejection_reason TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edit_request RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject edit requests';
  END IF;

  -- Validate rejection reason
  IF rejection_reason IS NULL OR trim(rejection_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  -- Get the edit request
  SELECT * INTO edit_request
  FROM tool_edit_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Edit request not found or already processed';
  END IF;

  -- Update the edit request status
  UPDATE tool_edit_requests SET
    status = 'rejected',
    admin_id = auth.uid(),
    rejection_reason = rejection_reason,
    decided_at = now()
  WHERE id = request_id;

  -- Log the action
  INSERT INTO moderation_log (actor_id, target_type, target_id, action, meta)
  VALUES (auth.uid(), 'tool_edit_request', request_id, 'reject', jsonb_build_object('reason', rejection_reason));

  -- Notify the requester
  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    edit_request.requester_id, 
    'tool_edit_rejected',
    jsonb_build_object(
      'tool_id', edit_request.tool_id,
      'request_id', request_id,
      'rejection_reason', rejection_reason
    )
  );
END;
$$;