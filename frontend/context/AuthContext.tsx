"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import type { User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const roleDashboards: Record<UserRole, string> = {
  superadmin: "/dashboard/superadmin",
  admin:      "/dashboard/admin",
  staff:      "/dashboard/staff",
  client:     "/dashboard/client",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: loggedInUser } = await authApi.login(email, password);
      setUser(loggedInUser);
      router.push(roleDashboards[loggedInUser.role]);
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even on error, clear local state so the UI doesn't get stuck.
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
