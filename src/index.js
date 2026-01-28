// require('dotenv').config({path: './env'})
import connectDB from "./db/dbindex.js";
import dotenv from "dotenv"

dotenv.config({
  path: './env'
})

connectDB()

















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