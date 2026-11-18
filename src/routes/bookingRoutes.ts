import { Router } from "express";
import {
  createBooking,
  getMyCustomerBookings,
  cancelCustomerBooking,
  getVendorBookings,
  updateVendorBookingStatus,
} from "../controllers/bookingController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyRole } from "../middlewares/verifyRole";
import { checkBlocked } from "../middlewares/checkBlocked";

const router = Router();

// Customer endpoints
router.post("/", verifyToken, checkBlocked, createBooking);
router.get("/customer/my-bookings", verifyToken, verifyRole(["customer"]), getMyCustomerBookings);
router.patch("/customer/:id/cancel", verifyToken, verifyRole(["customer"]), cancelCustomerBooking);

// Vendor endpoints
router.get("/vendor/requests", verifyToken, verifyRole(["vendor"]), getVendorBookings);
router.patch("/vendor/:id/status", verifyToken, verifyRole(["vendor", "admin"]), updateVendorBookingStatus);

export default router;
