import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { upload } from "../uploads/multer";
import { uploadImage, uploadMedia } from "../controllers/upload.controller";

export const uploadRouter = Router();

uploadRouter.post("/image", requireAuth, upload.single("file"), uploadImage);
uploadRouter.post("/media", requireAuth, upload.single("file"), uploadMedia);
