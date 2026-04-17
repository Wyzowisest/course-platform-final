import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import Material from "../models/Material.js";
import { protect } from "../middleware/auth.js";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const baseName = path.parse(file.originalname).name;
    const publicId = `course-materials/${Date.now()}-${sanitizeFilename(baseName)}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "auto",
        use_filename: true,
        unique_filename: false,
        filename_override: file.originalname,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

function getCloudinaryDownloadUrl(material) {
  return cloudinary.url(material.publicId, {
    resource_type: material.resourceType || "raw",
    type: "upload",
    secure: true,
    sign_url: true,
    flags: "attachment",
    attachment: material.originalFilename,
  });
}

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
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({ message: "Cloudinary is not configured on the server" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, description, course } = req.body;
    const uploadedFile = await uploadToCloudinary(req.file);

    const material = await Material.create({
      title,
      description,
      course,
      filename: uploadedFile.public_id,
      originalFilename: req.file.originalname,
      filepath: null,
      fileUrl: uploadedFile.secure_url,
      publicId: uploadedFile.public_id,
      resourceType: uploadedFile.resource_type,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
    });
    res.status(201).json(material);
  } catch (error) {
    console.error("Material upload failed:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

// DOWNLOAD MATERIAL
router.get("/:id/download", protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    await Material.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    if (material.fileUrl) {
      const fileResponse = await fetch(
        material.publicId ? getCloudinaryDownloadUrl(material) : material.fileUrl
      );

      if (!fileResponse.ok || !fileResponse.body) {
        console.error("Cloudinary fetch failed:", fileResponse.status, fileResponse.statusText);
        return res.status(502).json({ message: "Unable to fetch file from storage" });
      }

      const contentType = material.mimeType || fileResponse.headers.get("content-type") || "application/octet-stream";
      const contentLength = fileResponse.headers.get("content-length");
      const encodedFilename = encodeURIComponent(material.originalFilename);

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedFilename}`);

      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      Readable.fromWeb(fileResponse.body).pipe(res);
      return;
    }

    if (!material.filepath || !fs.existsSync(material.filepath)) {
      return res.status(404).json({ message: "Stored file not found" });
    }

    res.download(material.filepath, material.originalFilename);
  } catch (error) {
    console.error("Material download failed:", error);
    res.status(500).json({ message: "Download failed" });
  }
});

// VIEW MATERIAL
router.get("/:id/view", protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    if (material.fileUrl) {
      return res.redirect(material.fileUrl);
    }

    if (!fs.existsSync(material.filepath)) {
      return res.status(404).json({ message: "Stored file not found" });
    }

    res.sendFile(path.resolve(material.filepath));
  } catch (error) {
    console.error("Material view failed:", error);
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

    if (material.publicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(material.publicId, {
        resource_type: material.resourceType || "raw",
        invalidate: true,
      });
    } else if (material.filepath && fs.existsSync(material.filepath)) {
      fs.unlinkSync(material.filepath);
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: "Material deleted" });
  } catch (error) {
    console.error("Material delete failed:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
