import { Request, Response } from "express";
import { Service } from "../models/Service";
import { User } from "../models/User";

// Public: Get all approved and active services with search, filtering, and sorting
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      sort,
      page = "1",
      limit = "12",
    } = req.query;

    const query: any = {
      status: "approved",
      isAvailable: true,
    };

    if (search) {
      query.$or = [
        { serviceName: { $regex: String(search), $options: "i" } },
        { description: { $regex: String(search), $options: "i" } },
        { location: { $regex: String(search), $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      query.category = String(category);
    }

    if (location && location !== "All") {
      query.location = { $regex: String(location), $options: "i" };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOptions: any = { createdAt: -1 };
    if (sort === "price_asc") sortOptions = { price: 1 };
    else if (sort === "price_desc") sortOptions = { price: -1 };
    else if (sort === "newest") sortOptions = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.max(1, parseInt(String(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate("vendorId", "name email image businessName subscriptionPlan")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Service.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch services" });
  }
};

// Public: Featured services for homepage (at least 6)
export const getFeaturedServices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const services = await Service.find({ status: "approved", isAvailable: true })
      .populate("vendorId", "name email image businessName subscriptionPlan")
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch featured services" });
  }
};

// Public/Protected: Get service by ID
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).populate(
      "vendorId",
      "name email image businessName subscriptionPlan"
    );

    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Invalid service ID format or not found" });
  }
};

// Vendor: Add a new service (Enforces 3-service limit for Free plan)
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { serviceName, category, description, price, location, images } = req.body;

    if (!serviceName || !category || !description || !price || !location || !images || !images.length) {
      res.status(400).json({ success: false, message: "All fields and at least one image are required." });
      return;
    }

    const vendor = await User.findById(req.user.id);
    if (!vendor) {
      res.status(404).json({ success: false, message: "Vendor profile not found" });
      return;
    }

    // Check Free Plan Limitation: max 3 active/pending services
    if (vendor.subscriptionPlan !== "premium") {
      const activeCount = await Service.countDocuments({
        vendorId: vendor._id,
        status: { $in: ["approved", "pending"] },
      });

      if (activeCount >= 3) {
        res.status(403).json({
          success: false,
          message: "Free plan limit reached (max 3 services). Upgrade to Premium to publish unlimited services.",
          requiresUpgrade: true,
        });
        return;
      }
    }

    const newService = await Service.create({
      vendorId: vendor._id,
      serviceName: serviceName.trim(),
      category,
      description,
      price: Number(price),
      location: location.trim(),
      images,
      status: "pending", // Default awaiting admin approval
      isAvailable: true,
    });

    res.status(201).json({
      success: true,
      message: "Service submitted successfully and is pending admin approval.",
      service: newService,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create service" });
  }
};

// Vendor: Get vendor's own services
export const getMyServices = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const services = await Service.find({ vendorId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch vendor services" });
  }
};

// Vendor: Update service
export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    // Verify ownership
    if (service.vendorId.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(403).json({ success: false, message: "Forbidden: You do not own this service" });
      return;
    }

    const { serviceName, category, description, price, location, images, isAvailable } = req.body;

    if (serviceName) service.serviceName = serviceName.trim();
    if (category) service.category = category;
    if (description) service.description = description;
    if (price !== undefined) service.price = Number(price);
    if (location) service.location = location.trim();
    if (images && images.length) service.images = images;
    if (isAvailable !== undefined) service.isAvailable = Boolean(isAvailable);

    // If edited by vendor after rejection, reset to pending for review
    if (req.user.role === "vendor" && service.status === "rejected") {
      service.status = "pending";
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update service" });
  }
};

// Vendor: Toggle availability
export const toggleServiceAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    if (service.vendorId.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(403).json({ success: false, message: "Forbidden: You do not own this service" });
      return;
    }

    service.isAvailable = !service.isAvailable;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service availability set to ${service.isAvailable ? "Available" : "Unavailable"}`,
      isAvailable: service.isAvailable,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to toggle availability" });
  }
};

// Vendor: Delete service
export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    if (service.vendorId.toString() !== req.user.id && req.user.role !== "admin") {
      res.status(403).json({ success: false, message: "Forbidden: You do not own this service" });
      return;
    }

    await Service.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete service" });
  }
};

// Admin: Get all submitted services for moderation
export const adminGetAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = "1", limit = "15" } = req.query;

    const query: any = {};
    if (status && status !== "all") {
      query.status = String(status);
    }
    if (search) {
      query.serviceName = { $regex: String(search), $options: "i" };
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.max(1, parseInt(String(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate("vendorId", "name email businessName subscriptionPlan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Service.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch admin services" });
  }
};

// Admin: Update service status (approve, reject)
export const adminUpdateServiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status value" });
      return;
    }

    const service = await Service.findByIdAndUpdate(id, { status }, { new: true });
    if (!service) {
      res.status(404).json({ success: false, message: "Service not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Service status updated to ${status}`,
      service,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update service status" });
  }
};
