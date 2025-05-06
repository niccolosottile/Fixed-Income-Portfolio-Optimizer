import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Check environment variables.');
}

// Create the Supabase client with explicit persistence configuration
export const supabase = createClient(
  supabaseUrl, 
  supabaseKey, 
  {
    auth: {
      persistSession: true,
      storageKey: 'fixed-income-portfolio-auth',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') {
            return null;
          }
          
          try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
          } catch {
            // Silent fail and return null if there's an error
            return null;
          }
        },
        setItem: (key, value) => {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(key, JSON.stringify(value));
            } catch {
              // Silent fail for storage errors
            }
          }
        },
        removeItem: (key) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
        },
      },
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
