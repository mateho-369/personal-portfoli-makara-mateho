import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthValue>({ user: null, session: null, loading: true, isAdmin: false });
const ADMIN_EMAIL = 'portfolio.owner@example.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAdmin: user?.email?.toLowerCase() === ADMIN_EMAIL,
  }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
