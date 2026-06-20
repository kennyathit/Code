import { prisma } from "@/lib/db";
import ScoreForm from "@/components/ScoreForm";

export const dynamic = "force-dynamic";

export default async function ScoresPage() {
  const [subjects, books] = await Promise.all([
    prisma.subject.findMany({ orderBy: { id: "asc" } }),
    prisma.book.findMany({ orderBy: { uploadedAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Submit a score</h1>
      <p className="text-slate-500">
        Enter how many you got correct out of the total. The platform turns it into a percentage so
        every subject is comparable.
      </p>
      <ScoreForm
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        books={books.map((b) => ({
          id: b.id,
          name: b.title,
          subjectId: b.subjectId,
          maxScore: b.maxScore,
        }))}
      />
    </div>
  );
}
