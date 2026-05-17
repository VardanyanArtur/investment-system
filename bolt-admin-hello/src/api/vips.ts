import axiosInstance from "./axios";
import type { ID, VipPlan } from "../types/domain";

interface FetchVipsParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const fetchVips = async (params: FetchVipsParams): Promise<PaginatedResponse<VipPlan>> => {
  const response = await axiosInstance.get("/api/admin/vips", { params });
  return response.data;
};

export const fetchVipById = async (id: ID): Promise<VipPlan> => {
  const response = await axiosInstance.get(`/api/admin/vips/${id}`);
  return response.data;
};

export const createVip = async (
  payload: Omit<VipPlan, "_id" | "createdAt" | "updatedAt">
): Promise<VipPlan> => {
  const response = await axiosInstance.post("/api/admin/vips", payload);
  return response.data;
};

export const updateVip = async (
  id: ID,
  payload: Partial<Omit<VipPlan, "_id" | "createdAt" | "updatedAt">>
): Promise<VipPlan> => {
  const response = await axiosInstance.patch(`/api/admin/vips/${id}`, payload);
  return response.data;
};

export const deleteVip = async (id: ID): Promise<void> => {
  await axiosInstance.delete(`/api/admin/vips/${id}`);
};
