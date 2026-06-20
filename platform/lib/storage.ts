import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Storage adapter with two backends, chosen automatically by env:
//   • Supabase Storage  — when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
//     (used on the deployed Vercel app, whose filesystem is ephemeral).
//   • Local disk         — otherwise (zero-setup local development).
// The rest of the app only calls saveFile / readFile / deleteFile.

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || "materials";
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedClient: any;
async function supabase() {
  if (!cachedClient) {
    const { createClient } = await import("@supabase/supabase-js");
    cachedClient = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

/** Persist a file and return an opaque storage key + size in bytes. */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
): Promise<{ key: string; size: number }> {
  const ext = path.extname(originalName).toLowerCase() || ".pdf";
  const key = `${randomUUID()}${ext}`;

  if (useSupabase) {
    const client = await supabase();
    const { error } = await client.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: "application/pdf", upsert: false });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return { key, size: buffer.length };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, key), buffer);
  return { key, size: buffer.length };
}

/** Read a previously saved file by its storage key. */
export async function readFile(key: string): Promise<Buffer> {
  const safe = path.basename(key); // keys are generated, never user paths

  if (useSupabase) {
    const client = await supabase();
    const { data, error } = await client.storage.from(BUCKET).download(safe);
    if (error || !data) throw new Error(error?.message || "File not found");
    return Buffer.from(await data.arrayBuffer());
  }

  return fs.readFile(path.join(UPLOAD_DIR, safe));
}

/** Best-effort delete (used if a DB write fails after the file was saved). */
export async function deleteFile(key: string): Promise<void> {
  const safe = path.basename(key);
  try {
    if (useSupabase) {
      const client = await supabase();
      await client.storage.from(BUCKET).remove([safe]);
    } else {
      await fs.unlink(path.join(UPLOAD_DIR, safe));
    }
  } catch {
    /* ignore */
  }
}
