"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelectedMember } from "./MemberPicker";

type Subject = { id: number; name: string };
type BookOption = { id: number; name: string; subjectId: number | null; maxScore: number | null };

export default function ScoreForm({
  subjects,
  books,
}: {
  subjects: Subject[];
  books: BookOption[];
}) {
  const member = useSelectedMember();
  const router = useRouter();
  const [subjectId, setSubjectId] = useState("");
  const [correct, setCorrect] = useState("");
  const [total, setTotal] = useState("20");
  const [bookId, setBookId] = useState("");
  const [takenOn, setTakenOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Picking an assignment prefills its subject + max score.
  function chooseBook(id: string) {
    setBookId(id);
    const b = books.find((x) => String(x.id) === id);
    if (b?.subjectId) setSubjectId(String(b.subjectId));
    if (b?.maxScore) setTotal(String(b.maxScore));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!member) {
      setMsg({ kind: "err", text: "Pick your name in the top-right first." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          subjectId: Number(subjectId),
          correct: Number(correct),
          total: Number(total),
          bookId: bookId || null,
          takenOn,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMsg({
        kind: "ok",
        text: `Saved ${correct}/${total} (${Math.round(data.pct * 100)}%) for ${member.name}.`,
      });
      setCorrect("");
      setNotes("");
      router.refresh();
    } catch (err: any) {
      setMsg({ kind: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">
        Logging as <span className="font-semibold">{member?.name ?? "— pick your name above —"}</span>
      </p>

      <Field label="Subject">
        <select
          required
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="">Choose a subject…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Correct">
          <input
            required
            type="number"
            min={0}
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label="Out of (total)">
          <input
            required
            type="number"
            min={1}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date">
          <input
            type="date"
            value={takenOn}
            onChange={(e) => setTakenOn(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
        <Field label="From assignment (optional)">
          <select
            value={bookId}
            onChange={(e) => chooseBook(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">—</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes (optional)">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save score"}
      </button>

      {msg && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            msg.kind === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
