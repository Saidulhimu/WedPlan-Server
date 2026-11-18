import { Router } from "express";
import { register, login, googleAuth, getMe } from "../controllers/authController";
import { verifyToken } from "../middlewares/verifyToken";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", verifyToken, getMe);

export default router;
