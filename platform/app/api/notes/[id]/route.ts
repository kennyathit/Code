import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// The author of a note, or an admin, may delete it.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json().catch(() => ({}));
    const actorId = Number(body.actorId);
    const note = await prisma.subjectNote.findUnique({ where: { id } });
    if (!note) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const actor = actorId ? await prisma.member.findUnique({ where: { id: actorId } }) : null;
    if (!actor || (actor.id !== note.memberId && !actor.isAdmin)) {
      return NextResponse.json({ error: "You can only delete your own notes." }, { status: 403 });
    }
    await prisma.subjectNote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
