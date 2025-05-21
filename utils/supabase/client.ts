// utils/supabase/client.ts
import { createBrowserClient as originalCreateBrowserClient } from '@supabase/ssr';

// Create a singleton instance
let supabaseInstance: ReturnType<typeof originalCreateBrowserClient> | null = null;

export const createClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Anon Key is missing. Check your environment variables.');
  }

  supabaseInstance = originalCreateBrowserClient(supabaseUrl, supabaseKey);
  
  return supabaseInstance;
};