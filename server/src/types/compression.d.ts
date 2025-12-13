declare module "compression" {
  import type { RequestHandler } from "express";

  interface CompressionOptions {
    level?: number;
    threshold?: number | string;
    filter?: (req: unknown, res: unknown) => boolean;
    chunkSize?: number;
    windowBits?: number;
    memLevel?: number;
    strategy?: number;
  }

  function compression(options?: CompressionOptions): RequestHandler;

  export default compression;
}
