import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Wallet } from "../models/Wallet";
import { Transaction } from "../models/Transaction";
import { Referral } from "../models/Referral";
// Если у тебя другая модель для игр — замени на правильный импорт
import { GameBonusHistory } from "../models/GameBonusHistory";
import { VipPlan } from "../models/VipPlan";

// ======== Schemas / Validators ========

const ListUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  sortBy: z.enum(["name", "email", "createdAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  emailVerified: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
  from: z.string().optional(), // YYYY-MM-DD
  to: z.string().optional(),   // YYYY-MM-DD
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  emailVerified: z.boolean().optional(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
});

const BalanceAdjustSchema = z.object({
  depositDelta: z.number().optional(),
  earnedDelta: z.number().optional(),
  referralDelta: z.number().optional(),
  reason: z.string().min(1),
});

const PaginatedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  from: z.string().optional(),
  to: z.string().optional(),
});
const VipCreateSchema = z.object({
  title: z.string().min(1),
  min: z.number(),
  max: z.number().nullable().optional(),
  daily: z.string().min(1),
  cashback: z.string().min(1),
  icon: z.string().min(1),
  items: z.array(z.string()).default([]),
  delay: z.number().default(0),
});

const VipUpdateSchema = VipCreateSchema.partial();
// ======== Helpers ========

function buildDateRangeFilter(from?: string, to?: string, field = "createdAt") {
  if (!from && !to) return {};
  const f: any = {};
  if (from) f.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) f.$lte = new Date(`${to}T23:59:59.999Z`);
  return { [field]: f };
}

function mapSort(sortBy?: string, sortDir?: "asc" | "desc") {
  if (!sortBy) return { createdAt: -1 };
  const dir = sortDir === "asc" ? 1 : -1;
  return { [sortBy]: dir };
}

async function ensureWallet(userId: mongoose.Types.ObjectId) {
  const existing = await Wallet.findOne({ user: userId });
  if (existing) return existing;
  return Wallet.create({
    user: userId,
    depositBalance: 0,
    earnedBalance: 0,
    referralBalance: 0,
  });
}

function pickUserFieldsForList(u: any) {
  // можно оставить как есть — фронт ожидает User целиком
  return u;
}

// ======== Controller Class ========

