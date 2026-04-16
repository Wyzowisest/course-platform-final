import express from "express";
import User from "../models/User.js";
import Material from "../models/Material.js";
import { protect } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const r=express.Router();

r.get("/stats",protect, async(req,res)=>{
 if(req.user.role!=="admin") return res.sendStatus(403);
 res.json({
  users: await User.countDocuments(),
  materials: await Material.countDocuments()
 });
});

// GET ALL USERS
r.get("/users", protect, async(req,res)=>{
 if(req.user.role!=="admin") return res.sendStatus(403);
 try {
  const users = await User.find().select("-password");
  res.json(users);
 } catch(err) {
  res.status(500).json({ message: "Failed to fetch users" });
 }
});

// CREATE LECTURER
r.post("/create-lecturer", protect, async(req,res)=>{
 if(req.user.role!=="admin") return res.sendStatus(403);
 try {
  const { name, email, password } = req.body;
  if(!name || !email || !password) {
   return res.status(400).json({ message: "All fields required" });
  }
  
  const existingUser = await User.findOne({ email });
  if(existingUser) {
   return res.status(400).json({ message: "Email already exists" });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const lecturer = await User.create({
   name,
   email,
   password: hashedPassword,
   role: "lecturer"
  });
  
  res.status(201).json({ message: "Lecturer created successfully", user: { ...lecturer.toObject(), password: undefined } });
 } catch(err) {
  res.status(500).json({ message: "Failed to create lecturer" });
 }
});

// DELETE USER
r.delete("/users/:id", protect, async(req,res)=>{
 if(req.user.role!=="admin") return res.sendStatus(403);
 try {
  const user = await User.findByIdAndDelete(req.params.id);
  if(!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted successfully" });
 } catch(err) {
  res.status(500).json({ message: "Failed to delete user" });
 }
});

export default r;