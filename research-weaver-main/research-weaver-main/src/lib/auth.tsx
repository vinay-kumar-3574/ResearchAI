import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, "name">>) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function mapUser(supaUser: SupabaseUser): User {
  return {
    id: supaUser.id,
    name:
      supaUser.user_metadata?.full_name ||
      supaUser.user_metadata?.name ||
      supaUser.email?.split("@")[0] ||
      "User",
    email: supaUser.email || "",
    createdAt: supaUser.created_at,
    avatarUrl: supaUser.user_metadata?.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user));
      }
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signup = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const updateProfile = async (patch: Partial<Pick<User, "name">>) => {
    if (!user) return;

    // Update Supabase Auth metadata
    if (patch.name) {
      await supabase.auth.updateUser({
        data: { full_name: patch.name },
      });
    }

    // Update profiles table
    await supabase
      .from("profiles")
      .update({
        full_name: patch.name,
      })
      .eq("id", user.id);

    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  };

  const signInWithOAuth = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, updateProfile, signInWithOAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
