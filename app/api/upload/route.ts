import { getUser, ok, error, unauthorized } from "@/lib/api";
import { uploadObject } from "@/lib/s3";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

// POST multipart/form-data: file=<image>, kind=logo|signature
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return error("file field is required");

  const ext = EXT[file.type];
  if (!ext) return error(`Unsupported type: ${file.type || "unknown"}`, 415);
  if (file.size > MAX_BYTES) return error("File too large (max 4MB)", 413);

  const kind = form?.get("kind") === "signature" ? "signatures" : "logos";
  const key = `${kind}/${u.id}/${crypto.randomUUID()}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadObject(key, buf, file.type);
    return ok(result, 201);
  } catch (e) {
    return error(
      e instanceof Error ? e.message : "Upload failed",
      500,
    );
  }
}
