import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { EmailCode } from "../models/EmailCode";
import { sendEmail } from "../utils/sendEmail";
import { emailCodeTemplate } from "../config/emailTemplates";
import { generateNumericCode } from "../utils/generateCode";
import { generateReferralCode } from "../utils/generateRefCode";
import { Referral } from "../models/Referral";
import { Wallet } from "../models/Wallet";
import mongoose from "mongoose";
import { Transaction } from "../models/Transaction";
import { VipPlan } from "../models/VipPlan";
import { GameBonusHistory } from "../models/GameBonusHistory";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const VerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
const signJwt = (userId: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");

  const expiresIn = process.env.JWT_EXPIRES || "7d";

  return jwt.sign(
    { sub: userId },
    secret as jwt.Secret,
    { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] }
  );
};

/**
 * 1) POST /auth/register
 * body: { name, email, password }
 * → создаёт пользователя, генерирует 6-значный код, шлёт на email
 */
export const register = async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
if (!parsed.success) {
  const firstError = parsed.error.issues[0];

  return res.status(400).json({
    success: false,
    field: firstError.path.join('.'),
    message: firstError.message,
  });
}


  const { name, email, password } = parsed.data;
  const refCodeFromQuery = typeof req.query.ref === "string" ? req.query.ref : undefined;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ success: false, message: "Email уже зарегистрирован" });

  const hash = await bcrypt.hash(password, 10);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1) создаём пользователя
    const user = await User.create([{ name, email, password: hash, emailVerified: false }], { session }).then(r => r[0]);

    // 2) создаём кошелек (0 балансов)
    await Wallet.create([{ user: user._id }], { session });

    // 3) создаём ЕГО собственную реф-ссылку (владелец)
    const myRefCode = generateReferralCode(user._id.toString());
    await Referral.create([{ user: user._id, code: myRefCode, invitedUsers: [] }], { session });

    // 4) если пришёл по чужой рефке в ?ref=
    if (refCodeFromQuery) {
      const owner = await Referral.findOne({ code: refCodeFromQuery }).session(session);

      if (owner && owner.user.toString() !== user._id.toString()) {

        // 1 уровень
        user.referredBy = owner.user;

        // Проверяем, был ли у owner свой пригласитель
        const inviter = await User.findById(owner.user).session(session);
        if (inviter?.referredBy) {
          // 2 уровень = пригласитель моего пригласителя
          user.referredBy2 = inviter.referredBy;
        }

        await user.save({ session });

        // добавляем в 1 уровень список (как раньше)
        // У owner добавляем уровень 1
        await Referral.updateOne(
          { user: owner.user },
          { $addToSet: { invitedUsers: user._id } },
          { session }
        );

        // У owner.referredBy добавляем уровень 2
        if (user.referredBy2) {
          await Referral.updateOne(
            { user: user.referredBy2 },
            { $addToSet: { invitedUsers2: user._id } },
            { session }
          );
        }

      }
    }


    // 5) почтовая верификация (как у тебя)
    await EmailCode.deleteMany({ user: user._id }).session(session);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
    await EmailCode.create([{ user: user._id, code, expiresAt }], { session });

    await session.commitTransaction();
    session.endSession();

    await sendEmail(email, "Код подтверждения", emailCodeTemplate(code, name));

    return res.json({
      success: true,
      message: "Код подтверждения отправлен на email",
      referralCode: myRefCode,                 // код пользователя (на фронте соберёшь ссылку)
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error(e);
    return res.status(500).json({ success: false, message: "Ошибка регистрации" });
  }
};
/**
 * 2) POST /auth/verify
 * body: { email, code }
 * → подтверждает почту по коду
 */
export const verify = async (req: Request, res: Response) => {
  const parsed = VerifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });

  const { email, code } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "Пользователь не найден" });
  if (user.emailVerified) return res.json({ success: true, message: "Email уже подтвержден" });

  const rec = await EmailCode.findOne({ user: user._id, code });
  if (!rec) return res.status(400).json({ success: false, message: "Неверный код" });
  if (rec.expiresAt < new Date()) return res.status(400).json({ success: false, message: "Код просрочен" });

  user.emailVerified = true;
  await user.save();

  await EmailCode.deleteMany({ user: user._id }); // гасим все коды

  return res.json({ success: true, message: "Email успешно подтвержден" });
};

/**
 * 3) POST /auth/login
 * body: { email, password }
 * → проверка пароля и emailVerified, выдача JWT
 */
export const login = async (req: Request, res: Response) => {
  const {email , password} = req.body
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "Пользователь не найден" });
  if (!user.emailVerified) return res.status(400).json({ success: false, message: "Email не подтвержден" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ success: false, message: "Неверный email или пароль" });

  const token = signJwt(user.id);
  return res.json({ success: true, token });
};

/**
 * 4) GET /auth/me
 * headers: Authorization: Bearer <JWT>
 * → возвращает профиль
 */
export const me = async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  const user = await User.findById(req.userId).select("_id name email emailVerified createdAt");
  return res.json({ success: true, user });
};

export const getWallet = async (req: Request & { userId?: string }, res: Response) => {
  const wallet = await Wallet.findOne({ user: req.userId });
  res.json({ success: true, wallet });
};

export const getReferrals = async (req: Request & { userId?: string }, res: Response) => {
  const refs = await User.find({ referredBy: req.userId })
    .select("_id name email createdAt");
  res.json({ success: true, referrals: refs });
};

export const getReferralTree = async (
  req: Request & { userId?: string },
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1) Находим реферальную запись текущего пользователя
    const referralDoc = await Referral.findOne({ user: req.userId });
    if (!referralDoc) {
      return res.json({
        success: true,
        tree: { level1: [], level2: [] },
      });
    }

    const firstLevelIds = referralDoc.invitedUsers || [];
    const secondLevelIds = referralDoc.invitedUsers2 || [];

    // Загружаем сами user'ов
    const level1Users = await User.find({ _id: { $in: firstLevelIds } });
    const level2Users = await User.find({ _id: { $in: secondLevelIds } });

    // 2) Подготовка функции для получения детальной информации
    const buildUserData = async (user: any) => {
      const wallet = await Wallet.findOne({ user: user._id });
      const deposit = wallet?.depositBalance || 0;

      const gamesCount = await GameBonusHistory.countDocuments({ user: user._id });

      let vip = "No VIP";
      const vipPlan = await VipPlan.findOne({
        min: { $lte: deposit },
        $or: [
          { max: { $gte: deposit } },
          { max: null },
        ],
      });

      if (vipPlan) {
        vip = vipPlan.title;
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        deposit,
        games: gamesCount,
        vip,
      };
    };

    // 3) Собираем результаты
    const level1 = await Promise.all(level1Users.map(buildUserData));
    const level2 = await Promise.all(level2Users.map(buildUserData));

    return res.json({
      success: true,
      tree: {
        level1,
        level2,
      },
    });
  } catch (error) {
    console.error("Error in getReferralTree", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRefLink = async (req: Request & { userId?: string }, res: Response) => {
  const link = await Referral
    .findOne({ user: req.userId })
  res.json({ success: true, data: link });
};

export const getTransactions = async (req: Request & { userId?: string }, res: Response) => {
  const txs = await Transaction
    .find({ user: req.userId })
    .sort({ createdAt: -1 });
  res.json({ success: true, transactions: txs });
};

export const getDepositHistory = async (
  req: Request & { userId?: string },
  res: Response
) => {
  if (!req.userId)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const deposits = await Transaction.find({
    user: req.userId,
  }).sort({ createdAt: -1 });

  return res.json({ success: true, deposits });
};
