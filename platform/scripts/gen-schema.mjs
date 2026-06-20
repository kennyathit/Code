// Generates prisma/schema.prod.prisma (Postgres) from the canonical
// prisma/schema.prisma (SQLite). This lets local development stay zero-setup on
// SQLite while the deployed Vercel build targets Supabase Postgres — same models,
// just a different datasource provider.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(dir, "..", "prisma", "schema.prisma");
const out = path.join(dir, "..", "prisma", "schema.prod.prisma");

// Target the provider inside the `datasource` block only (not comments).
const schema = readFileSync(src, "utf8").replace(
  /(datasource\s+\w+\s*\{[\s\S]*?provider\s*=\s*)"sqlite"/,
  '$1"postgresql"',
);

writeFileSync(out, schema);
console.log("Wrote prisma/schema.prod.prisma (provider = postgresql)");
