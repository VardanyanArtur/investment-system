import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import * as api from "../../api/users";
import type { ID } from "../../types/domain";

export const useUsersTable = (params: Parameters<typeof api.fetchUsers>[0]) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => api.fetchUsers(params),
  });
};

export const useUserDetails = (id: ID) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => api.fetchUserById(id),
    enabled: !!id,
  });
};

export const useWallet = (id: ID) => {
  return useQuery({
    queryKey: ["wallet", id],
    queryFn: () => api.fetchWallet(id),
    enabled: !!id,
  });
};

export const useUserDeposits = (id: ID, params: Parameters<typeof api.fetchUserDeposits>[1]) => {
  return useQuery({
    queryKey: ["userDeposits", id, params],
    queryFn: () => api.fetchUserDeposits(id, params),
    enabled: !!id,
  });
};

export const useUserGames = (id: ID, params: Parameters<typeof api.fetchUserGames>[1]) => {
  return useQuery({
    queryKey: ["userGames", id, params],
    queryFn: () => api.fetchUserGames(id, params),
    enabled: !!id,
  });
};

export const useUserReferrals = (id: ID) => {
  return useQuery({
    queryKey: ["userReferrals", id],
    queryFn: () => api.fetchUserReferrals(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      notification.success({ message: "User created successfully" });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: ID; data: Parameters<typeof api.updateUser>[1] }) =>
      api.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      notification.success({ message: "User updated successfully" });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      notification.success({ message: "User deleted successfully" });
    },
  });
};

export const useAdjustBalance = (id: ID) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof api.adjustBalance>[1]) =>
      api.adjustBalance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      notification.success({ message: "Balance adjusted successfully" });
    },
  });
};
