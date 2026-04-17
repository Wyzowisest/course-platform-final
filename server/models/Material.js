import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  course: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  filepath: {
    type: String,
    default: null,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  publicId: {
    type: String,
    default: null,
  },
  resourceType: {
    type: String,
    default: null,
  },
  mimeType: {
    type: String,
    default: null,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  downloads: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model("Material", materialSchema);
