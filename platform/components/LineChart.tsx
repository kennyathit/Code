"use client";

// Tiny dependency-free line chart for a single series of percentages over time.
export default function LineChart({
  points,
}: {
  points: { date: string; pct: number }[];
}) {
  const W = 320;
  const H = 110;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 18;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (points.length === 0) return null;

  const xFor = (i: number) =>
    padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const yFor = (pct: number) => padT + (1 - pct) * innerH; // pct 0..1

  const line = points.map((p, i) => `${xFor(i)},${yFor(p.pct)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img">
      {/* gridlines at 0/50/100% */}
      {[0, 0.5, 1].map((g) => (
        <g key={g}>
          <line
            x1={padL}
            y1={yFor(g)}
            x2={W - padR}
            y2={yFor(g)}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <text x={2} y={yFor(g) + 3} fontSize={9} fill="#94a3b8">
            {Math.round(g * 100)}%
          </text>
        </g>
      ))}
      {/* the line */}
      {points.length > 1 && (
        <polyline points={line} fill="none" stroke="#2F5597" strokeWidth={2} />
      )}
      {/* dots */}
      {points.map((p, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(p.pct)} r={3} fill="#2F5597">
          <title>
            {p.date}: {Math.round(p.pct * 100)}%
          </title>
        </circle>
      ))}
    </svg>
  );
}
