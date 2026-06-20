import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveFile, deleteFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const memberId = Number(form.get("memberId"));
  const title = String(form.get("title") || "").trim();
  const subjectId = form.get("subjectId") ? Number(form.get("subjectId")) : null;
  const description = String(form.get("description") || "").trim() || null;
  const maxScore = form.get("maxScore") ? Number(form.get("maxScore")) : null;
  const timeLimitMin = form.get("timeLimitMin") ? Number(form.get("timeLimitMin")) : null;
  const deadlineRaw = String(form.get("deadline") || "").trim();
  const file = form.get("file");

  // Derive the display label from the chosen subject.
  const subject = subjectId
    ? await prisma.subject.findUnique({ where: { id: subjectId } })
    : null;
  const subjects = subject?.name ?? String(form.get("subjects") || "").trim();

  // Only an admin may upload materials.
  const member = memberId ? await prisma.member.findUnique({ where: { id: memberId } }) : null;
  if (!member?.isAdmin) {
    return NextResponse.json({ error: "Only an admin can upload materials." }, { status: 403 });
  }
  if (!title) {
    return NextResponse.json({ error: "Give the material a title." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach a PDF file." }, { status: 400 });
  }
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { key, size } = await saveFile(buffer, file.name);

  try {
    const book = await prisma.book.create({
      data: {
        title,
        subjects,
        subjectId: subject?.id ?? null,
        description,
        maxScore: maxScore && maxScore > 0 ? maxScore : null,
        timeLimitMin: timeLimitMin && timeLimitMin > 0 ? timeLimitMin : null,
        fileName: file.name,
        storageKey: key,
        mime: "application/pdf",
        size,
        deadline: deadlineRaw ? new Date(deadlineRaw) : null,
      },
    });
    return NextResponse.json({ ok: true, id: book.id });
  } catch (err) {
    await deleteFile(key); // don't leave an orphaned file if the DB write fails
    return NextResponse.json({ error: "Could not save the material." }, { status: 500 });
  }
}