export class AdminController {
  // GET /api/admin/users
 public login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // 1) Проверка наличия полей
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email и пароль обязательны" });
    }

    // 2) Сравнение с .env
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ success: false, message: "Неверные данные" });
    }

    // 3) Генерация токена
  const expiresIn = process.env.JWT_EXPIRES || "7d";

  const token =  jwt.sign(
      { role: "admin", email },
    process.env.JWT_SECRET as jwt.Secret,
    { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
  );


    // 4) Ответ
    return res.json({
      success: true,
      token,
    });
  };

  public getUsers = async (req: Request, res: Response) => {
    try {
      const parsed = ListUsersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const { search, page, limit, sortBy, sortDir, emailVerified, from, to } = parsed.data;

      const filter: any = {};
      if (typeof emailVerified === "boolean") {
        filter.emailVerified = emailVerified;
      }
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      Object.assign(filter, buildDateRangeFilter(from, to, "createdAt"));

      const sort = mapSort(sortBy, sortDir);
      const skip = (page - 1) * limit;

      // Подтягиваем кошельки (минимально) для таблицы — опционально, можно убрать populate ради производительности
      const [items, total] = await Promise.all([
        User.find(filter).sort(sort as any).skip(skip).limit(limit).lean(),
        User.countDocuments(filter),
      ]);

      // Подклеиваем кошельки — фронт их показывает в таблице
      const userIds = items.map((u) => u._id);
      const wallets = await Wallet.find({ user: { $in: userIds } }).lean();
      const walletMap = new Map(wallets.map((w) => [w.user.toString(), w]));

      const data = items.map((u) => ({
        ...pickUserFieldsForList(u),
        wallet: walletMap.get(u._id.toString()) || {
          depositBalance: 0,
          earnedBalance: 0,
          referralBalance: 0,
        },
      }));

      return res.json({
        data,
        total,
        page,
        limit,
      });
    } catch (err) {
      console.error("getUsers error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // GET /api/admin/users/:id
public getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [
      wallet,
      referral,
      gamesCount,
      lastGame,
      totalDeposited,
      lastDeposit,
    ] = await Promise.all([
      // гарантируем, что кошелек есть
      ensureWallet(user._id),

      // реферальная запись
      Referral.findOne({ user: user._id }).lean(),

      // количество бонусов (игр)
      GameBonusHistory.countDocuments({ user: user._id }),

      // последняя игра по полю `date` (а не playedAt!)
      GameBonusHistory.findOne({ user: user._id })
        .sort({ date: -1 })
        .lean(),

      // сумма всех confirmed депозитов
      Transaction.aggregate([
        { $match: { user: user._id, type: "deposit", status: "confirmed" } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]),

      // дата последнего депозита
      Transaction.findOne({ user: user._id, type: "deposit", status: "confirmed" })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const deposited =
      Array.isArray(totalDeposited) && totalDeposited[0]?.sum
        ? totalDeposited[0].sum
        : 0;

    return res.json({
      ...user,
      wallet,
      referral,
      stats: {
        gamesCount,
        lastGameAt: lastGame?.date ?? null, // <--- ИСПРАВЛЕНО ТУТ
        totalDeposited: deposited,
        lastDepositAt: lastDeposit?.createdAt ?? null,
      },
    });
  } catch (err) {
    console.error("getUserById error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

  // POST /api/admin/users
  public createUser = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const parsed = CreateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        await session.abortTransaction();
        return res.status(400).json({ message: parsed.error.message });
      }
      const { name, email, password, emailVerified } = parsed.data;

      const existing = await User.findOne({ email }).session(session);
      if (existing) {
        await session.abortTransaction();
        return res.status(409).json({ message: "Email already registered" });
      }

      const hash = await bcrypt.hash(password, 10);

      const user = await User.create(
        [
          {
            name,
            email,
            password: hash,
            emailVerified: !!emailVerified,
          },
        ],
        { session }
      ).then((r) => r[0]);

      await Wallet.create(
        [
          {
            user: user._id,
            depositBalance: 0,
            earnedBalance: 0,
            referralBalance: 0,
          },
        ],
        { session }
      );

      // реф. запись (если у тебя другая логика — поправь)
      const code = `${Date.now()}-${user._id.toString().slice(-6)}`;
      await Referral.create(
        [
          {
            user: user._id,
            code,
            invitedUsers: [],
            invitedUsers2: [],
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return res.status(201).json(user.toObject());
    } catch (err) {
      console.error("createUser error", err);
      await session.abortTransaction();
      return res.status(500).json({ message: "Internal server error" });
    } finally {
      session.endSession();
    }
  };

  // PATCH /api/admin/users/:id
  public updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }

      const updated = await User.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
      if (!updated) return res.status(404).json({ message: "User not found" });

      return res.json(updated);
    } catch (err) {
      console.error("updateUser error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // DELETE /api/admin/users/:id
  public deleteUser = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid user id" });
      }

      const user = await User.findById(id).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: "User not found" });
      }

      await Promise.all([
        Wallet.deleteOne({ user: user._id }).session(session),
        Referral.deleteOne({ user: user._id }).session(session),
        Transaction.deleteMany({ user: user._id }).session(session),
        GameBonusHistory.deleteMany({ user: user._id }).session(session),
      ]);

      await user.deleteOne({ session });

      await session.commitTransaction();
      return res.json({ success: true });
    } catch (err) {
      console.error("deleteUser error", err);
      await session.abortTransaction();
      return res.status(500).json({ message: "Internal server error" });
    } finally {
      session.endSession();
    }
  };

  // GET /api/admin/users/:id/wallet
  public getWallet = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      const user = await User.findById(id).lean();
      if (!user) return res.status(404).json({ message: "User not found" });

      const wallet = await ensureWallet(user._id);
      return res.json(wallet);
    } catch (err) {
      console.error("getWallet error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // POST /api/admin/users/:id/balance-adjust
  public adjustBalance = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Invalid user id" });
      }

      const parsed = BalanceAdjustSchema.safeParse(req.body);
      if (!parsed.success) {
        await session.abortTransaction();
        return res.status(400).json({ message: parsed.error.message });
      }
      const { depositDelta = 0, earnedDelta = 0, referralDelta = 0, reason } = parsed.data;

      const user = await User.findById(id).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: "User not found" });
      }

      const wallet = await ensureWallet(user._id);
      const w = await Wallet.findById(wallet._id).session(session);
      if (!w) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Wallet not found" });
      }

      w.depositBalance = (w.depositBalance ?? 0) + depositDelta;
      w.earnedBalance = (w.earnedBalance ?? 0) + earnedDelta;
      w.referralBalance = (w.referralBalance ?? 0) + referralDelta;

      // Можно валидировать, чтобы балансы не уходили в минус
      if (w.depositBalance < 0 || w.earnedBalance < 0 || w.referralBalance < 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Balance cannot be negative" });
      }

      await w.save({ session });

      await session.commitTransaction();
      return res.json(w.toObject());
    } catch (err) {
      console.error("adjustBalance error", err);
      await session.abortTransaction();
      return res.status(500).json({ message: "Internal server error" });
    } finally {
      session.endSession();
    }
  };

  // GET /api/admin/users/:id/deposits
  public getUserDeposits = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      const q = PaginatedQuerySchema.safeParse(req.query);
      if (!q.success) {
        return res.status(400).json({ message: q.error.message });
      }
      const { page, limit, from, to } = q.data;
      const skip = (page - 1) * limit;

      const filter: any = {
        user: new mongoose.Types.ObjectId(id),
      };
      Object.assign(filter, buildDateRangeFilter(from, to, "createdAt"));

      const [items, total] = await Promise.all([
        Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Transaction.countDocuments(filter),
      ]);

      return res.json({ data: items, total, page, limit });
    } catch (err) {
      console.error("getUserDeposits error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // GET /api/admin/users/:id/games
  public getUserGames = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      const q = PaginatedQuerySchema.safeParse(req.query);
      if (!q.success) {
        return res.status(400).json({ message: q.error.message });
      }
      const { page, limit, from, to } = q.data;
      const skip = (page - 1) * limit;

      const filter: any = { user: new mongoose.Types.ObjectId(id) };
      Object.assign(filter, buildDateRangeFilter(from, to, "playedAt"));

      const [items, total] = await Promise.all([
        GameBonusHistory.find(filter).sort({ playedAt: -1 }).skip(skip).limit(limit).lean(),
        GameBonusHistory.countDocuments(filter),
      ]);

      return res.json({ data: items, total, page, limit });
    } catch (err) {
      console.error("getUserGames error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // GET /api/admin/users/:id/referrals
  public getUserReferrals = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const self = await Referral.findOne({ user: id }).lean();

      let level1: any[] = [];
      let level2: any[] = [];

      if (self) {
        if (self.invitedUsers?.length) {
          level1 = await User.find({ _id: { $in: self.invitedUsers } })
            .sort({ createdAt: -1 })
            .lean();
        }
        if (self.invitedUsers2?.length) {
          level2 = await User.find({ _id: { $in: self.invitedUsers2 } })
            .sort({ createdAt: -1 })
            .lean();
        }
      }

      return res.json({ self, level1, level2 });
    } catch (err) {
      console.error("getUserReferrals error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

    // ===================== VIP CRUD =====================
  // GET /api/admin/vips
  public getVips = async (req: Request, res: Response) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (search) filter.title = { $regex: search, $options: "i" };

      const [items, total] = await Promise.all([
        VipPlan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        VipPlan.countDocuments(filter),
      ]);

      return res.json({ data: items, total });
    } catch (err) {
      console.error("getVips error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // GET /api/admin/vips/:id
  public getVipById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid vip id" });
      }
      const vip = await VipPlan.findById(id).lean();
      if (!vip) return res.status(404).json({ message: "Vip not found" });
      return res.json(vip);
    } catch (err) {
      console.error("getVipById error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // POST /api/admin/vips
  public createVip = async (req: Request, res: Response) => {
    try {
      const parsed = VipCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const created = await VipPlan.create(parsed.data);
      return res.status(201).json(created.toObject());
    } catch (err) {
      console.error("createVip error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // PATCH /api/admin/vips/:id
  public updateVip = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid vip id" });
      }
      const parsed = VipUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const updated = await VipPlan.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
      if (!updated) return res.status(404).json({ message: "Vip not found" });
      return res.json(updated);
    } catch (err) {
      console.error("updateVip error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // DELETE /api/admin/vips/:id
  public deleteVip = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid vip id" });
      }
      const deleted = await VipPlan.findByIdAndDelete(id).lean();
      if (!deleted) return res.status(404).json({ message: "Vip not found" });
      return res.json({ success: true });
    } catch (err) {
      console.error("deleteVip error", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
// GET /api/admin/stats/summary
public getSummaryStats = async (req: Request, res: Response) => {
  try {
    // 1) Total Users
    const totalUsersPromise = User.countDocuments();

    // 2) Total Deposited (все успешные депозиты)
    const totalDepositedPromise = Transaction.aggregate([
      { $match: { status: "finished" } },
      { $group: { _id: null, sum: { $sum: "$priceAmount" } } },
    ]);

    // 3) Total Earned (сумма earnedBalance во всех Wallet)
    const totalEarnedPromise = Wallet.aggregate([
      { $group: { _id: null, sum: { $sum: "$earnedBalance" } } },
    ]);

    // 4) Total Games (считаем GameBonusHistory)
    const totalGamesPromise = GameBonusHistory.countDocuments();

    // 5) Top Referrers (invitedUsers + invitedUsers2)
    const topReferrersPromise = Referral.aggregate([
      {
        $project: {
          user: 1,
          totalReferrals: {
            $add: [
              { $size: { $ifNull: ["$invitedUsers", []] } },
              { $size: { $ifNull: ["$invitedUsers2", []] } },
            ],
          },
        },
      },
      { $sort: { totalReferrals: -1 } },
      { $limit: 10 },
    ]);

    // Ждём все параллельно
    const [
      totalUsers,
      depositedAgg,
      earnedAgg,
      totalGames,
      topRefs,
    ] = await Promise.all([
      totalUsersPromise,
      totalDepositedPromise,
      totalEarnedPromise,
      totalGamesPromise,
      topReferrersPromise,
    ]);

    const totalDeposited = depositedAgg?.[0]?.sum || 0;
    const totalEarned = earnedAgg?.[0]?.sum || 0;

    // Получаем имена пользователей для topReferrers
    let topReferrers: Array<{ userId: string; name: string; referrals: number }> = [];

    if (topRefs && topRefs.length > 0) {
      const userIds = topRefs.map((r: any) => r.user);
      const users = await User.find({ _id: { $in: userIds } })
        .select({ _id: 1, name: 1 })
        .lean();

      const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

      topReferrers = topRefs.map((r: any) => ({
        userId: r.user.toString(),
        name: userMap.get(r.user.toString()) || "Unknown",
        referrals: r.totalReferrals,
      }));
    }

    return res.json({
      totalUsers,
      totalDeposited,
      totalEarned,
      totalGames,
      topReferrers,
    });
  } catch (err) {
    console.error("getSummaryStats error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

}



export const adminController = new AdminController();
