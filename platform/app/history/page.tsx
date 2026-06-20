import { prisma } from "@/lib/db";
import HistoryView, { Attempt } from "@/components/HistoryView";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [members, subjects, books, scores] = await Promise.all([
    prisma.member.findMany({ orderBy: { id: "asc" } }),
    prisma.subject.findMany({ orderBy: { id: "asc" } }),
    prisma.book.findMany({ orderBy: { uploadedAt: "desc" } }),
    prisma.score.findMany({
      orderBy: [{ takenOn: "asc" }, { id: "asc" }],
      include: { member: true, subject: true, book: true },
    }),
  ]);

  const attempts: Attempt[] = scores.map((s) => ({
    id: s.id,
    memberId: s.memberId,
    memberName: s.member.name,
    subjectId: s.subjectId,
    subjectName: s.subject.name,
    bookId: s.bookId,
    bookTitle: s.book?.title ?? null,
    correct: s.correct,
    total: s.total,
    takenOn: s.takenOn.toISOString(),
    notes: s.notes,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-slate-500">
          Every mock you&apos;ve done. Pick a person to see their progress graphs; the activity log
          below lists each attempt (date, book, score).
        </p>
      </div>
      <HistoryView
        members={members.map((m) => ({ id: m.id, name: m.name, isAdmin: m.isAdmin }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        books={books.map((b) => ({ id: b.id, name: b.title }))}
        attempts={attempts}
      />
    </div>
  );
}
