import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import * as api from "../../api/vips";
import type { ID } from "../../types/domain";

export const useVipsTable = (params: Parameters<typeof api.fetchVips>[0]) => {
  return useQuery({
    queryKey: ["vips", params],
    queryFn: () => api.fetchVips(params),
  });
};

export const useVipDetails = (id: ID) => {
  return useQuery({
    queryKey: ["vip", id],
    queryFn: () => api.fetchVipById(id),
    enabled: !!id,
  });
};

export const useCreateVip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createVip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vips"] });
      notification.success({ message: "VIP Plan created successfully" });
    },
  });
};

export const useUpdateVip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: ID; data: Parameters<typeof api.updateVip>[1] }) =>
      api.updateVip(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vips"] });
      queryClient.invalidateQueries({ queryKey: ["vip", variables.id] });
      notification.success({ message: "VIP Plan updated successfully" });
    },
  });
};

export const useDeleteVip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteVip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vips"] });
      notification.success({ message: "VIP Plan deleted successfully" });
    },
  });
};
