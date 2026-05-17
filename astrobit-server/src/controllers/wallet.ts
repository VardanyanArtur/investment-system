import { Request, Response } from "express";
import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { User } from "../models/User";
import { round2 } from "../utils/generateRefCode";

const REFERRAL_BONUS_PCT = 0.10;

// req.userId — предполагается, что ставишь из auth middleware
export const deposit = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string; // заполни из своего JWT мидлвара
  const { amount } = req.body;

  const amt = Number(amount);
  if (!userId || !Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ success: false, message: "Неверная сумма или нет userId" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    // кошелек реферала (того, кто платит)
    const myWallet = await Wallet.findOneAndUpdate(
      { user: user._id },
      { $setOnInsert: { user: user._id } },
      { upsert: true, new: true, session }
    );

    // 1) депозит 100%
    myWallet.depositBalance = round2(myWallet.depositBalance + amt);

    // 2) клиенту 10% в earned
    const clientBonus = round2(amt * REFERRAL_BONUS_PCT);
    myWallet.earnedBalance = round2(myWallet.earnedBalance + clientBonus);

    await myWallet.save({ session });

    // 3) пригласившему 10% в referralBalance (если есть referredBy)
    let ownerBonusApplied = false;
    if (user.referredBy) {
      const ownerWallet = await Wallet.findOneAndUpdate(
        { user: user.referredBy },
        { $setOnInsert: { user: user.referredBy } },
        { upsert: true, new: true, session }
      );

      const ownerBonus = round2(amt * REFERRAL_BONUS_PCT);
      ownerWallet.referralBalance = round2(ownerWallet.referralBalance + ownerBonus);
      await ownerWallet.save({ session });
      ownerBonusApplied = true;
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Депозит зачислен",
      data: {
        depositAdded: amt,
        clientBonus,
        ownerBonusApplied,
      },
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error(e);
    return res.status(500).json({ success: false, message: "Ошибка депозита" });
  }
};
