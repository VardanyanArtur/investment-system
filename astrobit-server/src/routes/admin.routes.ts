import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();
router.post("/login" , adminController.login)
router.use(adminAuth);

router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.post("/users", adminController.createUser);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

router.get("/users/:id/wallet", adminController.getWallet);
router.post("/users/:id/balance-adjust", adminController.adjustBalance);

router.get("/users/:id/deposits", adminController.getUserDeposits);
router.get("/users/:id/games", adminController.getUserGames);
router.get("/users/:id/referrals", adminController.getUserReferrals);

// VIPs
router.get("/vips", adminController.getVips);
router.get("/vips/:id", adminController.getVipById);
router.post("/vips", adminController.createVip);
router.patch("/vips/:id", adminController.updateVip);
router.delete("/vips/:id", adminController.deleteVip);

router.get("/stats/summary", adminController.getSummaryStats);


export default router;
