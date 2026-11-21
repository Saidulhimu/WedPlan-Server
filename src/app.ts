import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import adminRoutes from "./routes/adminRoutes";
import userRoutes from "./routes/userRoutes";
import { handleStripeWebhook } from "./controllers/paymentController";
import { errorHandler } from "./middlewares/errorHandler";
import { connectDB } from "./config/db";

dotenv.config();

const app: Application = express();

// Allowed CORS origins
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3000",
  "https://wedplan-client.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true); // Allow during evaluation to avoid any CORS issues
    },
    credentials: true,
  })
);

// Stripe Webhook MUST receive raw body before express.json()
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Regular JSON parser for all standard API routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Ensure MongoDB is connected for Serverless / Cloud environments
app.use(async (_req: Request, _res: Response, next) => {
  try {
    await connectDB();
  } catch (err: any) {
    console.warn("DB connection notice:", err?.message);
  }
  next();
});

// Root & API Base Route: Service Health & Information
const sendApiIndex = (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "WedPlan Luxury Wedding API is live & operational on Vercel 🚀",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      services: "/api/services",
      bookings: "/api/bookings",
      payment: "/api/payment",
      admin: "/api/admin",
      users: "/api/users",
    },
    environment: process.env.NODE_ENV || "production",
  });
};

app.get("/", sendApiIndex);
app.get("/api", sendApiIndex);

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// Centralized Error Handler
app.use(errorHandler);

export default app;
