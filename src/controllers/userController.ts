import { Request, Response } from "express";
import { User } from "../models/User";

// Update Profile: Users must NOT be able to change role or subscription status
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { name, image, businessName } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (name) user.name = name.trim();
    if (image !== undefined) user.image = image;
    if (businessName !== undefined && user.role === "vendor") {
      user.businessName = businessName.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        businessName: user.businessName,
        subscriptionPlan: user.subscriptionPlan,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
  }
};
