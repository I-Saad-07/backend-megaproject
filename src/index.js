// require('dotenv').config({path: './env'})
import connectDB from "./db/dbindex.js";
import dotenv from "dotenv"
import { app } from "./app.js"

dotenv.config({
  path: './env'
})
// Loads environment variables from .env file into process.env.


connectDB()
.then(() => {  // Call connectDB() - it returns a Promise (because it's async).
  // After DB connects successfully → start the server
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at port : ${process.env.PORT}`)
  })
})
.catch((err) => {
  console.log("MongoDB connection failed", err);
})


// Another way to do the same thing as above
/*
import express from "express"
;(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
  } catch (error) {
    console.error("ERROR: ",error)
  }
})()
*/