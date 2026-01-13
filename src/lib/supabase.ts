import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epublrxxgptxarnytbit.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwdWJscnh4Z3B0eGFybnl0Yml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzk0ODMsImV4cCI6MjA4Mzg1NTQ4M30.DaQ9a9ZAoAgWVxP0OOJ_mbmRAjffrVCrb6jq_K6hxuc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 表名
export const HABITS_TABLE = 'habits';
export const ASPIRATIONS_TABLE = 'aspirations';
export const SETTINGS_TABLE = 'settings';
