import { Request, Response } from "express";
import { User } from "../models/User";
import { Service } from "../models/Service";
import { Transaction } from "../models/Transaction";
import { Booking } from "../models/Booking";

// Admin: Get Platform Dashboard Overview Statistics
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalVendors,
      totalCustomers,
      totalServices,
      pendingServices,
      totalBookings,
      totalTransactions,
      transactionsData,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "vendor" }),
      User.countDocuments({ role: "customer" }),
      Service.countDocuments(),
      Service.countDocuments({ status: "pending" }),
      Booking.countDocuments(),
      Transaction.countDocuments(),
      Transaction.find({ status: "succeeded" }).select("amount"),
    ]);

    const totalRevenue = transactionsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalVendors,
        totalCustomers,
        totalServices,
        pendingServices,
        totalBookings,
        totalTransactions,
        totalRevenue,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch stats" });
  }
};

// Admin: Manage Users (Search, Filter by role, View all)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, page = "1", limit = "15" } = req.query;

    const query: any = {};
    if (role && role !== "all") {
      query.role = String(role);
    }
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: "i" } },
        { email: { $regex: String(search), $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.max(1, parseInt(String(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch users" });
  }
};

// Admin: Block / Unblock user
export const toggleBlockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (user.role === "admin") {
      res.status(403).json({ success: false, message: "Admin accounts cannot be blocked." });
      return;
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User successfully ${user.isBlocked ? "blocked" : "unblocked"}`,
      isBlocked: user.isBlocked,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update block status" });
  }
};

// Admin: View all transactions (Read-Only)
export const getAllTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = "1", limit = "15" } = req.query;

    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.max(1, parseInt(String(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate("vendorId", "name email businessName image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch transactions" });
  }
};
