import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongDB_URI = process.env.DB_HOST!;

export const connectToDb = async () => {
    try {
       await mongoose.connect(mongDB_URI);
       console.log("Connected to MongoDB successfully");
    } catch (error) {
       console.error("Error connecting to MongoDB:", error);
       process.exit(1);
    }
}