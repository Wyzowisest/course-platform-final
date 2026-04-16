import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import materialRoutes from "./routes/material.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct paths based on where the server is running
const isRootRun = __dirname.includes('/server') === false && __dirname.includes('\\server') === false;
const clientDistPath = isRootRun 
  ? path.join(__dirname, "client/dist") 
  : path.join(__dirname, "../client/dist");

dotenv.config({ path: isRootRun ? '.env' : '../.env' });
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("Client path:", clientDistPath);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Serve static files from the React app build directory
app.use(express.static(clientDistPath));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Catch all handler: send back React's index.html file for client-side routing
// This must come LAST after all API routes
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

mongoose.connect(process.env.MONGO_URI)
.then(()=>app.listen(process.env.PORT || 5000, ()=>console.log("Server running")))
.catch(err=>console.error("DB connection failed", err));