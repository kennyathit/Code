import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export const runtime = "nodejs";

async function isAdmin(actorId: number) {
  if (!actorId) return false;
  const actor = await prisma.member.findUnique({ where: { id: actorId } });
  return Boolean(actor?.isAdmin);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    if (!(await isAdmin(Number(body.actorId)))) {
      return NextResponse.json({ error: "Only an admin can edit materials." }, { status: 403 });
    }
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return NextResponse.json({ error: "Material not found." }, { status: 404 });

    const subjectId = body.subjectId ? Number(body.subjectId) : null;
    const subject = subjectId
      ? await prisma.subject.findUnique({ where: { id: subjectId } })
      : null;
    const maxScore = body.maxScore ? Number(body.maxScore) : null;
    const timeLimitMin = body.timeLimitMin ? Number(body.timeLimitMin) : null;

    await prisma.book.update({
      where: { id },
      data: {
        title: String(body.title || book.title).trim(),
        subjectId: subject?.id ?? null,
        subjects: subject?.name ?? "",
        description: typeof body.description === "string" ? body.description.trim() || null : book.description,
        maxScore: maxScore && maxScore > 0 ? maxScore : null,
        timeLimitMin: timeLimitMin && timeLimitMin > 0 ? timeLimitMin : null,
        deadline: body.deadline ? new Date(body.deadline) : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json().catch(() => ({}));
    if (!(await isAdmin(Number(body.actorId)))) {
      return NextResponse.json({ error: "Only an admin can delete materials." }, { status: 403 });
    }
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return NextResponse.json({ error: "Material not found." }, { status: 404 });

    // Downloads have a RESTRICT FK, so remove them first; scores keep (bookId nulls).
    await prisma.download.deleteMany({ where: { bookId: id } });
    await prisma.book.delete({ where: { id } });
    await deleteFile(book.storageKey);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
