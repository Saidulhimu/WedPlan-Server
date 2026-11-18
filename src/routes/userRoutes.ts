import { Router } from "express";
import { updateProfile } from "../controllers/userController";
import { verifyToken } from "../middlewares/verifyToken";
import { checkBlocked } from "../middlewares/checkBlocked";

const router = Router();

router.put("/profile", verifyToken, checkBlocked, updateProfile);

export default router;
