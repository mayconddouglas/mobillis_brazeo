import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isDemo: boolean;
  isOAuthWithoutPassword: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  deleteAccount: async () => {},
  isDemo: false,
  isOAuthWithoutPassword: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isSetup = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isDemo = !isSetup;

  useEffect(() => {
    // Security feature: auto-logout when app is hidden (switched to another screen/tab/minimized)
    let timeoutId: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && user && !isDemo) {
        // Log out after 2 minutes of being hidden
        timeoutId = setTimeout(() => {
          supabase.auth.signOut();
        }, 2 * 60 * 1000);
      } else {
        // Clear the timeout if they come back before 2 minutes
        clearTimeout(timeoutId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, [user, isDemo]);

  useEffect(() => {
    if (isDemo) {
      // Mock mode so UI can be visualized without Supabase configured
      setUser({ id: 'demo-user-123', email: 'demo@routefinance.app', user_metadata: { name: 'Maycon' } } as unknown as User);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Usuário clicou no link de redefinição — redireciona para a página de nova senha
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        navigate('/redefinir-senha', { replace: true });
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, [isDemo]);

  const signOut = async () => {
    if (isDemo) {
      setUser(null);
      // Notify other tabs in demo mode too
      const channel = new BroadcastChannel('auth_sync');
      channel.postMessage('sign_out');
      channel.close();
      return;
    }
    await supabase.auth.signOut();
    const channel = new BroadcastChannel('auth_sync');
    channel.postMessage('sign_out');
    channel.close();
  };

  useEffect(() => {
    // Cross-tab synchronization strictly for logout
    const channel = new BroadcastChannel('auth_sync');
    channel.onmessage = (event) => {
      if (event.data === 'sign_out') {
        if (isDemo) {
          setUser(null);
        } else {
          supabase.auth.signOut();
        }
      }
    };
    return () => {
      channel.close();
    };
  }, [isDemo]);

  const deleteAccount = async () => {
    if (isDemo) {
      setUser(null);
      return;
    }
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
    await supabase.auth.signOut();
  };

  // True quando o usuário entrou via OAuth (Google) e ainda não tem senha cadastrada
  // Detectado por: provider principal é 'google' e não há identity de 'email'
  const isOAuthWithoutPassword = !!user && !isDemo && (() => {
    const identities = user.identities ?? [];
    const hasEmailIdentity = identities.some((i) => i.provider === 'email');
    const hasGoogleIdentity = identities.some((i) => i.provider === 'google');
    return hasGoogleIdentity && !hasEmailIdentity;
  })();

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, deleteAccount, isDemo, isOAuthWithoutPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
