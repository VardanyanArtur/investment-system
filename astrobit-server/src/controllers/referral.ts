import { Request, Response } from "express";
import { Referral } from "../models/Referral";
import { User } from "../models/User";
import { Wallet } from "../models/Wallet";

const SITE_URL = process.env.SITE_URL || "https://site.com";

export const getMyReferralLink = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ success: false, message: "Не авторизован" });

  const ref = await Referral.findOne({ user: userId });
  if (!ref) return res.status(404).json({ success: false, message: "Реф-код не найден" });

  const link = `${SITE_URL}/register?ref=${ref.code}`;
  return res.json({ success: true, code: ref.code, link });
};

export const getReferralStats = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  if (!userId) return res.status(401).json({ success: false, message: "Не авторизован" });

  const ref = await Referral.findOne({ user: userId }).populate("invitedUsers", "name email createdAt");
  const wallet = await Wallet.findOne({ user: userId });

  return res.json({
    success: true,
    invitedCount: ref?.invitedUsers?.length || 0,
    invitedUsers: ref?.invitedUsers || [],
    referralBalance: wallet?.referralBalance || 0,
  });
};
