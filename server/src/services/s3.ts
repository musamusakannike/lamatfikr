import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "../config/env";

let client: S3Client | null = null;

export function getR2Client() {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 is not configured");
  }

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
}

export async function uploadBufferToR2(args: {
  key: string;
  contentType: string;
  buffer: Buffer;
}) {
  if (!env.R2_BUCKET) {
    throw new Error("R2_BUCKET is not configured");
  }

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: args.key,
      Body: args.buffer,
      ContentType: args.contentType,
    })
  );

  const url = env.R2_PUBLIC_BASE_URL ? `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${args.key}` : undefined;

  return {
    bucket: env.R2_BUCKET,
    key: args.key,
    url,
  };
}
