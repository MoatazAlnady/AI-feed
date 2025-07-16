import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbhhumtpdfalgkhzirew.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGh1bXRwZGZhbGdraHppcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjQ2MzYsImV4cCI6MjA2NjgwMDYzNn0.xPN8YcVsB_3zIv9tHOju5FuTD9ECLuasnBTVyGWwe88';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);