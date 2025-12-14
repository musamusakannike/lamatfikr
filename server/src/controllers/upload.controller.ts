import type { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";

import { uploadBufferToR2 } from "../services/s3";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export const uploadImage: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      res.status(400).json({
        message: "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG",
      });
      return;
    }

    const folder = (req.query.folder as string) || "images";
    const ext = path.extname(file.originalname) || `.${file.mimetype.split("/")[1]}`;
    const key = `${folder}/${userId}/${uuidv4()}${ext}`;

    const result = await uploadBufferToR2({
      key,
      contentType: file.mimetype,
      buffer: file.buffer,
    });

    if (!result.url) {
      res.status(500).json({ message: "Upload failed - R2_PUBLIC_BASE_URL not configured" });
      return;
    }

    res.json({
      message: "Image uploaded successfully",
      url: result.url,
      key: result.key,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMedia: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        message: "Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP, SVG) and videos (MP4, WebM, MOV)",
      });
      return;
    }

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    const folder = (req.query.folder as string) || (isVideo ? "videos" : "images");
    const ext = path.extname(file.originalname) || `.${file.mimetype.split("/")[1]}`;
    const key = `${folder}/${userId}/${uuidv4()}${ext}`;

    const result = await uploadBufferToR2({
      key,
      contentType: file.mimetype,
      buffer: file.buffer,
    });

    if (!result.url) {
      res.status(500).json({ message: "Upload failed - R2_PUBLIC_BASE_URL not configured" });
      return;
    }

    res.json({
      message: "File uploaded successfully",
      url: result.url,
      key: result.key,
      type: isVideo ? "video" : "image",
    });
  } catch (error) {
    next(error);
  }
};
