import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
  orgin: process.env.CORS_ORIGIN,
  credentials: true
}))
// CORS → Allows frontend (different domain) to call your API
// credentials: true → Allows cookies to be sent

app.use(express.json({limit: "16kb"}))
// Parses JSON body from requests
app.use(express.urlencoded({extended: true, limit: "16kb"}))
// Parses form data (like HTML form submissions), extended: true → Allows nested objects
app.use(express.static("public"))
// Serves files from public/ folder directly
app.use(cookieParser())
// Reads cookies from request, Allows setting cookies in response

export { app }