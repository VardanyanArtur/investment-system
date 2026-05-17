import { Router } from "express";
import {
  createVipPlan,
  getVipPlans,
  getVipPlan,
  updateVipPlan,
  deleteVipPlan,
} from "../controllers/vipPlan";

const router = Router();

router.post("/", createVipPlan);
router.get("/", getVipPlans);
router.get("/:id", getVipPlan);
router.put("/:id", updateVipPlan);
router.delete("/:id", deleteVipPlan);

export default router;
