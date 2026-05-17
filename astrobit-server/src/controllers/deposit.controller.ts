import { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { nowpCreateInvoice } from "../services/nowpayments";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";

/** ====== CONFIG ====== */
const PCT_EARNED_SELF = 0.10;   // 10%
const PCT_REF_1       = 0.10;   // 10%
const PCT_REF_2       = 0.05;   // 5%

/** ====== UTILS / LOGGING ====== */
const log = (...args: any[]) => console.log("📦 [DEPOSIT]", ...args);
const warn = (...args: any[]) => console.warn("⚠️ [DEPOSIT]", ...args);
const errorLog = (...args: any[]) => console.error("❌ [DEPOSIT]", ...args);

/** ====== ZOD ====== */
const CreateDepositSchema = z.object({
  amount: z.number().positive().min(0.1), // USD
});

/** 
 * POST /api/deposit/create
 * Создаёт инвойс в NOWPayments и локальную транзакцию
 */
/** ====== POST /api/deposit/create ====== */
export const createDeposit = async (req: Request & { userId?: string }, res: Response) => {
  try {
    if (!req.userId) {
      warn("createDeposit: unauthorized");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const parsed = CreateDepositSchema.safeParse(req.body);
    if (!parsed.success) {
      warn("createDeposit: invalid body", parsed.error.flatten());
      return res.status(400).json({ success: false, message: parsed.error.message });
    }

    const { amount } = parsed.data;

    const ipnUrl = `${process.env.PUBLIC_BASE_URL}/api/deposit/webhook`;
    const orderId = `${req.userId}:${Date.now()}`;

    log("createDeposit: creating invoice", { userId: req.userId, amount, ipnUrl, orderId });

    const invoice = await nowpCreateInvoice({
      price_amount: amount,
      price_currency: "usd",
      order_id: orderId,
      order_description: "Account top-up",
      ipn_callback_url: ipnUrl,
    });

    log("createDeposit: invoice created", { invoiceId: invoice.id, invoiceUrl: invoice.invoice_url });

    // ✅ Сохраняем invoiceId, а не paymentId!
    await Transaction.create({
      user: req.userId,
      invoiceId: invoice.id,      // ✅ сохраняем номер инвойса
      paymentId: null,            // пока нет
      priceAmount: amount,
      priceCurrency: "usd",
      status: "waiting",
      invoiceUrl: invoice.invoice_url,
      raw: invoice,
    });

    return res.json({
      success: true,
      data: {
        invoiceUrl: invoice.invoice_url,
        invoiceId: invoice.id, // можно вернуть для инфо
      },
    });
  } catch (e: any) {
    errorLog("createDeposit: failed", e?.message || e);
    return res.status(500).json({ success: false, message: "Failed to create deposit" });
  }
};


export const webhookIPN = async (req: Request & { rawBody?: string }, res: Response) => {
  console.log("webhookIPN hit");

  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET || "";
  if (!ipnSecret) {
    errorLog("webhookIPN: NOWPAYMENTS_IPN_SECRET not set");
    return res.status(500).json({ success: false, message: "Server misconfigured (IPN secret missing)" });
  }

  // ✅ Сразу отвечаем (чтобы NOWPayments не ретрайл)
  res.status(200).json({ success: true });

  setImmediate(async () => {
    try {
      const theirSig = (req.headers["x-nowpayments-sig"] as string) || "";
      if (!theirSig) {
        warn("webhookIPN: missing signature");
        return;
      }

      // ✅ Сортировка тела как в NOWPayments доке
      const sortObject = (obj: any): any =>
        Object.keys(obj)
          .sort()
          .reduce((r: any, k: string) => {
            r[k] =
              obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k]) && obj[k] !== null
                ? sortObject(obj[k])
                : obj[k];
            return r;
          }, {});

      const sortedBody = sortObject(req.body);
      const jsonString = JSON.stringify(sortedBody);
      const mySig = crypto.createHmac("sha512", ipnSecret).update(jsonString).digest("hex");

      if (theirSig.toLowerCase() !== mySig.toLowerCase()) {
        warn("webhookIPN: invalid signature", { theirSig, mySig });
        return;
      }

      const {
        payment_id,
        invoice_id,
        payment_status,
        pay_amount,
        pay_currency,
        price_amount,
        price_currency,
        order_id,
      } = req.body as any;

      log("webhookIPN: parsed", {
        payment_id,
        invoice_id,
        payment_status,
        pay_amount,
        pay_currency,
        price_amount,
        price_currency,
        order_id,
      });

      if (!payment_id && !invoice_id) {
        warn("webhookIPN: no ids");
        return;
      }

      // ✅ Сначала ищем по paymentId, потом по invoiceId
      let tx = null;
      if (payment_id) {
        tx = await Transaction.findOne({ paymentId: payment_id });
      }
      if (!tx && invoice_id) {
        tx = await Transaction.findOne({ invoiceId: invoice_id });
      }
      if (!tx) {
        warn("webhookIPN: transaction not found", { payment_id, invoice_id });
        return;
      }

      log("webhookIPN: transaction found", {
        txId: tx._id.toString(),
        prevStatus: tx.status,
      });

      // ✅ Обновляем paymentId если раньше был только invoiceId
      if (!tx.paymentId && payment_id) {
        tx.paymentId = payment_id;
      }

      const newStatus = String(payment_status || "").toLowerCase();
      if (tx.status === "finished") {
        log("webhookIPN: already finished (idempotent)");
        return;
      }

      // ✅ Транзакция Mongo
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const txLocked = await Transaction.findById(tx._id).session(session);
          if (!txLocked) throw new Error("Transaction disappeared");

          if (txLocked.status === "finished") {
            log("webhookIPN: idempotent inside session");
            return;
          }

          // ✅ Обновляем все поля
          txLocked.status = newStatus as any;
          txLocked.payAmount = Number(pay_amount ?? txLocked.payAmount ?? 0);
          txLocked.payCurrency = String(pay_currency ?? txLocked.payCurrency ?? "").toLowerCase();
          txLocked.priceAmount = Number(price_amount ?? txLocked.priceAmount ?? 0);
          txLocked.priceCurrency = String(price_currency ?? "usd").toLowerCase() as any;
          txLocked.raw = req.body;

          // ✅ Возможно обновить paymentId
          if (!txLocked.paymentId && payment_id) {
            txLocked.paymentId = payment_id;
          }

          await txLocked.save({ session });

          // ✅ Только если finished — начисляем
          if (newStatus === "finished") {
            const amountUSD = txLocked.priceAmount;
            const user = await User.findById(txLocked.user).session(session);
            if (!user) throw new Error("User not found");

            log("webhookIPN: crediting balances", { userId: user._id.toString(), amountUSD });

            // 1) Deposit
            await Wallet.updateOne(
              { user: user._id },
              { $inc: { depositBalance: amountUSD }, $setOnInsert: { currency: "USD" } },
              { upsert: true, session }
            );

            // 2) Cashback
            const cashback = +(amountUSD * PCT_EARNED_SELF).toFixed(2);
            if (cashback > 0) {
              await Wallet.updateOne(
                { user: user._id },
                { $inc: { earnedBalance: cashback } },
                { session }
              );
            }

            // 3) Referral 1 lvl
            if (user.referredBy) {
              const ref1Bonus = +(amountUSD * PCT_REF_1).toFixed(2);
              await Wallet.updateOne(
                { user: user.referredBy },
                { $inc: { referralBalance: ref1Bonus } },
                { session }
              );

              // 4) Referral 2 lvl
              const ref1User = await User.findById(user.referredBy).session(session);
              if (ref1User?.referredBy) {
                const ref2Bonus = +(amountUSD * PCT_REF_2).toFixed(2);
                await Wallet.updateOne(
                  { user: ref1User.referredBy },
                  { $inc: { referralBalance: ref2Bonus } },
                  { session }
                );
              }
            }
          }
        });
      } finally {
        session.endSession();
      }

      log("webhookIPN: done");
    } catch (e: any) {
      errorLog("webhookIPN: error", e?.message || e);
    }
  });
};


