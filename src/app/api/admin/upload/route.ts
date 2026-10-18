import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { s3, publicBase } from "@/lib/s3";
import { handler, fail, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const FOLDERS = new Set(["services"]);
const MAX_BYTES = 5 * 1024 * 1024;

// Server-side upload (browser -> this API -> S3), so the bucket needs no CORS rules. Admin only.
export const POST = handler(async (req) => {
  await requireAdmin();
  const fd = await req.formData().catch(() => null);
  const file = fd?.get("file");
  const folder = String(fd?.get("folder") ?? "services");

  if (!(file instanceof File)) return fail("No file received");
  if (!FOLDERS.has(folder)) return fail("Invalid upload folder");
  const ext = EXT[file.type];
  if (!ext) return fail("Only JPG, PNG or WebP images are allowed");
  if (file.size > MAX_BYTES) return fail("Image must be smaller than 5 MB");

  const key = `${process.env.S3_PREFIX || "uploads"}/${folder}/${Date.now()}-${randomUUID()}.${ext}`;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (e) {
    console.error("S3 upload failed", e);
    return fail("Upload failed. Please try again.", 502);
  }
  return NextResponse.json({ url: `${publicBase()}/${key}`, key });
});
