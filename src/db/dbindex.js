import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB = async () => {   
  // Creating an async function because DB connection takes time (needs await).
  try {
    const connectionInstant = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)   
    // process.env.MONGODB_URI → MongoDB URL from .env file && await → Wait until connection is complete
    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstant.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1);
    // process.exit(1) → Crash the app intentionally (no point running without DB)
  }
}


export default connectDB