import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().catch((err) => console.warn("Database connection notice:", err.message));

// In serverless platforms like Vercel, app is exported as handler.
// In regular Node environments, start listener.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`WedPlan Server running on port ${PORT}`);
  });
}

export default app;
