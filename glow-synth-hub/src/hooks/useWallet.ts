// src/hooks/useWallet.ts
import { useMemo } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";

type UseWalletOpts = { token?: string | null; enabled?: boolean };

export const useWallet = ({ token, enabled = true }: UseWalletOpts) => {
  const { wallet, loading, error, refreshWallet } = useWalletContext();
  const { user } = useAuth();

  const data = useMemo(() => {
    if (!enabled || !user) return null;
    return wallet;
  }, [enabled, user, wallet]);

  return {
    data,
    loading: enabled ? loading : false,
    error: enabled ? error : null,
    refetch: refreshWallet,
  };
};

export type { WalletDto } from "@/contexts/WalletContext";
