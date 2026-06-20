import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Storage adapter. Local-first: files live on disk under data/uploads.
// To deploy free, swap the body of save/read for Supabase Storage or
// Cloudflare R2 (same function signatures) — nothing else needs to change.

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/** Persist a file and return an opaque storage key + size in bytes. */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
): Promise<{ key: string; size: number }> {
  await ensureDir();
  const ext = path.extname(originalName).toLowerCase() || ".pdf";
  const key = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, key), buffer);
  return { key, size: buffer.length };
}

/** Read a previously saved file by its storage key. */
export async function readFile(key: string): Promise<Buffer> {
  // Guard against path traversal — keys are generated, never user-supplied paths.
  const safe = path.basename(key);
  return fs.readFile(path.join(UPLOAD_DIR, safe));
}

/** Best-effort delete (used if a DB write fails after the file was saved). */
export async function deleteFile(key: string): Promise<void> {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(key)));
  } catch {
    /* ignore */
  }
}
