import { Router } from "express";
import {
  getAdminStats,
  getAllUsers,
  toggleBlockUser,
  getAllTransactions,
} from "../controllers/adminController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyRole } from "../middlewares/verifyRole";

const router = Router();

// Protect all admin routes
router.use(verifyToken, verifyRole(["admin"]));

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/block", toggleBlockUser);
router.get("/transactions", getAllTransactions);

export default router;
