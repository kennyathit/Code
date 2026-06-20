import { prisma } from "@/lib/db";
import MaterialUpload from "@/components/MaterialUpload";
import MaterialCard from "@/components/MaterialCard";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const [books, memberCount, subjects] = await Promise.all([
    prisma.book.findMany({
      orderBy: { uploadedAt: "desc" },
      include: { downloads: { include: { member: true } } },
    }),
    prisma.member.count(),
    prisma.subject.findMany({ orderBy: { id: "asc" } }),
  ]);

  const subjectOpts = subjects.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materials</h1>
        <p className="text-slate-500">Shared books &amp; PDFs. Admin uploads, everyone downloads.</p>
      </div>

      <MaterialUpload subjects={subjectOpts} />

      <div className="space-y-3">
        {books.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">
            No materials yet.
          </p>
        )}
        {books.map((b) => (
          <MaterialCard
            key={b.id}
            memberCount={memberCount}
            subjects={subjectOpts}
            book={{
              id: b.id,
              title: b.title,
              subjects: b.subjects,
              subjectId: b.subjectId,
              maxScore: b.maxScore,
              timeLimitMin: b.timeLimitMin,
              deadline: b.deadline ? b.deadline.toISOString() : null,
              description: b.description,
              fileName: b.fileName,
              size: b.size,
              uploadedAt: b.uploadedAt.toISOString(),
              downloadedBy: b.downloads.map((d) => d.member.name),
            }}
          />
        ))}
      </div>
    </div>
  );
}
