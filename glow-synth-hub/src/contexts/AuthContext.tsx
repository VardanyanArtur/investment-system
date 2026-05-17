import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt?: string;
  balance?: Record<string, number>; // добавил balance, раз ты используешь в Dashboard
  walletAddress?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://localhost:3001";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // headers для refreshMe (использует текущее состояние token)
  const headers = useMemo(() => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // ✅ Загружаем user по текущему token (при старте приложения)
  const refreshMe = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/me`, { headers });
      const data = await res.json();

      if (res.ok && data?.success && data?.user) {
        setUser(data.user as User);
      } else {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.log(error);
      
    } finally {
      setLoading(false);
    }
  };

  // ✅ ВАЖНО: login теперь СРАЗУ получает user (без refresh страницы!)
  const login = async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken); // обновляем token state

    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newToken}`, // ✅ используем новый token сразу!
        },
      });

      const data = await res.json();

      if (res.ok && data?.success && data?.user) {
        setUser(data.user as User);
      } else {
        throw new Error("Failed to load user");
      }
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
