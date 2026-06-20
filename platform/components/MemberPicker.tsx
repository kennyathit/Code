"use client";

import { useEffect, useState } from "react";

export type SelectedMember = { id: number; name: string; isAdmin: boolean };

const KEY = "tg_member";

export function getSelectedMember(): SelectedMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SelectedMember) : null;
  } catch {
    return null;
  }
}

export function useSelectedMember(): SelectedMember | null {
  const [member, setMember] = useState<SelectedMember | null>(null);
  useEffect(() => {
    setMember(getSelectedMember());
    const handler = () => setMember(getSelectedMember());
    window.addEventListener("tg-member-changed", handler);
    return () => window.removeEventListener("tg-member-changed", handler);
  }, []);
  return member;
}

export default function MemberPicker({ members }: { members: SelectedMember[] }) {
  const [selected, setSelected] = useState<SelectedMember | null>(null);

  useEffect(() => setSelected(getSelectedMember()), []);

  function choose(id: number) {
    const m = members.find((x) => x.id === id) ?? null;
    setSelected(m);
    if (m) localStorage.setItem(KEY, JSON.stringify(m));
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("tg-member-changed"));
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden sm:inline text-white/80">You are</span>
      <select
        value={selected?.id ?? ""}
        onChange={(e) => choose(Number(e.target.value))}
        className="rounded-md border-0 bg-white/95 px-2 py-1 text-slate-800 shadow-sm"
      >
        <option value="">— pick your name —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.isAdmin ? " (admin)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
