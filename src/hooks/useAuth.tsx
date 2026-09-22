import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isRecoveryMode: boolean;
  signOut: () => Promise<void>;
  setRecoveryMode: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Buscar la sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      switch (event) {
        case 'PASSWORD_RECOVERY':
          setIsRecoveryMode(true);
          break;
        case 'TOKEN_REFRESHED':
          // La sesión nueva ya quedó seteada arriba; los hooks que leen `session.access_token`
          // (IA, queries) usan el token fresco en la próxima llamada.
          break;
        case 'SIGNED_OUT':
          // Sesión cerrada (manual o por JWT expirado): no dejar datos del usuario anterior en caché.
          setIsRecoveryMode(false);
          queryClient.clear();
          break;
        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      isLoading,
      isRecoveryMode,
      signOut,
      setRecoveryMode: setIsRecoveryMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
