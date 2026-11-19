import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`WedPlan Server running on port ${PORT}`);
  // Connect to Database in background
  connectDB().catch((err) => console.warn("Database connection notice:", err.message));
});
