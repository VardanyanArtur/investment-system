import { Router } from "express";
import { register, verify, login, me } from "../controllers/auth.controller";
import { auth } from "../middleware/auth";

const router = Router();

router.post("/register", register);  // 1
router.post("/verify", verify);      // 2
router.post("/login", login);        // 3

export default router;
