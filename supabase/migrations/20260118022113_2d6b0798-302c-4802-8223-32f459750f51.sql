-- Add new frequency options to newsletter_subscribers
ALTER TABLE newsletter_subscribers 
DROP CONSTRAINT IF EXISTS newsletter_subscribers_frequency_check;

ALTER TABLE newsletter_subscribers 
ADD CONSTRAINT newsletter_subscribers_frequency_check 
CHECK (frequency IN ('daily', 'semi_weekly', 'biweekly', 'weekly', 'monthly'));

-- Add interests column directly to newsletter_subscribers for faster queries
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Create newsletter_templates table for cached templates
CREATE TABLE IF NOT EXISTS newsletter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  html_template TEXT NOT NULL,
  css_styles TEXT,
  header_html TEXT,
  footer_html TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on newsletter_templates
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;

-- Admin can manage all templates (using admin_access_level column)
CREATE POLICY "Admins can manage all templates" ON newsletter_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND admin_access_level IS NOT NULL AND admin_access_level != '')
  );

-- Users can view default templates
CREATE POLICY "Users can view default templates" ON newsletter_templates
  FOR SELECT USING (is_default = true);

-- Add template_id and review columns to newsletter_issues
ALTER TABLE newsletter_issues 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES newsletter_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS requires_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending';

-- Add check constraint for review_status
ALTER TABLE newsletter_issues 
DROP CONSTRAINT IF EXISTS newsletter_issues_review_status_check;

ALTER TABLE newsletter_issues 
ADD CONSTRAINT newsletter_issues_review_status_check 
CHECK (review_status IN ('pending', 'approved', 'rejected', 'auto_approved'));

-- Insert default newsletter templates
INSERT INTO newsletter_templates (name, description, html_template, is_default)
VALUES 
(
  'Modern Clean',
  'A clean, modern template with a focus on readability',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{{subject}}</title></head><body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;"><h1 style="color: white; margin: 0; font-size: 24px;">AI Tools Hub</h1><p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{{frequency}} Newsletter</p></div><div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;"><p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi {{subscriber_name}},</p><p style="color: #6b7280; font-size: 14px; line-height: 1.6;">{{intro_text}}</p>{{content}}<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"><p style="color: #9ca3af; font-size: 12px; text-align: center;"><a href="{{unsubscribe_url}}" style="color: #6366f1;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #6366f1;">Manage Preferences</a></p></div></div></body></html>',
  true
),
(
  'Classic Professional',
  'A professional template suitable for business communications',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{{subject}}</title></head><body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Georgia, serif;"><div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;"><div style="border-bottom: 3px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px;"><h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: normal;">AI Tools Hub</h1><p style="color: #6b7280; margin: 5px 0 0 0; font-style: italic;">{{frequency}} Digest</p></div><p style="color: #374151; font-size: 16px; line-height: 1.8;">Dear {{subscriber_name}},</p><p style="color: #4b5563; font-size: 15px; line-height: 1.8;">{{intro_text}}</p>{{content}}<div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 20px;"><p style="color: #9ca3af; font-size: 11px;"><a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #6b7280;">Preferences</a></p></div></div></body></html>',
  true
),
(
  'Minimal Dark',
  'A dark-themed minimal template',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{{subject}}</title></head><body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;"><div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;"><h1 style="color: #f8fafc; margin: 0 0 10px 0; font-size: 20px;">AI Tools Hub</h1><p style="color: #94a3b8; margin: 0 0 30px 0; font-size: 13px;">{{frequency}} Newsletter</p><p style="color: #e2e8f0; font-size: 15px; line-height: 1.7;">Hi {{subscriber_name}},</p><p style="color: #94a3b8; font-size: 14px; line-height: 1.7;">{{intro_text}}</p>{{content}}<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155;"><p style="color: #64748b; font-size: 11px;"><a href="{{unsubscribe_url}}" style="color: #818cf8;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #818cf8;">Preferences</a></p></div></div></body></html>',
  true
)
ON CONFLICT DO NOTHING;