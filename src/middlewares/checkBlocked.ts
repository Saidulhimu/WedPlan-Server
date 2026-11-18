import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export const checkBlocked = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.user.id).select("isBlocked");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: "Your account is currently blocked by administration. Protected features cannot be accessed.",
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
