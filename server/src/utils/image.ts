import sharp from "sharp";

const LARGE_IMAGE_THRESHOLD_BYTES = 500 * 1024; // 500KB - compress smaller files too
const MEDIUM_IMAGE_THRESHOLD_BYTES = 2 * 1024 * 1024; // 2MB
const LARGE_IMAGE_THRESHOLD_COMPRESS = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 2048;
const MAX_DIMENSION_LARGE = 1920;
const MAX_DIMENSION_HUGE = 1440;

interface OptimizeResult {
  buffer: Buffer;
  contentType?: string;
  extension?: string;
}

export async function optimizeImageBuffer(file: Express.Multer.File): Promise<OptimizeResult> {
  if (file.mimetype === "image/svg+xml") {
    return { buffer: file.buffer };
  }

  try {
    const isAnimated = file.mimetype === "image/gif";
    let pipeline = sharp(file.buffer, { animated: isAnimated }).rotate();

    // Determine compression level based on file size
    let maxDimension = MAX_DIMENSION;
    let quality = 85;
    let format = "webp";

    if (file.size > LARGE_IMAGE_THRESHOLD_COMPRESS) {
      maxDimension = MAX_DIMENSION_HUGE;
      quality = 75;
    } else if (file.size > MEDIUM_IMAGE_THRESHOLD_BYTES) {
      maxDimension = MAX_DIMENSION_LARGE;
      quality = 80;
    } else if (file.size < LARGE_IMAGE_THRESHOLD_BYTES) {
      // For small files, only compress if quality can be improved
      const metadata = await sharp(file.buffer).metadata();
      if (metadata.format === "webp" || metadata.format === "png") {
        return { buffer: file.buffer };
      }
      quality = 82;
    }

    pipeline = pipeline.resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    });

    // Use WebP for better compression, but keep original format for very small files
    if (file.size < LARGE_IMAGE_THRESHOLD_BYTES && (file.mimetype === "image/png" || file.mimetype === "image/jpeg")) {
      // Keep original format for small optimized files
      if (file.mimetype === "image/png") {
        const buffer = await pipeline.png({ quality: 90, compressionLevel: 9 }).toBuffer();
        return {
          buffer,
          contentType: "image/png",
          extension: ".png",
        };
      } else {
        const buffer = await pipeline.jpeg({ quality: 90, progressive: true }).toBuffer();
        return {
          buffer,
          contentType: "image/jpeg",
          extension: ".jpg",
        };
      }
    }

    const buffer = await pipeline.webp({ 
      quality, 
      effort: 6, // Higher compression effort for better results
      smartSubsample: true 
    }).toBuffer();

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
