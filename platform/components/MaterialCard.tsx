"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedMember } from "./MemberPicker";
import DownloadButton from "./DownloadButton";
import { fmtDate } from "@/lib/format";

type Option = { id: number; name: string };
export type Material = {
  id: number;
  title: string;
  subjects: string;
  subjectId: number | null;
  maxScore: number | null;
  timeLimitMin: number | null;
  deadline: string | null; // ISO
  description: string | null;
  fileName: string;
  size: number;
  uploadedAt: string; // ISO
  downloadedBy: string[];
};

function kb(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  if (days < 0)
    return <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">overdue</span>;
  if (days === 0)
    return <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">due today</span>;
  return (
    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
      due in {days} day{days === 1 ? "" : "s"}
    </span>
  );
}

export default function MaterialCard({
  book,
  memberCount,
  subjects,
}: {
  book: Material;
  memberCount: number;
  subjects: Option[];
}) {
  const me = useSelectedMember();
  const router = useRouter();
  const isAdmin = Boolean(me?.isAdmin);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // edit form state
  const [title, setTitle] = useState(book.title);
  const [subjectId, setSubjectId] = useState(book.subjectId ? String(book.subjectId) : "");
  const [maxScore, setMaxScore] = useState(book.maxScore ? String(book.maxScore) : "");
  const [timeLimitMin, setTimeLimitMin] = useState(book.timeLimitMin ? String(book.timeLimitMin) : "");
  const [deadline, setDeadline] = useState(book.deadline ? book.deadline.slice(0, 10) : "");
  const [description, setDescription] = useState(book.description ?? "");

  async function save() {
    if (!me) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/materials/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: me.id,
          title,
          subjectId: subjectId || null,
          maxScore: maxScore || null,
          timeLimitMin: timeLimitMin || null,
          deadline: deadline || null,
          description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!me) return;
    if (!confirm(`Delete "${book.title}"? This removes the PDF for everyone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/materials/${book.id}`, {
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

  if (editing) {
    return (
      <div className="rounded-xl border-2 border-brand bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold">Edit material</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-600">
            Type / subject
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">— choose —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Max score
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-600">
            Time limit (min)
            <input
              type="number"
              value={timeLimitMin}
              onChange={(e) => setTimeLimitMin(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-600">
            Deadline
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-600 sm:col-span-2">
            Instructions
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">(The PDF file itself can&apos;t be swapped — delete and re-upload to change it.)</p>
        {err && <p className="mt-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">{err}</p>}
        <div className="mt-3 flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} className="rounded-md border px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{book.title}</h3>
            {book.subjects && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {book.subjects}
              </span>
            )}
            <DeadlineBadge deadline={book.deadline} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-slate-500">
            {book.maxScore != null && <span>Max score: {book.maxScore}</span>}
            {book.timeLimitMin != null && <span>Time: {book.timeLimitMin} min</span>}
            {book.deadline && <span>Deadline: {fmtDate(book.deadline)}</span>}
          </div>
          {book.description && <p className="mt-1 text-sm text-slate-600">{book.description}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {book.fileName} · {kb(book.size)} · uploaded {fmtDate(book.uploadedAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DownloadButton bookId={book.id} />
          {isAdmin && (
            <div className="flex gap-3 text-xs">
              <button onClick={() => setEditing(true)} className="text-brand hover:underline">
                Edit
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="text-red-600 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Downloaded by {book.downloadedBy.length}/{memberCount}
        {book.downloadedBy.length > 0 && (
          <span className="text-slate-400"> — {book.downloadedBy.join(", ")}</span>
        )}
      </p>
      {err && <p className="mt-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">{err}</p>}
    </div>
  );
}
