import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  demoLogin: () => Promise<boolean>;
  register: (email: string, pass: string, name: string, org: string, role: string) => Promise<boolean>;
  logout: () => void;
  updateOnboardingStatus: (completed: boolean) => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("freshroute_jwt"));
  const [loading, setLoading] = useState<boolean>(true);

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    const initUser = async () => {
      if (token) {
        try {
          const res = await authFetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch {
          // Offline or network error
        }
      }
      setLoading(false);
    };
    initUser();
  }, [token]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem("freshroute_jwt", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const demoLogin = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/demo-login", { method: "POST" });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem("freshroute_jwt", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (email: string, pass: string, name: string, org: string, role: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, full_name: name, organization: org, role })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem("freshroute_jwt", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("freshroute_jwt");
    setToken(null);
    setUser(null);
  };

  const updateOnboardingStatus = async (completed: boolean) => {
    if (user) {
      setUser({ ...user, has_completed_onboarding: completed });
    }
    try {
      await authFetch("/api/auth/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_completed_onboarding: completed })
      });
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      demoLogin,
      register,
      logout,
      updateOnboardingStatus,
      authFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
