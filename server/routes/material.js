import express from "express";
import multer from "multer";
import path from "path";
import Material from "../models/Material.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET ALL MATERIALS
router.get("/", protect, async (req, res) => {
  try {
    const materials = await Material.find().populate("uploadedBy", "name email role");
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD MATERIAL
router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    const { title, description, course } = req.body;
    const material = await Material.create({
      title,
      description,
      course,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filepath: req.file.path,
      uploadedBy: req.user.id,
    });
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: "Upload failed" });
  }
});

// DOWNLOAD MATERIAL
router.get("/:id/download", protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    res.download(material.filepath, material.originalFilename);
  } catch (error) {
    res.status(500).json({ message: "Download failed" });
  }
});

// VIEW MATERIAL
router.get("/:id/view", protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    res.sendFile(path.resolve(material.filepath));
  } catch (error) {
    res.status(500).json({ message: "View failed" });
  }
});

// DELETE MATERIAL (only by uploader or admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    if (material.uploadedBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: "Material deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;