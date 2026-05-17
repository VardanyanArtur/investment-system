import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  getWallet,
  getReferrals,
  getReferralTree,
  getTransactions,
  me,
  getDepositHistory,
  getRefLink
} from "../controllers/auth.controller";

const router = Router();
router.get("/", auth, me);
router.get("/wallet", auth, getWallet);
router.get("/referrals", auth, getReferrals);
router.get("/referral/link", auth, getRefLink);
router.get("/referrals/tree", auth, getReferralTree);
router.get("/transactions", auth, getTransactions);
router.get("/history", auth, getDepositHistory);
router.get("/history", auth, getDepositHistory);

export default router;
