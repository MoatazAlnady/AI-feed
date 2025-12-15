-- Phase 3: Add show_poster to jobs and company_text to user_profiles

-- Add show_poster column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS show_poster boolean DEFAULT true;

-- Add company_text column to user_profiles for text-based workplace when company is not in system
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_text text;