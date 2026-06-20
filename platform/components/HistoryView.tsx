"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedMember } from "./MemberPicker";
import LineChart from "./LineChart";
import { fmtDate, fmtPct, pctBg } from "@/lib/format";

type Member = { id: number; name: string; isAdmin: boolean };
type Option = { id: number; name: string };
export type Attempt = {
  id: number;
  memberId: number;
  memberName: string;
  subjectId: number;
  subjectName: string;
  bookId: number | null;
  bookTitle: string | null;
  correct: number;
  total: number;
  takenOn: string; // ISO
  notes: string | null;
};

export default function HistoryView({
  members,
  subjects,
  books,
  attempts,
}: {
  members: Member[];
  subjects: Option[];
  books: Option[];
  attempts: Attempt[];
}) {
  const me = useSelectedMember();
  const router = useRouter();
  const [view, setView] = useState<number | "all">("all");
  const [editing, setEditing] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pctOf = (a: Attempt) => (a.total > 0 ? a.correct / a.total : 0);

  const filtered = useMemo(
    () => (view === "all" ? attempts : attempts.filter((a) => a.memberId === view)),
    [attempts, view],
  );
  const log = useMemo(
    () => [...filtered].sort((a, b) => b.takenOn.localeCompare(a.takenOn)),
    [filtered],
  );

  // Progress charts (only for a single member): one chart per subject they attempted.
  const charts = useMemo(() => {
    if (view === "all") return [];
    const bySubject = new Map<number, Attempt[]>();
    for (const a of filtered) {
      const arr = bySubject.get(a.subjectId) ?? [];
      arr.push(a);
      bySubject.set(a.subjectId, arr);
    }
    return [...bySubject.entries()]
      .map(([subjectId, arr]) => {
        const sorted = [...arr].sort((a, b) => a.takenOn.localeCompare(b.takenOn));
        const avg = sorted.reduce((s, a) => s + pctOf(a), 0) / sorted.length;
        return {
          subjectId,
          name: sorted[0].subjectName,
          attempts: sorted.length,
          avg,
          points: sorted.map((a) => ({ date: fmtDate(a.takenOn), pct: pctOf(a) })),
        };
      })
      .sort((a, b) => a.avg - b.avg);
  }, [filtered, view]);

  function canManage(a: Attempt) {
    return Boolean(me && (me.isAdmin || me.id === a.memberId));
  }

  async function remove(a: Attempt) {
    if (!me) return;
    if (!confirm(`Delete ${a.memberName}'s ${a.subjectName} score (${a.correct}/${a.total})?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/scores/${a.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: me.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* member filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={view === "all"} onClick={() => setView("all")}>
          Everyone
        </FilterChip>
        {members.map((m) => (
          <FilterChip key={m.id} active={view === m.id} onClick={() => setView(m.id)}>
            {m.name}
          </FilterChip>
        ))}
      </div>

      {err && <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">{err}</p>}

      {/* progress charts for one member */}
      {view !== "all" && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">
            Progress — {members.find((m) => m.id === view)?.name}
          </h2>
          {charts.length === 0 ? (
            <p className="text-sm text-slate-400">No mocks logged yet.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {charts.map((c) => (
                <div key={c.subjectId} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-slate-500">
                      {c.attempts} mock{c.attempts === 1 ? "" : "s"} · avg{" "}
                      <span className={`rounded px-1 ${pctBg(c.avg)}`}>{fmtPct(c.avg)}</span>
                    </span>
                  </div>
                  <LineChart points={c.points} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* edit panel */}
      {editing && (
        <EditScore
          attempt={editing}
          subjects={subjects}
          books={books}
          meId={me?.id ?? 0}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {/* activity log */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Activity log</h2>
        {log.length === 0 ? (
          <p className="text-sm text-slate-400">No mocks logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-3">Date</th>
                  {view === "all" && <th className="py-1 pr-3">Member</th>}
                  <th className="py-1 pr-3">Subject</th>
                  <th className="py-1 pr-3">Book</th>
                  <th className="py-1 pr-3">Score</th>
                  <th className="py-1 pr-3">%</th>
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody>
                {log.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(a.takenOn)}</td>
                    {view === "all" && <td className="py-1.5 pr-3 font-medium">{a.memberName}</td>}
                    <td className="py-1.5 pr-3">{a.subjectName}</td>
                    <td className="py-1.5 pr-3 text-slate-500">{a.bookTitle ?? "—"}</td>
                    <td className="py-1.5 pr-3">
                      {a.correct}/{a.total}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span className={`rounded px-1.5 py-0.5 ${pctBg(pctOf(a))}`}>
                        {fmtPct(pctOf(a))}
                      </span>
                    </td>
                    <td className="py-1.5 text-right whitespace-nowrap">
                      {canManage(a) && (
                        <>
                          <button
                            onClick={() => setEditing(a)}
                            className="text-xs text-brand hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => remove(a)}
                            disabled={busy}
                            className="ml-3 text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm ${
        active ? "bg-brand text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function EditScore({
  attempt,
  subjects,
  books,
  meId,
  onClose,
  onSaved,
}: {
  attempt: Attempt;
  subjects: Option[];
  books: Option[];
  meId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [correct, setCorrect] = useState(String(attempt.correct));
  const [total, setTotal] = useState(String(attempt.total));
  const [subjectId, setSubjectId] = useState(String(attempt.subjectId));
  const [bookId, setBookId] = useState(attempt.bookId ? String(attempt.bookId) : "");
  const [takenOn, setTakenOn] = useState(attempt.takenOn.slice(0, 10));
  const [notes, setNotes] = useState(attempt.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/scores/${attempt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: meId,
          correct: Number(correct),
          total: Number(total),
          subjectId: Number(subjectId),
          bookId: bookId || null,
          takenOn,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border-2 border-brand bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold">Edit score — {attempt.memberName}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Subject
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Book (optional)
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">—</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Correct
          <input
            type="number"
            min={0}
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          Out of (total)
          <input
            type="number"
            min={1}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          Date
          <input
            type="date"
            value={takenOn}
            onChange={(e) => setTakenOn(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      {err && <p className="mt-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">{err}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </section>
  );
}
