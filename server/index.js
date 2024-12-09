import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import route from "./routes/userRoute.js";
import fs from "fs";

dotenv.config();

const app = express();

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(bodyParser.json());

// Properly configure CORS
const corsOptions = {
  origin: "http://localhost:3000", // Your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests for all routes

// Serve static files (uploaded images and videos)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api", route);

// Database connection and server startup
const PORT = process.env.PORT || 8000;
const URL = process.env.MONGOURL;

mongoose
  .connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("DB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB connection error:", error);
    process.exit(1); // Exit the process if DB connection fails
  });
