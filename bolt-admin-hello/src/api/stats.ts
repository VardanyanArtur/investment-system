import axiosInstance from "./axios";
import type { ID } from "../types/domain";

interface SummaryStats {
  totalUsers: number;
  totalDeposited: number;
  totalEarned: number;
  totalGames: number;
  topReferrers: Array<{ userId: ID; name: string; referrals: number }>;
}

export const fetchSummaryStats = async (params: {
  from?: string;
  to?: string;
}): Promise<SummaryStats> => {
  const response = await axiosInstance.get("/api/admin/stats/summary", { params });
  return response.data;
};
