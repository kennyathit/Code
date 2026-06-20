import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const memberId = Number(body.memberId);
  const subjectId = Number(body.subjectId);
  const correct = Number(body.correct);
  const total = Number(body.total);
  const bookId = body.bookId ? Number(body.bookId) : null;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;
  const takenOn = body.takenOn ? new Date(body.takenOn) : new Date();

  if (!memberId || !subjectId) {
    return NextResponse.json({ error: "Pick your name and a subject." }, { status: 400 });
  }
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: "Total must be greater than 0." }, { status: 400 });
  }
  if (correct < 0 || correct > total) {
    return NextResponse.json({ error: "Correct must be between 0 and total." }, { status: 400 });
  }

  const score = await prisma.score.create({
    data: { memberId, subjectId, correct, total, bookId, notes, takenOn },
  });

  return NextResponse.json({ ok: true, id: score.id, pct: correct / total });
}
