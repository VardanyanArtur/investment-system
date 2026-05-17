import { Router } from "express";
import { register } from "../controllers/auth.controller";
import { deposit } from "../controllers/wallet";
import { getMyReferralLink, getReferralStats } from "../controllers/referral";
import { auth } from "../middleware/auth"; // должен выставлять req.userId

const router = Router();


// реферальные утилиты (нужна авторизация)
router.get("/referral/link", auth, getMyReferralLink);
router.get("/referral/stats", auth, getReferralStats);

// депозит (нужна авторизация)

export default router;
