import mongoose from "mongoose";

export async function connectToMongo(mongoUri: string) {
  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== "production",
  });

  console.log("[db] connected to MongoDB");
}
