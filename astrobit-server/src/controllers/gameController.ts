import { Request, Response } from "express";
import { Wallet } from "../models/Wallet";
import { VipPlan } from "../models/VipPlan";
import { GameBonusHistory } from "../models/GameBonusHistory";

// Помощник: возвращает начало текущего окна (20:00 AMT) в UTC-времени
function getWindowStartUTC(nowUTC: Date): Date {
  const AMT_OFFSET_HOURS = 4; // Asia/Yerevan = UTC+4 (без учёта DST)
  const nowAMT = new Date(nowUTC.getTime() + AMT_OFFSET_HOURS * 60 * 60 * 1000);

  const windowStartAMT = new Date(nowAMT);
  windowStartAMT.setHours(20, 0, 0, 0); // 20:00:00.000 AMT сегодня

  // Если ещё не наступило 20:00 AMT сегодня, значит окно началось вчера в 20:00 AMT
  if (nowAMT.getTime() < windowStartAMT.getTime()) {
    windowStartAMT.setDate(windowStartAMT.getDate() - 1);
  }

  // Переводим назад в UTC
  return new Date(windowStartAMT.getTime() - AMT_OFFSET_HOURS * 60 * 60 * 1000);
}

// Аккуратно парсим проценты из полей вида "5", "5%", "5% Daily"
function parsePercent(s: string): number {
  const m = String(s).match(/[\d.]+/);
  const n = m ? parseFloat(m[0]) : 0;
  return isFinite(n) ? n / 100 : 0;
}

export const claimDailyBonus = async (req: Request & { userId?: string }, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const wallet = await Wallet.findOne({ user: req.userId });
    if (!wallet) return res.status(404).json({ success: false, message: "Wallet not found" });

    const nowUTC = new Date();
    const windowStartUTC = getWindowStartUTC(nowUTC);

    // ✅ Проверяем, получал ли ПОсЛЕ начала текущего окна (с 20:00 AMT)
    if (wallet.lastDailyBonusAt && wallet.lastDailyBonusAt >= windowStartUTC) {
      return res.status(400).json({ success: false, message: "Daily bonus already claimed in this window" });
    }

    // ✅ Определяем VIP по depositBalance в рамках min/max (max может быть null = без верхней границы)
    const balance = wallet.depositBalance ?? 0;
    const vip = await VipPlan.findOne({
      min: { $lte: balance },
      $or: [
        { max: { $gte: balance } },
        { max: null }
      ]
    });

    if (!vip) {
      return res.status(400).json({ success: false, message: "No VIP plan for your deposit balance" });
    }

    // ✅ Берём % из vip.daily (например "5% Daily") и считаем бонус от depositBalance
    const dailyPct = parsePercent(vip.daily);         // 0.05
    const bonus = Math.max(0, balance * dailyPct);    // не даём уйти в минус

    // ✅ Начисляем и фиксируем «последний бонус» текущим временем (UTC)
    wallet.earnedBalance = (wallet.earnedBalance ?? 0) + bonus;
    wallet.lastDailyBonusAt = nowUTC;
    await wallet.save();

    // ✅ История
    await GameBonusHistory.create({
      user: req.userId,
      vipPlan: vip._id,
      amount: bonus,
      date: nowUTC
    });

    return res.json({
      success: true,
      message: `Daily bonus claimed: +${bonus}`,
      bonus,
      vip: { id: vip._id, title: vip.title, daily: vip.daily },
      earnedBalance: wallet.earnedBalance,
      windowStartUTC
    });
  } catch (e) {
    console.error("claimDailyBonus error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Оставляю без изменений, как ранее
export const getBonusHistory = async (req: Request & { userId?: string }, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const history = await GameBonusHistory.find({ user: req.userId })
      .populate("vipPlan", "title daily")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GameBonusHistory.countDocuments({ user: req.userId });

    return res.json({
      success: true,
      page,
      total,
      totalPages: Math.ceil(total / limit),
      history
    });
  } catch (e) {
    console.error("getBonusHistory error:", e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
