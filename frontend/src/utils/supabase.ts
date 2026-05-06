import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wdbgvttgojmcmphmzhgq.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYmd2dHRnb2ptY21waG16aGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODM3NjAsImV4cCI6MjA5MzY1OTc2MH0.kaOenYR7H0JC78sicUEReJKeLQQRYx4sQX8w4HJAsvc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
