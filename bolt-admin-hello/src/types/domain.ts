/* eslint-disable @typescript-eslint/no-explicit-any */
export type ID = string;

export interface User {
  _id: ID;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Wallet {
  _id: ID;
  user: ID;
  depositBalance: number;
  earnedBalance: number;
  referralBalance: number;
  updatedAt: string;
  createdAt: string;
}

export interface Referral {
  _id: ID;
  user: ID;
  code: string;
  invitedUsers: ID[];
  invitedUsers2: ID[];
  createdAt: string;
  updatedAt: string;
}

export interface VipPlan {
  _id: ID;
  title: string;
  min: number;
  max: number | null;
  daily: string;
  cashback: string;
  icon: string;
  items: string[];
  delay: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: ID;
  user: ID;
  type: "deposit" | "withdraw" | "bonus" | "adjustment";
  amount: number;
  currency?: string;
  status: "pending" | "confirmed" | "failed" | "canceled";
  meta?: Record<string, any>;
  createdAt: string;
  paymentId: number
}

export interface GameEntry {
  _id: ID;
  user: ID;
  title?: string;
  playedAt: string;
  result?: string;
}

export interface UserDetails extends User {
  wallet?: Wallet;
  referral?: Referral;
  stats?: {
    gamesCount: number;
    lastGameAt?: string;
    totalDeposited: number;
    lastDepositAt?: string;
  };
}

export interface Withdraw {
  _id: ID;
  user: {
    _id: ID;
    name: string;
    email: string;
  };
  amount: number;
  status: "pending" | "success" | "canceled";
  createdAt: string;
  updatedAt: string;
}
