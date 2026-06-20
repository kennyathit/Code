"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedMember } from "./MemberPicker";

type Subject = { id: number; name: string; howTo: string | null };
export type Note = {
  id: number;
  subjectId: number;
  memberId: number;
  memberName: string;
  kind: "tip" | "link";
  body: string;
  url: string | null;
};

export default function LearnView({
  subjects,
  notes,
}: {
  subjects: Subject[];
  notes: Note[];
}) {
  const me = useSelectedMember();
  const router = useRouter();
  const [sid, setSid] = useState<number>(subjects[0]?.id ?? 0);
  const subject = subjects.find((s) => s.id === sid);

  const tips = useMemo(
    () => notes.filter((n) => n.subjectId === sid && n.kind === "tip"),
    [notes, sid],
  );
  const links = useMemo(
    () => notes.filter((n) => n.subjectId === sid && n.kind === "link"),
    [notes, sid],
  );

  if (!subject) return <p className="text-slate-500">Add subjects first.</p>;

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-600">Subject</span>
        <select
          value={sid}
          onChange={(e) => setSid(Number(e.target.value))}
          className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <HowTo subject={subject} isAdmin={Boolean(me?.isAdmin)} meId={me?.id ?? 0} />

      <div className="grid gap-6 md:grid-cols-2">
        <NoteColumn
          title="💡 Strategy tips"
          empty="No tips yet — add the first one."
          notes={tips}
          kind="tip"
          subjectId={sid}
        />
        <NoteColumn
          title="🎥 Tutorials & links"
          empty="No links yet — paste a YouTube or article URL."
          notes={links}
          kind="link"
          subjectId={sid}
        />
      </div>
    </div>
  );
}

function HowTo({
  subject,
  isAdmin,
  meId,
}: {
  subject: Subject;
  isAdmin: boolean;
  meId: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(subject.howTo ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch(`/api/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: meId, howTo: text }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">How to approach {subject.name}</h2>
        {isAdmin && !editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-brand hover:underline">
            {subject.howTo ? "Edit" : "Add guide"}
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Describe the best method/steps for this part…"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <div className="mt-2 flex gap-2">
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
      ) : subject.howTo ? (
        <p className="whitespace-pre-wrap text-slate-700">{subject.howTo}</p>
      ) : (
        <p className="text-sm text-slate-400">No guide yet{isAdmin ? " — add one." : "."}</p>
      )}
    </section>
  );
}

function NoteColumn({
  title,
  empty,
  notes,
  kind,
  subjectId,
}: {
  title: string;
  empty: string;
  notes: Note[];
  kind: "tip" | "link";
  subjectId: number;
}) {
  const me = useSelectedMember();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    if (!me) {
      setErr("Pick your name (top-right) first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: me.id, subjectId, kind, body, url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      setBody("");
      setUrl("");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function del(id: number) {
    if (!me) return;
    setBusy(true);
    try {
      await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: me.id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function canDelete(n: Note) {
    return Boolean(me && (me.isAdmin || me.id === n.memberId));
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <ul className="space-y-2">
        {notes.length === 0 && <li className="text-sm text-slate-400">{empty}</li>}
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                {n.kind === "link" && n.url ? (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand hover:underline"
                  >
                    {n.body || n.url}
                  </a>
                ) : (
                  <span className="text-slate-700">{n.body}</span>
                )}
                <span className="ml-2 text-xs text-slate-400">— {n.memberName}</span>
              </div>
              {canDelete(n) && (
                <button
                  onClick={() => del(n.id)}
                  disabled={busy}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-2 border-t pt-3">
        {kind === "link" && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder={kind === "tip" ? "Share a strategy/tip…" : "Title for this link…"}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={add}
          disabled={busy}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {kind === "tip" ? "Add tip" : "Add link"}
        </button>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>
    </section>
  );
}
