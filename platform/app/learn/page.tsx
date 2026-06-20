import { prisma } from "@/lib/db";
import LearnView, { Note } from "@/components/LearnView";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const [subjects, notes] = await Promise.all([
    prisma.subject.findMany({ orderBy: { id: "asc" } }),
    prisma.subjectNote.findMany({
      orderBy: { createdAt: "asc" },
      include: { member: true },
    }),
  ]);

  const noteData: Note[] = notes.map((n) => ({
    id: n.id,
    subjectId: n.subjectId,
    memberId: n.memberId,
    memberName: n.member.name,
    kind: n.kind === "link" ? "link" : "tip",
    body: n.body,
    url: n.url,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Learn</h1>
        <p className="text-slate-500">
          For each part: a how-to guide, the group&apos;s strategy tips, and tutorial links. Pick a
          subject and add what you know.
        </p>
      </div>
      <LearnView
        subjects={subjects.map((s) => ({ id: s.id, name: s.name, howTo: s.howTo }))}
        notes={noteData}
      />
    </div>
  );
}
