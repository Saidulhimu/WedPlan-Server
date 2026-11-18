import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";

const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || "wedplan_jwt_secret_key_default";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    secret as jwt.Secret,
    { expiresIn: expiresIn as any }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, image, role, businessName } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required" });
      return;
    }

    // Role validation: Admin cannot be registered through public registration
    if (role === "admin") {
      res.status(403).json({
        success: false,
        message: "Admin accounts cannot be registered publicly. Must be created securely by system administrators.",
      });
      return;
    }

    const assignedRole = role === "vendor" ? "vendor" : "customer";

    // Password validation: Minimum 6 characters, at least 1 uppercase, at least 1 lowercase
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long and contain at least one uppercase and one lowercase letter.",
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: "An account with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      image: image || "",
      role: assignedRole,
      businessName: assignedRole === "vendor" ? (businessName || `${name.trim()}'s Services`) : undefined,
      subscriptionPlan: "free",
      isBlocked: false,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Account registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        image: newUser.image,
        businessName: newUser.businessName,
        subscriptionPlan: newUser.subscriptionPlan,
        isBlocked: newUser.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        businessName: user.businessName,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Login failed" });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, image, role } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required for Google authentication" });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const assignedRole = role === "vendor" ? "vendor" : "customer";
      user = await User.create({
        name: name || "Google User",
        email: email.toLowerCase(),
        image: image || "",
        role: assignedRole,
        subscriptionPlan: "free",
        isBlocked: false,
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Google authentication successful",
      token,
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
    res.status(500).json({ success: false, message: error.message || "Google auth failed" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch profile" });
  }
};
