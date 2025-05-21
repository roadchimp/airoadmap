// utils/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a singleton instance that will be reused
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  // If we already have an instance, return it
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  // Create a new instance and store it
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey);
  
  return supabaseInstance;
};