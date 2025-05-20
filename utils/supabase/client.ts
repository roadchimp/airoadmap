// utils/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  return createSupabaseClient(supabaseUrl, supabaseKey);
};