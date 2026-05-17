import axiosInstance from "./axios";
import type { ID, User, UserDetails, Wallet, Transaction, GameEntry, Referral } from "../types/domain";

interface FetchUsersParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  emailVerified?: boolean;
  from?: string;
  to?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const fetchUsers = async (params: FetchUsersParams): Promise<PaginatedResponse<User>> => {
  const response = await axiosInstance.get("/api/admin/users", { params });
  console.log(response);
  
  return response.data;
};

export const fetchUserById = async (id: ID): Promise<UserDetails> => {
  const response = await axiosInstance.get(`/api/admin/users/${id}`);
  return response.data;
};

export const createUser = async (payload: {
  name: string;
  email: string;
  password: string;
  emailVerified?: boolean;
}): Promise<User> => {
  const response = await axiosInstance.post("/api/admin/users", payload);
  return response.data;
};

export const updateUser = async (
  id: ID,
  payload: Partial<Pick<User, "name" | "email" | "emailVerified">>
): Promise<User> => {
  const response = await axiosInstance.patch(`/api/admin/users/${id}`, payload);
  return response.data;
};

export const deleteUser = async (id: ID): Promise<void> => {
  await axiosInstance.delete(`/api/admin/users/${id}`);
};

export const fetchWallet = async (id: ID): Promise<Wallet> => {
  const response = await axiosInstance.get(`/api/admin/users/${id}/wallet`);
  return response.data;
};

export const adjustBalance = async (
  id: ID,
  payload: {
    depositDelta?: number;
    earnedDelta?: number;
    referralDelta?: number;
    reason: string;
  }
): Promise<Wallet> => {
  const response = await axiosInstance.post(`/api/admin/users/${id}/balance-adjust`, payload);
  return response.data;
};

export const fetchUserDeposits = async (
  id: ID,
  params: { page?: number; limit?: number; from?: string; to?: string }
): Promise<PaginatedResponse<Transaction>> => {
  const response = await axiosInstance.get(`/api/admin/users/${id}/deposits`, { params });
  return response.data;
};

export const fetchUserGames = async (
  id: ID,
  params: { page?: number; limit?: number; from?: string; to?: string }
): Promise<PaginatedResponse<GameEntry>> => {
  const response = await axiosInstance.get(`/api/admin/users/${id}/games`, { params });
  return response.data;
};

export const fetchUserReferrals = async (
  id: ID
): Promise<{ self: Referral; level1: User[]; level2: User[] }> => {
  const response = await axiosInstance.get(`/api/admin/users/${id}/referrals`);
  return response.data;
};
