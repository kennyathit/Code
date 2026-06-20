import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Any signed-in (name-picked) member may add a strategy tip or a tutorial link.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const memberId = Number(body.memberId);
    const subjectId = Number(body.subjectId);
    const kind = body.kind === "link" ? "link" : "tip";
    const text = String(body.body || "").trim().slice(0, 1000);
    const url = kind === "link" ? String(body.url || "").trim().slice(0, 500) : null;

    if (!memberId) return NextResponse.json({ error: "Pick your name first." }, { status: 400 });
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: "Unknown member." }, { status: 400 });
    if (!subjectId) return NextResponse.json({ error: "Missing subject." }, { status: 400 });
    if (!text) return NextResponse.json({ error: "Write something first." }, { status: 400 });
    if (kind === "link" && !/^https?:\/\//i.test(url || "")) {
      return NextResponse.json({ error: "Enter a valid link (https://…)." }, { status: 400 });
    }

    const note = await prisma.subjectNote.create({
      data: { memberId, subjectId, kind, body: text, url },
    });
    return NextResponse.json({ ok: true, id: note.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
