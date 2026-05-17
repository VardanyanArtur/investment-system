import axiosInstance from "./axios";
import type { ID, Withdraw } from "../types/domain";

interface FetchWithdrawsParams {
  page?: number;
  limit?: number;
  status?: "pending" | "success" | "canceled";
  user?: ID;
  from?: string;
  to?: string;
}

interface WithdrawsResponse {
  success: boolean;
  data: {
    items: Withdraw[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface WithdrawActionResponse {
  success: boolean;
  data: {
    message: string;
    withdraw: Withdraw;
  };
}

export const fetchWithdraws = async (params: FetchWithdrawsParams): Promise<WithdrawsResponse> => {
  const response = await axiosInstance.get("/api/admin/withdraws", { params });
  return response.data;
};

export const approveWithdraw = async (id: ID): Promise<WithdrawActionResponse> => {
  const response = await axiosInstance.post(`/api/admin/withdraw/${id}/success`);
  return response.data;
};

export const cancelWithdraw = async (id: ID): Promise<WithdrawActionResponse> => {
  const response = await axiosInstance.post(`/api/admin/withdraw/${id}/cancel`);
  return response.data;
};
