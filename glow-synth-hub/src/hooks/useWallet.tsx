import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export type WalletDTO = {
  _id: string;
  user: string;
  currency: "USD";
  depositBalance: number;
  earnedBalance: number;
  referralBalance: number;
  createdAt: string;
  updatedAt: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type UseWalletParams = {
  token: string | null;
  enabled: boolean; // true если пользователь залогинен
};

type UseWalletResult = {
  data: WalletDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useWallet({ token, enabled }: UseWalletParams): UseWalletResult {
  const [data, setData] = useState<WalletDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    let didCancel = false;

    if (!enabled || !token) {
      setData(null);
      setLoading(false);
      setError(null);
      return () => { didCancel = true; };
    }

    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get<WalletDTO>(`${API_BASE}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` }, // (твой вариант)
      });
      if (!didCancel) setData(data);
    } catch (e: any) {
      if (!didCancel) setError("Не удалось загрузить кошелёк");
      // eslint-disable-next-line no-console
      console.error("Wallet fetch error:", e);
    } finally {
      if (!didCancel) setLoading(false);
    }

    return () => {
      didCancel = true;
    };
  }, [enabled, token]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { data, loading, error, refetch: fetchWallet };
}
