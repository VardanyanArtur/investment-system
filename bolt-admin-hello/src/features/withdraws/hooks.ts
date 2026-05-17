import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import * as api from "../../api/withdraws";
import type { ID } from "../../types/domain";

export const useWithdrawsTable = (params: Parameters<typeof api.fetchWithdraws>[0]) => {
  return useQuery({
    queryKey: ["withdraws", params],
    queryFn: () => api.fetchWithdraws(params),
  });
};

export const useApproveWithdraw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.approveWithdraw(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["withdraws"] });
      notification.success({
        message: "Withdraw Approved",
        description: response.data.message,
      });
    },
  });
};

export const useCancelWithdraw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => api.cancelWithdraw(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["withdraws"] });
      notification.success({
        message: "Withdraw Canceled",
        description: response.data.message,
      });
    },
  });
};
