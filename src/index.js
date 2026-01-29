// require('dotenv').config({path: './env'})
import connectDB from "./db/dbindex.js";
import dotenv from "dotenv"

dotenv.config({
  path: './env'
})

connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at port : ${process.env.PORT}`)
  })
})
.catch((err) => {
  console.log("MongoDB connection failed", err);
})














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