/** 
 * GET /api/deposit/wallet
 */
export const getWallet = async (req: Request & { userId?: string }, res: Response) => {
  try {
    if (!req.userId) {
      warn("getWallet: unauthorized");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const w = await Wallet.findOne({ user: req.userId });
    log("getWallet: ok", { userId: req.userId, walletFound: !!w });
    return res.json({ success: true, data: { wallet: w ?? { currency: "USD", depositBalance: 0, earnedBalance: 0, referralBalance: 0 } } });
  } catch (e: any) {
    errorLog("getWallet: error", e?.message || e);
    return res.status(500).json({ success: false, message: "Failed to fetch wallet" });
  }
};

/**
 * POST /api/deposit/test-webhook
 * Тестовый обработчик, эмулирует finished платёж.
 * Оставлен для локальной отладки. Логика совпадает с webhookIPN.
 */
export const testWebhook = async (req: Request, res: Response) => {
  try {
    const { payment_id, payment_status } = req.body;
    log("testWebhook: incoming", { payment_id, payment_status });

    if (!payment_id) {
      warn("testWebhook: missing payment_id");
      return res.status(400).json({ success: false, message: "payment_id is required" });
    }

    const tx = await Transaction.findOne({ paymentId: payment_id });
    if (!tx) {
      warn("testWebhook: transaction not found", { payment_id });
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const newStatus = String(payment_status || "").toLowerCase();
    if (tx.status === "finished") {
      log("testWebhook: already finished");
      return res.json({ success: true, data: { message: "Already finished" } });
    }

    tx.status = (newStatus as any) || tx.status;
    await tx.save();
    log("testWebhook: transaction updated", { status: tx.status });

    if (newStatus === "finished") {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const txLocked = await Transaction.findById(tx._id).session(session);
          if (!txLocked) throw new Error("Transaction vanished in test session");
          if (txLocked.status === "finished") {
            log("testWebhook: idempotent inside txn");
            return;
          }

          txLocked.status = "finished";
          await txLocked.save({ session });

          const user = await User.findById(txLocked.user).session(session);
          if (!user) throw new Error("User not found in test");

          const amountUSD = txLocked.priceAmount;

          // 1) депозит
          await Wallet.updateOne(
            { user: user._id },
            { $inc: { depositBalance: amountUSD }, $setOnInsert: { currency: "USD" } },
            { upsert: true, session }
          );

          // 2) кэшбэк
          const cashback = +(amountUSD * PCT_EARNED_SELF).toFixed(2);
          await Wallet.updateOne(
            { user: user._id },
            { $inc: { earnedBalance: cashback } },
            { session }
          );

          // 3) рефералы
          if (user.referredBy) {
            const ref1Bonus = +(amountUSD * PCT_REF_1).toFixed(2);
            await Wallet.updateOne(
              { user: user.referredBy },
              { $inc: { referralBalance: ref1Bonus } },
              { session }
            );

            const ref1User = await User.findById(user.referredBy).session(session);
            if (ref1User?.referredBy) {
              const ref2Bonus = +(amountUSD * PCT_REF_2).toFixed(2);
              await Wallet.updateOne(
                { user: ref1User.referredBy },
                { $inc: { referralBalance: ref2Bonus } },
                { session }
              );
            }
          }
        });

        log("testWebhook: finished OK");
      } finally {
        session.endSession();
      }
    }

    return res.json({ success: true, data: { status: newStatus } });
  } catch (e: any) {
    errorLog("testWebhook: error", e?.message || e);
    return res.status(400).json({ success: false, message: e?.message || "Test webhook error" });
  }
};
