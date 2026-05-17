import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Withdraw } from "../models/Withdraw";
import { Wallet } from "../models/Wallet";

const AdminListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["pending", "success", "canceled"]).optional(),
  user: z.string().optional(), // userId
  from: z.string().datetime().optional(), // ISO
  to: z.string().datetime().optional(),   // ISO
});

export const adminListWithdraws = async (req: Request, res: Response) => {
  try {
    const parsed = AdminListSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.message });
    }
    const { page, limit, status, user, from, to } = parsed.data;

    const filter: any = {};
    if (status) filter.status = status;
    if (user) filter.user = new mongoose.Types.ObjectId(user);
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      Withdraw.find(filter)
        .populate("user", "name email")
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
    return res.status(500).json({ success: false, message: "Ошибка при получении заявок" });
  }
};

export const adminSuccessWithdraw = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(id);
    

    const upd = await Withdraw.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "success" } },
      { new: true }
    );

    if (!upd) {
      return res.status(400).json({ success: false, message: "Заявка не найдена или не в статусе pending" });
    }

    // Деньги уже были списаны при создании — ничего больше делать не нужно
    return res.json({ success: true, data: { message: "Заявка подтверждена", withdraw: upd } });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: "Ошибка при подтверждении заявки" });
  }
};

export const adminCancelWithdraw = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Отмена АДМИНОМ — БЕЗ возврата
    const upd = await Withdraw.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "canceled" } },
      { new: true }
    );

    if (!upd) {
      return res.status(400).json({ success: false, message: "Заявка не найдена или не в статусе pending" });
    }

    return res.json({ success: true, data: { message: "Заявка отменена администратором (без возврата)", withdraw: upd } });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: "Ошибка при отмене заявки" });
  }
};
