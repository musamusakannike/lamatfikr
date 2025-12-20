import sharp from "sharp";

const LARGE_IMAGE_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // 1.5MB
const MAX_DIMENSION = 2000;

interface OptimizeResult {
  buffer: Buffer;
  contentType?: string;
  extension?: string;
}

export async function optimizeImageBuffer(file: Express.Multer.File): Promise<OptimizeResult> {
  if (file.mimetype === "image/svg+xml" || file.size < LARGE_IMAGE_THRESHOLD_BYTES) {
    return { buffer: file.buffer };
  }

  try {
    const isAnimated = file.mimetype === "image/gif";

    let pipeline = sharp(file.buffer, { animated: isAnimated }).rotate();

    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

    const buffer = await pipeline.webp({ quality: 80 }).toBuffer();

    return {
      buffer,
      contentType: "image/webp",
      extension: ".webp",
    };
  } catch (error) {
    console.error("Image optimization failed", error);
    return { buffer: file.buffer };
  }
}
