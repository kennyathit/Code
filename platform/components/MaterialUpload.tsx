"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelectedMember } from "./MemberPicker";

export default function MaterialUpload({ subjects }: { subjects: { id: number; name: string }[] }) {
  const member = useSelectedMember();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  if (!member) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
        Pick your name in the top-right. Admins can upload materials here.
      </p>
    );
  }
  if (!member.isAdmin) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
        Only the admin uploads materials. You can download anything below.
      </p>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("memberId", String(member!.id));
    setBusy(true);
    try {
      const res = await fetch("/api/materials/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMsg({ kind: "ok", text: "Uploaded. The group can download it now." });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err: any) {
      setMsg({ kind: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Share a book / test (admin)</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Title
          <input
            name="title"
            required
            placeholder="e.g. Number Series — Set 1"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          Type / subject
          <select
            name="subjectId"
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
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-slate-600">
          Max score (questions)
          <input
            name="maxScore"
            type="number"
            min={1}
            placeholder="20"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          Time limit (minutes)
          <input
            name="timeLimitMin"
            type="number"
            min={1}
            placeholder="15"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          Deadline
          <input
            name="deadline"
            type="date"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm text-slate-600">
        Instructions (optional)
        <textarea
          name="description"
          rows={2}
          placeholder="Any notes for the group…"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm text-slate-600">
        PDF file
        <input
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Upload & share"}
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
