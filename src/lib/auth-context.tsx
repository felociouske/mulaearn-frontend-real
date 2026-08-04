import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, setTokens, clearTokens } from "@/lib/api";

export type Country = {
  id: number;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  is_international_bucket: boolean;
  activation_fee: string; // DRF serializes DecimalField as a string
};

export type User = {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  country: Country | null;
  referral_code: string;
  date_joined: string;
  is_activated: boolean;
  activated_at: string | null;
};

type RegisterPayload = {
  username: string;
  email: string;
  phone_number: string;
  password: string;
  country: number;
  referral_code?: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: { email?: string; phone_number?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const access = window.localStorage.getItem("easyearn_access");
    if (!access) {
      setIsLoading(false);
      return;
    }

    apiFetch<User>("/api/accounts/me/")
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const data = await apiFetch<{ access: string; refresh: string }>("/api/accounts/login/", {
      method: "POST",
      auth: false,
      body: { username, password },
    });
    setTokens(data.access, data.refresh);
    const me = await apiFetch<User>("/api/accounts/me/");
    setUser(me);
  }

  async function register(payload: RegisterPayload) {
    const data = await apiFetch<{ user: User; access: string; refresh: string }>("/api/accounts/register/", {
      method: "POST",
      auth: false,
      body: payload,
    });
    setTokens(data.access, data.refresh);
    setUser(data.user);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  async function refreshUser() {
    const me = await apiFetch<User>("/api/accounts/me/");
    setUser(me);
  }

  async function updateProfile(payload: { email?: string; phone_number?: string }) {
    const updated = await apiFetch<User>("/api/accounts/me/", {
      method: "PATCH",
      body: payload,
    });
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>");
  }
  return ctx;
}