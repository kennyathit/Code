import { getDashboard } from "@/lib/metrics";
import { fmtGap, gapBg } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GapsPage() {
  const d = await getDashboard();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Gap analysis</h1>
        <p className="text-slate-500">
          Each member compared to the group average per subject. Red = behind the group (needs
          focus), green = ahead.
        </p>
      </div>

      <section className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-left font-semibold">Member</th>
              {d.subjects.map((s) => (
                <th key={s.id} className="px-2 py-2 text-center font-medium text-slate-600">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.gaps.map((row) => (
              <tr key={row.memberId} className="border-t">
                <td className="sticky left-0 bg-white px-3 py-2 font-medium">{row.memberName}</td>
                {d.subjects.map((s) => (
                  <td key={s.id} className="px-1 py-1 text-center">
                    <span
                      className={`inline-block min-w-[3rem] rounded px-2 py-1 ${gapBg(row.cells[s.id])}`}
                    >
                      {fmtGap(row.cells[s.id])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
