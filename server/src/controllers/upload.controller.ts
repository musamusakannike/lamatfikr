import type { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";

import { uploadBufferToR2 } from "../services/s3";
import { optimizeImageBuffer } from "../utils/image";

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

const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
  "application/epub+zip",
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

    const optimized = await optimizeImageBuffer(file);
    const extensionFromMime = optimized.extension || path.extname(file.originalname) || `.${(optimized.contentType || file.mimetype).split("/")[1]}`;
    const key = `${folder}/${userId}/${uuidv4()}${extensionFromMime}`;

    const result = await uploadBufferToR2({
      key,
      contentType: optimized.contentType || file.mimetype,
      buffer: optimized.buffer,
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

    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        message: "Invalid file type. Allowed: images, videos, audio, and documents (PDF, DOC, ZIP)",
      });
      return;
    }

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    const isAudio = ALLOWED_AUDIO_TYPES.includes(file.mimetype);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);
    const folder = (req.query.folder as string) || (isVideo ? "videos" : isAudio ? "audio" : isDocument ? "documents" : "images");

    const optimized =
      !isVideo && !isAudio && !isDocument && ALLOWED_IMAGE_TYPES.includes(file.mimetype)
        ? await optimizeImageBuffer(file)
        : { buffer: file.buffer };

    const effectiveMime = optimized.contentType || file.mimetype;
    const extensionFromMime =
      optimized.extension || path.extname(file.originalname) || `.${effectiveMime.split("/")[1]}`;
    const key = `${folder}/${userId}/${uuidv4()}${extensionFromMime}`;

    const result = await uploadBufferToR2({
      key,
      contentType: effectiveMime,
      buffer: optimized.buffer,
    });

    if (!result.url) {
      res.status(500).json({ message: "Upload failed - R2_PUBLIC_BASE_URL not configured" });
      return;
    }

    res.json({
      message: "File uploaded successfully",
      url: result.url,
      key: result.key,
      type: isVideo ? "video" : isAudio ? "audio" : isDocument ? "document" : "image",
    });
  } catch (error) {
    next(error);
  }
};
