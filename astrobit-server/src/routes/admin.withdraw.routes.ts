import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { adminListWithdraws, adminSuccessWithdraw, adminCancelWithdraw } from "../controllers/admin.withdraw.controller";

const router = Router();

// Все выводы (фильтры: status, user, from, to, пагинация)
router.get("/", adminAuth, adminListWithdraws);

// Подтвердить (pending -> success)
router.post("/:id/success", adminAuth, adminSuccessWithdraw);

// Отменить (pending -> canceled) БЕЗ возврата
router.post("/:id/cancel", adminAuth, adminCancelWithdraw);

export default router;
