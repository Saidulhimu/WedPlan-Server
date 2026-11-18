import { Router } from "express";
import {
  getServices,
  getFeaturedServices,
  getServiceById,
  createService,
  getMyServices,
  updateService,
  toggleServiceAvailability,
  deleteService,
  adminGetAllServices,
  adminUpdateServiceStatus,
} from "../controllers/serviceController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyRole } from "../middlewares/verifyRole";
import { checkBlocked } from "../middlewares/checkBlocked";

const router = Router();

// Public routes
router.get("/", getServices);
router.get("/featured", getFeaturedServices);

// Vendor routes
router.get("/vendor/my-services", verifyToken, verifyRole(["vendor"]), getMyServices);
router.post("/", verifyToken, verifyRole(["vendor"]), checkBlocked, createService);
router.put("/:id", verifyToken, verifyRole(["vendor", "admin"]), checkBlocked, updateService);
router.patch("/:id/availability", verifyToken, verifyRole(["vendor"]), toggleServiceAvailability);
router.delete("/:id", verifyToken, verifyRole(["vendor", "admin"]), deleteService);

// Admin routes
router.get("/admin/all", verifyToken, verifyRole(["admin"]), adminGetAllServices);
router.patch("/admin/:id/status", verifyToken, verifyRole(["admin"]), adminUpdateServiceStatus);

// Single service details
router.get("/:id", getServiceById);

export default router;
