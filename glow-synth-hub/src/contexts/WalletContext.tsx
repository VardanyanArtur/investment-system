// src/contexts/WalletContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";

export type WalletDto = {
  _id?: string;
  user?: string;
  currency: string;                 // e.g. "USD"
  depositBalance: number;           // number
  earnedBalance: number;            // number
  referralBalance: number;          // number
  lastDailyBonusAt: string | null;  // ISO string or null
  createdAt?: string;
  updatedAt?: string;
};

type WalletContextValue = {
  wallet: WalletDto | null;
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { token, user } = useAuth();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState<boolean>(!!user);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!user || !token) {
      setWallet(null);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const { data } = await axiosInstance.get("/deposit/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API returns { success, wallet }
      const w: WalletDto =
        data?.data?.wallet ?? {
          currency: "USD",
          depositBalance: 0,
          earnedBalance: 0,
          referralBalance: 0,
          lastDailyBonusAt: null,
        };

      // ensure defaults
      setWallet({
        currency: w.currency ?? "USD",
        depositBalance: Number(w.depositBalance ?? 0),
        earnedBalance: Number(w.earnedBalance ?? 0),
        referralBalance: Number(w.referralBalance ?? 0),
        lastDailyBonusAt: w.lastDailyBonusAt ?? null,
        _id: w._id,
        user: w.user,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load wallet");
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        loading,
        error,
        refreshWallet: fetchWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
  return ctx;
};
