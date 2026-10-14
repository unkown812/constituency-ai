"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import type { AuthUser, UserRole } from "../types/auth";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (phone: string, otp: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

function mapSupabaseUser(sbUser: User, profile?: any): AuthUser {
  const meta = sbUser.user_metadata ?? {};
  return {
    id: sbUser.id,
    full_name: profile?.full_name ?? meta?.full_name ?? "",
    phone: sbUser.phone ?? profile?.phone ?? "",
    email: sbUser.email ?? undefined,
    role: (profile?.role ?? meta?.role ?? "citizen") as UserRole,
    constituency_id: profile?.constituency_id ?? meta?.constituency_id ?? "",
    constituency_name: profile?.constituency_name ?? "",
    avatar_url: profile?.avatar_url ?? meta?.avatar_url ?? undefined,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, constituencies!left(name)")
        .eq("id", data.user.id)
        .single();

      const profileRow = profile as any;
      const mapped = mapSupabaseUser(data.user, profileRow ?? undefined);
      if (profileRow?.constituencies) {
        mapped.constituency_name = profileRow.constituencies?.name ?? "";
      }
      setUser(mapped);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        refreshUser().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refreshUser();
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, [refreshUser]);

  const sendOtp = useCallback(async (phone: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const login = useCallback(async (phone: string, otp: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error) throw error;
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        role: user?.role ?? null,
        login,
        sendOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
