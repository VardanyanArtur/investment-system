import { Router } from "express";
import { createDeposit, webhookIPN, getWallet, testWebhook } from "../controllers/deposit.controller";
import { auth } from "../middleware/auth";
import express from "express"
const router = Router();

// пользователь создаёт депозит
router.post("/create", auth, createDeposit);

// webhook от NOWPayments
router.post(
  "/webhook",
  express.raw({ type: "*/*" }) as any,
  (req: any, res, next) => {
    // 1) Сохраняем сырой body как строку (для подписи)
    req.rawBody = req.body.toString("utf8");

    // 2) Парсим JSON, чтобы webhookIPN мог читать поля
    try {
      req.body = JSON.parse(req.rawBody);
    } catch (_) {
      req.body = {};
    }

    next();
  },
  webhookIPN
);

// баланс
router.get("/wallet", auth, getWallet);
router.post("/test-webhook", testWebhook);

export default router;
