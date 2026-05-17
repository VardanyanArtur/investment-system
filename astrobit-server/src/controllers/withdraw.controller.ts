import { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Wallet } from "../models/Wallet";
import { Withdraw } from "../models/Withdraw";
import { AuthRequest } from "../middleware/auth";

const CreateWithdrawSchema = z.object({
  amountEarned: z.number().positive().min(1),
});

const PaginateSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "success", "canceled"]).optional(),
});

const HOURS_24_MS = 24 * 60 * 60 * 1000;

export const createWithdraw = async (req: AuthRequest, res: Response) => {
  console.log(req.body);

  try {
    if (!req.userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const { amountReferal } = req.body;
    const parsed = CreateWithdrawSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.message });
    }
    const { amountEarned } = parsed.data;
    const { walletAddress, walletType } = req.body;
    // Проверка 24 часов по последней заявке (любой статус)
    const last = await Withdraw.findOne({ user: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    if (last && Date.now() - new Date(last.createdAt).getTime() < HOURS_24_MS) {
      return res.status(429).json({
        success: false,
        message: "Вывод можно делать только раз в 24 часа. Попробуйте позже.",
      });
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Списание с earnedBalance атомарно: проверяем, что хватает средств
      const updated = await Wallet.findOneAndUpdate(
        { user: req.userId, earnedBalance: { $gte: amountEarned } },
        {
          $inc: {
            earnedBalance: -amountEarned,
            referralBalance: -amountReferal,
          },
        },
        { new: true, session }
      );

      if (!updated) {
        throw new Error("Недостаточно средств на earnedBalance");
      }

      await Withdraw.create(
        [
          {
            user: new mongoose.Types.ObjectId(req.userId),
            amountReferal,
            amountEarned,
            walletAddress,
            walletType,
            status: "pending",
          },
        ],
        { session }
      );
    });

    return res.json({
      success: true,
      data: { message: "Заявка на вывод создана" },
    });
  } catch (err: any) {
    const msg =
      err?.message === "Недостаточно средств на earnedBalance"
        ? err.message
        : "Ошибка при создании вывода";
    return res.status(400).json({ success: false, message: msg });
  }
};

export const cancelMyWithdraw = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    const withdraw = await Withdraw.findById(id);
    if (!withdraw || String(withdraw.user) !== req.userId) {
      return res
        .status(404)
        .json({ success: false, message: "Заявка не найдена" });
    }
    if (withdraw.status !== "pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Можно отменить только заявку в статусе pending",
        });
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // 1) Обновить статус на canceled
      const upd = await Withdraw.findOneAndUpdate(
        { _id: withdraw._id, status: "pending" },
        { $set: { status: "canceled" } },
        { new: true, session }
      );
      if (!upd) {
        throw new Error("Заявка уже обновлена");
      }

      // 2) ВОЗВРАТ средств пользователю (так как отменил сам клиент)
      await Wallet.updateOne(
        { user: withdraw.user },
        {
          $inc: {
            earnedBalance: withdraw.amountEarned,
            referralBalance: withdraw.amountReferal,
          },
        },
        { session }
      );
    });

    return res.json({
      success: true,
      data: { message: "Заявка отменена, средства возвращены" },
    });
  } catch (err: any) {
    return res
      .status(400)
      .json({
        success: false,
        message: err?.message || "Ошибка при отмене заявки",
      });
  }
};

export const getMyWithdraws = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const parsed = PaginateSchema.safeParse(req.query);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: parsed.error.message });
    }
    const { page, limit, status } = parsed.data;

    const filter: any = { user: req.userId };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Withdraw.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Withdraw.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, message: "Ошибка при получении заявок" });
  }
};
