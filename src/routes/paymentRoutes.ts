import { Router } from "express";
import {
  createCheckoutSession,
  verifyCheckoutSession,
} from "../controllers/paymentController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyRole } from "../middlewares/verifyRole";
import { checkBlocked } from "../middlewares/checkBlocked";

const router = Router();

router.post(
  "/create-checkout-session",
  verifyToken,
  verifyRole(["vendor"]),
  checkBlocked,
  createCheckoutSession
);

router.post("/verify-session", verifyToken, verifyCheckoutSession);

export default router;
