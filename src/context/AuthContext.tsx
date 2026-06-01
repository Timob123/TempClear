import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Role = "admin" | "readonly" | null;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  role: Role;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function roleFromUser(user: User | null): Role {
  if (!user) return null;
  const meta = user.app_metadata?.role as string | undefined;
  if (meta === "admin") return "admin";
  if (meta === "readonly") return "readonly";
  if (user.email === "admin@cragleigh.local") return "admin";
  return "readonly";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const user = session?.user ?? null;
  const role = roleFromUser(user);

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      isAdmin: role === "admin",
      loading,
      signIn,
      signOut,
    }),
    [session, user, role, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
