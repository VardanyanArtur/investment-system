/* eslint-disable @typescript-eslint/no-explicit-any */
import { register } from "module";
import axiosInstance from "./axiosInstance";

export const userApi = {
  getMe: async () => {
    const { data } = await axiosInstance.get("/user/me");
    return data;
  },
  register: async (form: any) => {
    const { data } = await axiosInstance.post("/auth/register", form);
    return data;
  },
  login: async (form: any) => {
    const { data } = await axiosInstance.post("/auth/login", form);
    return data;
  },
  verify: async (form: any) => {
    const { data } = await axiosInstance.post("/auth/verify", form);
    return data;
  },

};

export const depositApi = {
  create: async (amount: number) => {
    const { data } = await axiosInstance.post("/deposit/create", { amount });
    return data; // success, invoiceUrl, paymentId
  },
  getWallet: async () => {
    const { data } = await axiosInstance.get("/deposit/wallet");
    return data;
  },
  getHistory: async (page = 1, limit = 10) => {
    const { data } = await axiosInstance.get(
      `/me/history?page=${page}&limit=${limit}`
    );
    return data; 
    // expected backend response:
    // { success, page, total, totalPages, history: [ { paymentId, status, priceAmount, date, ... } ] }
  },
};


export const vipApi = {
  getVipPlans: async () => {
    const { data } = await axiosInstance.get("/vip");
    return data;
  },
};

export const refApi = {
  getRefMembers: async () => {
    const { data } = await axiosInstance.get("/me/referrals");
    return data;
  },
  getRefMembers2: async () => {
    const { data } = await axiosInstance.get("/me/referrals/tree");
    return data;
  },
  getRefLink: async () => {
    const { data } = await axiosInstance.get("/me/referral/link");
    return data;
  },
};

// --- NEW: gameApi (daily bonus) ---
export type GameHistoryItem = {
  _id: string;
  amount: number;
  date: string;
  vipPlan?: { _id: string; title: string; daily: string };
};

export const gameApi = {
  claimDaily: async () => {
    const { data } = await axiosInstance.post("/game/claim");
    // expected: { success, message, bonus, vip:{id,title,daily}, earnedBalance, windowStartUTC? }
    return data as {
      success: boolean;
      message?: string;
      bonus: number;
      vip: { id: string; title: string; daily: string };
      earnedBalance: number;
      windowStartUTC?: string;
    };
  },

  history: async (page = 1, limit = 10) => {
    const { data } = await axiosInstance.get(`/game/history?page=${page}&limit=${limit}`);
    // expected: { success, page, total, totalPages, history }
    return data as {
      success: boolean;
      page: number;
      total: number;
      totalPages: number;
      history: GameHistoryItem[];
    };
  },
};