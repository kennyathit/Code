export function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${Math.round(v * 100)}%`;
}

export function fmtGap(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const p = Math.round(v * 100);
  return `${p >= 0 ? "+" : ""}${p}%`;
}

// Score color (full classes so Tailwind keeps them).
export function pctBg(v: number | null | undefined): string {
  if (v === null || v === undefined) return "bg-slate-100 text-slate-400";
  if (v < 0.5) return "bg-red-200 text-red-900";
  if (v < 0.7) return "bg-orange-200 text-orange-900";
  if (v < 0.85) return "bg-yellow-200 text-yellow-900";
  return "bg-green-200 text-green-900";
}

// Gap color: behind (red) vs ahead (green).
export function gapBg(v: number | null | undefined): string {
  if (v === null || v === undefined) return "bg-slate-100 text-slate-400";
  if (v <= -0.1) return "bg-red-300 text-red-900";
  if (v < -0.02) return "bg-red-100 text-red-800";
  if (v >= 0.1) return "bg-green-300 text-green-900";
  if (v > 0.02) return "bg-green-100 text-green-800";
  return "bg-slate-100 text-slate-500";
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
