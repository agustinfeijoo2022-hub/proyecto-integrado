import mongoose from "mongoose";
export async function conectarMongo() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fyag_logs", { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB conectado.");
}
