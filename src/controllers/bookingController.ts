import { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { Service } from "../models/Service";

// Customer: Create a new booking request
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (req.user.role === "admin") {
      res.status(403).json({ success: false, message: "Admins cannot submit customer booking requests." });
      return;
    }

    const { serviceId, eventDate, eventLocation, message } = req.body;

    if (!serviceId || !eventDate || !eventLocation) {
      res.status(400).json({ success: false, message: "Service ID, event date, and location are required." });
      return;
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404).json({ success: false, message: "Service not found." });
      return;
    }

    if (service.status !== "approved" || !service.isAvailable) {
      res.status(400).json({ success: false, message: "This service is currently not available for bookings." });
      return;
    }

    // Rule: Vendors cannot book their own services
    if (service.vendorId.toString() === req.user.id) {
      res.status(400).json({ success: false, message: "You cannot book your own service." });
      return;
    }

    // Rule: Prevent duplicate active booking requests for the same service and event date
    const existingBooking = await Booking.findOne({
      serviceId,
      customerId: req.user.id,
      eventDate,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingBooking) {
      res.status(409).json({
        success: false,
        message: "You already have an active booking request for this service on this date.",
      });
      return;
    }

    const newBooking = await Booking.create({
      serviceId: service._id,
      vendorId: service.vendorId,
      customerId: req.user.id,
      eventDate,
      eventLocation: eventLocation.trim(),
      message: message || "",
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully! Awaiting vendor review.",
      booking: newBooking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to submit booking request" });
  }
};

// Customer: Get logged-in customer's bookings
export const getMyCustomerBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const bookings = await Booking.find({ customerId: req.user.id })
      .populate("serviceId", "serviceName category price images location")
      .populate("vendorId", "name email businessName image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch bookings" });
  }
};

// Customer: Cancel pending booking
export const cancelCustomerBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    // Ownership check
    if (booking.customerId.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: "Forbidden: You cannot modify another customer's booking" });
      return;
    }

    // Rule: Customers cannot cancel an already accepted, rejected, or cancelled booking
    if (booking.status !== "pending") {
      res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already ${booking.status}. Only pending requests can be cancelled.`,
      });
      return;
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking request cancelled successfully.",
      booking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to cancel booking" });
  }
};

// Vendor: Get all booking requests for vendor's services
export const getVendorBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const bookings = await Booking.find({ vendorId: req.user.id })
      .populate("customerId", "name email image")
      .populate("serviceId", "serviceName category price location images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch vendor bookings" });
  }
};

// Vendor: Accept or Reject booking request
export const updateVendorBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      res.status(400).json({ success: false, message: "Status must be either 'accepted' or 'rejected'." });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    // Ownership check
    if (booking.vendorId.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(403).json({ success: false, message: "Forbidden: You cannot modify booking requests belonging to other vendors." });
      return;
    }

    // Rule: Only pending requests can be accepted or rejected. Once accepted or rejected, a request cannot be processed again.
    if (booking.status !== "pending") {
      res.status(400).json({
        success: false,
        message: `This booking request is already ${booking.status} and cannot be processed again.`,
      });
      return;
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking request ${status} successfully.`,
      booking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update booking status" });
  }
};
