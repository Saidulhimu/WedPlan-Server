import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn("MONGODB_URI is not defined in environment variables. Database connection skipped.");
      return;
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.warn("Server continuing in offline mode until valid MONGODB_URI is provided in .env");
  }
};
