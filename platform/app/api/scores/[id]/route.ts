import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// An actor may edit/delete a score if they are an admin or they own the score.
async function canEdit(actorId: number, scoreMemberId: number) {
  if (!actorId) return false;
  if (actorId === scoreMemberId) return true;
  const actor = await prisma.member.findUnique({ where: { id: actorId } });
  return Boolean(actor?.isAdmin);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const score = await prisma.score.findUnique({ where: { id } });
    if (!score) return NextResponse.json({ error: "Score not found." }, { status: 404 });
    if (!(await canEdit(Number(body.actorId), score.memberId))) {
      return NextResponse.json({ error: "You can only edit your own scores." }, { status: 403 });
    }

    const correct = Number(body.correct);
    const total = Number(body.total);
    if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "Total must be greater than 0." }, { status: 400 });
    }
    if (correct < 0 || correct > total) {
      return NextResponse.json({ error: "Correct must be between 0 and total." }, { status: 400 });
    }

    await prisma.score.update({
      where: { id },
      data: {
        correct,
        total,
        subjectId: body.subjectId ? Number(body.subjectId) : score.subjectId,
        bookId: body.bookId ? Number(body.bookId) : null,
        takenOn: body.takenOn ? new Date(body.takenOn) : score.takenOn,
        notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : score.notes,
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
    const score = await prisma.score.findUnique({ where: { id } });
    if (!score) return NextResponse.json({ error: "Score not found." }, { status: 404 });
    if (!(await canEdit(Number(body.actorId), score.memberId))) {
      return NextResponse.json({ error: "You can only delete your own scores." }, { status: 403 });
    }
    await prisma.score.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
