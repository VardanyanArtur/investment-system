import { Router } from "express";
import { auth } from "../middleware/auth";
import { createWithdraw, cancelMyWithdraw, getMyWithdraws } from "../controllers/withdraw.controller";

const router = Router();

// Создать вывод
router.post("/", auth, createWithdraw);

// Отменить свою (pending) → вернуть деньги
router.post("/:id/cancel", auth, cancelMyWithdraw);

// Список своих заявок
router.get("/my", auth, getMyWithdraws);

export default router;
