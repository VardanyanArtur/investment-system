import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export type VipPlan = {
  _id: string;
  title: string;
  min: number;
  max: number | null;
  daily: string;
  cashback: string;
  icon: string;      // "Shield" | "Zap" | "TrendingUp" | "Star"
  items: string[];
  delay: number;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

type UseVipPlansResult = {
  data: VipPlan[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useVipPlans(): UseVipPlansResult {
  const [data, setData] = useState<VipPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get<VipPlan[]>(`${API_BASE}/api/vip`);
      // sort by min just in case
      const sorted = [...data].sort((a, b) => a.min - b.min);
      setData(sorted);
    } catch (e: any) {
      setError("Failed to load VIP plans");
      // eslint-disable-next-line no-console
      console.error("VIP plans fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let didCancel = false;
    fetchPlans();
    return () => {
      didCancel = true;
    };
  }, [fetchPlans]);

  return { data, loading, error, refetch: fetchPlans };
}
