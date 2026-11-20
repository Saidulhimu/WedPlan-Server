import mongoose from "mongoose";
import dns from "dns";

// Ensure robust SRV record resolution across all Windows network environments
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore fallback
}

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
