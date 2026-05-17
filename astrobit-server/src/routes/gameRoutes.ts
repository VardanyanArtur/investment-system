import { Router } from "express";
import { claimDailyBonus, getBonusHistory } from "../controllers/gameController";
import { auth } from "../middleware/auth"; // если есть авторизация

const router = Router();

// Получить бонус (1 раз в день после 20:00)
router.post("/claim", auth, claimDailyBonus);

// История бонусов
router.get("/history", auth, getBonusHistory);

export default router;
