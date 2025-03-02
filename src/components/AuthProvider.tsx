'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setUser(data?.session?.user || null);
      setLoading(false);
      
      // Setup auth listener
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user || null);
          
          if (event === 'SIGNED_OUT') {
            router.push('/auth');
          }
        }
      );
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    getSession();
  }, [router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user && pathname !== '/auth') {
      router.push('/auth');
    }
  }, [loading, user, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && (
        <>
          {(user || pathname === '/auth') ? children : null}
        </>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
