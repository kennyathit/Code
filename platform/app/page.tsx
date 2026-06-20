import Link from "next/link";
import { getDashboard } from "@/lib/metrics";
import { fmtPct, pctBg, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const d = await getDashboard();

  if (!d.members.length || !d.subjects.length) {
    return (
      <EmptyState
        title="Almost there"
        body="No members or subjects yet. Run the seed (npm run setup) to load them from config.yaml."
      />
    );
  }

  return (
    <div className="space-y-8">
      <p className="rounded-lg bg-brand/5 px-4 py-2 text-sm text-slate-600">
        👋 New here?{" "}
        <Link href="/guide" className="font-medium text-brand hover:underline">
          Read the quick guide
        </Link>{" "}
        on how to use this site.
      </p>

      {/* Today's drill */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-slate-400">Today the group drills</p>
        <p className="mt-1 text-3xl font-bold text-brand">
          {d.hasScores ? d.todayDrill : "Add scores to get a recommendation"}
        </p>
        {d.hasScores && (
          <p className="mt-1 text-sm text-slate-500">
            This is the group&apos;s weakest subject right now — train it first.
          </p>
        )}
      </section>

      {/* Scoreboard */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Scoreboard</h2>
          <Link href="/scores" className="text-sm text-brand hover:underline">
            + Submit a score
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white px-3 py-2 text-left font-semibold">Member</th>
                {d.subjects.map((s) => (
                  <th key={s.id} className="px-2 py-2 text-center font-medium text-slate-600">
                    {s.name}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-semibold">Overall</th>
              </tr>
            </thead>
            <tbody>
              {d.scoreboard.map((row) => (
                <tr key={row.memberId} className="border-t">
                  <td className="sticky left-0 bg-white px-3 py-2 font-medium">{row.memberName}</td>
                  {d.subjects.map((s) => (
                    <td key={s.id} className="px-1 py-1 text-center">
                      <span
                        className={`inline-block min-w-[3rem] rounded px-2 py-1 ${pctBg(row.cells[s.id])}`}
                      >
                        {fmtPct(row.cells[s.id])}
                      </span>
                    </td>
                  ))}
                  <td className="px-2 py-1 text-center font-semibold">{fmtPct(row.overall)}</td>
                </tr>
              ))}
              <tr className="border-t-2 bg-slate-50 font-semibold">
                <td className="sticky left-0 bg-slate-50 px-3 py-2">Group avg</td>
                {d.subjects.map((s) => (
                  <td key={s.id} className="px-2 py-2 text-center">
                    {fmtPct(d.groupAvg[s.id])}
                  </td>
                ))}
                <td className="px-2 py-2" />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Each cell is the average of all that member&apos;s attempts. Red = weak, green = strong. See{" "}
          <Link href="/history" className="text-brand hover:underline">
            History
          </Link>{" "}
          for every mock.
        </p>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Training priority */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Training priority (weakest → strongest)</h2>
          <ol className="space-y-2">
            {d.priority.map((p, i) => (
              <li
                key={p.subjectId}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="font-medium">{p.name}</span>
                </span>
                <span className="text-right text-sm">
                  <span className={`rounded px-2 py-0.5 ${pctBg(p.groupPct)}`}>
                    {fmtPct(p.groupPct)}
                  </span>
                  {p.weakestMemberName && (
                    <span className="ml-2 text-xs text-slate-400">↓ {p.weakestMemberName}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Submission status */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Submission status</h2>
            <span className="text-xs text-slate-400">Deadline {fmtDate(d.settings.deadline)}</span>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Member</th>
                <th className="py-1">Last</th>
                <th className="py-1 text-center">This round</th>
                <th className="py-1 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {d.submission.map((s) => (
                <tr key={s.memberId} className="border-t">
                  <td className="py-1.5 font-medium">{s.memberName}</td>
                  <td className="py-1.5 text-slate-500">{fmtDate(s.lastSubmission)}</td>
                  <td className="py-1.5 text-center">{s.attemptsThisRound}</td>
                  <td className="py-1.5 text-right">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "submitted" | "pending" | "late" }) {
  const map = {
    submitted: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    late: "bg-red-100 text-red-800",
  } as const;
  const label = { submitted: "submitted ✓", pending: "pending", late: "LATE" } as const;
  return <span className={`rounded px-2 py-0.5 text-xs ${map[status]}`}>{label[status]}</span>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-500">{body}</p>
    </div>
  );
}
