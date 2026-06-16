import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Works with AWS S3 and any S3-compatible store (MinIO, Cloudflare R2,
// Supabase Storage, Backblaze B2). Set S3_ENDPOINT + S3_FORCE_PATH_STYLE
// for non-AWS providers.

const region = process.env.S3_REGION ?? "us-east-1";
const endpoint = process.env.S3_ENDPOINT || undefined;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

export const S3_BUCKET = process.env.S3_BUCKET ?? "";

// Base URL used to build the public link returned to clients. Prefer an
// explicit CDN / public host; otherwise derive one from endpoint + bucket.
const publicBase =
  process.env.S3_PUBLIC_URL ||
  (endpoint
    ? `${endpoint.replace(/\/$/, "")}/${S3_BUCKET}`
    : `https://${S3_BUCKET}.s3.${region}.amazonaws.com`);

let _client: S3Client | null = null;

export function s3() {
  if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials are not set (see .env.example).");
  }
  if (!S3_BUCKET) throw new Error("S3_BUCKET is not set.");
  if (!_client) {
    _client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

export const publicUrl = (key: string) =>
  `${publicBase.replace(/\/$/, "")}/${key}`;

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
) {
  await s3().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, url: publicUrl(key) };
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

// Presigned PUT — lets the browser upload directly, bypassing the API body.
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 60,
) {
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
  return { uploadUrl: url, key, publicUrl: publicUrl(key) };
}
