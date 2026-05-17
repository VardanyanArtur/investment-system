import mongoose from "mongoose";

export const connectMongo = async (isMongoConnected: boolean) => {
  if (isMongoConnected) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("❌ MONGO_URI is not defined in .env");

  try {
    await mongoose.connect(uri);
    isMongoConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
};