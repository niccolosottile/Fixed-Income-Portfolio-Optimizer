'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { createClient } from '@/lib/supabase/client';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Function to get user profile
  async function getUserProfile(userId: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }
      
      setUser(data);
      setError(null);
      return data;
    } catch (error) {
      setError('Failed to load user profile');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Initialize auth on component mount
  useEffect(() => {
    if (authInitialized) return;
    
    setLoading(true);
    setError(null);
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (isMounted) {
            setError('Failed to retrieve session');
            setLoading(false);
          }
          return;
        }

        if (session?.user && isMounted) {
          await getUserProfile(session.user.id);
        } else if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError('Authentication system failed to initialize');
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Set up auth state listener
  useEffect(() => {
    if (!authInitialized) return;
    
    let isMounted = true;
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (session?.user) {
          // Only fetch profile if we need to (user doesn't exist or ID changed)
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            if (!user || user.id !== session.user.id) {
              setLoading(true);
              await getUserProfile(session.user.id);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [authInitialized, user]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const supabase = createClient();
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const supabase = createClient();
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
    } catch (error) {
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
