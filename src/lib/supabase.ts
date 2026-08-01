import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase browser environment variables are missing.');
}

const supabase = createClient(supabaseUrl || 'https://invalid.local', supabaseAnonKey || 'missing');

export default supabase;
