'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * AuthProvider supplies the authenticated user and session throughout the app.
 * Why: Centralizes Supabase auth state wiring for Client Components that need interactivity.
 */
const AuthContext = createContext<{ 
  session: Session | null;
  user: User | null;
  signOut: () => void;
  loading: boolean;
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error fetching user:', error);
        }
      }
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null); // session object not required for most UI; keep minimal state
        setLoading(false);
        if (process.env.NODE_ENV !== 'production') {
          console.log('AuthContext: Initial user loaded', data.user);
        }
      }
    };

    getUser();

    // Subscribe to auth state changes to update UI reactively (e.g., after login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Do not set loading to false here, only after initial load
      if (process.env.NODE_ENV !== 'production') {
        console.log('AuthContext: Auth state changed', _event, session, session?.user);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('AuthContext: user', user);
  }
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
