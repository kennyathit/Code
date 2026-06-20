import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Admin edits the "how to approach" guide for a subject.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const actorId = Number(body.actorId);
    const actor = actorId ? await prisma.member.findUnique({ where: { id: actorId } }) : null;
    if (!actor?.isAdmin) {
      return NextResponse.json({ error: "Only an admin can edit the guide." }, { status: 403 });
    }
    const howTo = typeof body.howTo === "string" ? body.howTo.trim().slice(0, 4000) || null : null;
    await prisma.subject.update({ where: { id }, data: { howTo } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
