import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mnondtyhfphjupakmxvo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ub25kdHloZnBoanVwYWtteHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODUyMDYsImV4cCI6MjA3ODk2MTIwNn0.vTo84iXIZ_wj7-99qt9ciw1PxNPwIRwodWKHBjsOqO4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
