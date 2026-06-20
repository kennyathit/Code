import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    return NextResponse.json({ error: "Material not found." }, { status: 404 });
  }

  // Record who downloaded (best effort — never blocks the download).
  const memberId = Number(new URL(req.url).searchParams.get("memberId"));
  if (memberId) {
    try {
      await prisma.download.upsert({
        where: { bookId_memberId: { bookId: id, memberId } },
        update: { downloadedAt: new Date() },
        create: { bookId: id, memberId },
      });
    } catch {
      /* ignore */
    }
  }

  let data: Buffer;
  try {
    data = await readFile(book.storageKey);
  } catch {
    return NextResponse.json({ error: "File is missing on disk." }, { status: 410 });
  }

  const asciiName = book.fileName.replace(/[^\x20-\x7e]/g, "_");
  return new NextResponse(data, {
    headers: {
      "Content-Type": book.mime || "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"`,
      "Content-Length": String(data.length),
    },
  });
}
