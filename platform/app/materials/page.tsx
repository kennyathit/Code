import { prisma } from "@/lib/db";
import MaterialUpload from "@/components/MaterialUpload";
import DownloadButton from "@/components/DownloadButton";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function kb(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function deadlineBadge(deadline: Date | null) {
  if (!deadline) return null;
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">overdue</span>;
  if (days === 0) return <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">due today</span>;
  return (
    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
      due in {days} day{days === 1 ? "" : "s"}
    </span>
  );
}

export default async function MaterialsPage() {
  const [books, memberCount, subjects] = await Promise.all([
    prisma.book.findMany({
      orderBy: { uploadedAt: "desc" },
      include: { downloads: { include: { member: true } } },
    }),
    prisma.member.count(),
    prisma.subject.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materials</h1>
        <p className="text-slate-500">Shared books &amp; PDFs. Admin uploads, everyone downloads.</p>
      </div>

      <MaterialUpload subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />

      <div className="space-y-3">
        {books.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">
            No materials yet.
          </p>
        )}
        {books.map((b) => (
          <div key={b.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                  {b.subjects && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {b.subjects}
                    </span>
                  )}
                  {deadlineBadge(b.deadline)}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-slate-500">
                  {b.maxScore != null && <span>Max score: {b.maxScore}</span>}
                  {b.timeLimitMin != null && <span>Time: {b.timeLimitMin} min</span>}
                  {b.deadline && <span>Deadline: {fmtDate(b.deadline.toISOString())}</span>}
                </div>
                {b.description && <p className="mt-1 text-sm text-slate-600">{b.description}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {b.fileName} · {kb(b.size)} · uploaded {fmtDate(b.uploadedAt.toISOString())}
                </p>
              </div>
              <DownloadButton bookId={b.id} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Downloaded by {b.downloads.length}/{memberCount}
              {b.downloads.length > 0 && (
                <span className="text-slate-400">
                  {" "}
                  — {b.downloads.map((d) => d.member.name).join(", ")}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
