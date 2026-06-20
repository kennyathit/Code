import { prisma } from "./db";

// ── Core ranking engine ──────────────────────────────────────────────────────
// Mirrors the spreadsheet semantics (verified earlier):
//   • a score is correct/total (a proportion 0..1)
//   • a member's CURRENT standing on a subject = their MOST RECENT attempt
//   • a subject's GROUP score = average of members' current standings
//   • training priority = subjects sorted ascending (weakest first)

export type SubjectInfo = { id: number; name: string; target: number };
export type MemberInfo = { id: number; name: string; isAdmin: boolean };

export type ScoreboardRow = {
  memberId: number;
  memberName: string;
  cells: Record<number, number | null>; // subjectId -> current proportion
  overall: number | null;
};

export type PriorityRow = {
  subjectId: number;
  name: string;
  groupPct: number | null;
  target: number;
  gap: number | null; // groupPct - target
  weakestMemberName: string | null;
};

export type SubmissionRow = {
  memberId: number;
  memberName: string;
  lastSubmission: string | null;
  attemptsThisRound: number;
  status: "submitted" | "pending" | "late";
};

export type DashboardData = {
  members: MemberInfo[];
  subjects: SubjectInfo[];
  scoreboard: ScoreboardRow[];
  groupAvg: Record<number, number | null>;
  priority: PriorityRow[];
  todayDrill: string | null;
  gaps: { memberId: number; memberName: string; cells: Record<number, number | null> }[];
  submission: SubmissionRow[];
  settings: { roundStart: string | null; deadline: string | null; groupTarget: number };
  hasScores: boolean;
};

const DEFAULT_GROUP_TARGET = 0.75;

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    roundStart: map.roundStart ?? null,
    deadline: map.deadline ?? null,
    groupTarget: map.groupTarget ? Number(map.groupTarget) : DEFAULT_GROUP_TARGET,
  };
}

export async function getDashboard(): Promise<DashboardData> {
  const [members, subjects, scores, settings] = await Promise.all([
    prisma.member.findMany({ orderBy: { id: "asc" } }),
    prisma.subject.findMany({ orderBy: { id: "asc" } }),
    prisma.score.findMany({ orderBy: [{ takenOn: "asc" }, { id: "asc" }] }),
    getSettings(),
  ]);

  // current[memberId][subjectId] = proportion of the latest attempt
  const current = new Map<string, number>();
  const lastByMember = new Map<number, Date>();
  for (const s of scores) {
    const key = `${s.memberId}:${s.subjectId}`;
    // scores are sorted ascending, so the last write wins = most recent.
    if (s.total > 0) current.set(key, s.correct / s.total);
    const prev = lastByMember.get(s.memberId);
    if (!prev || s.takenOn > prev) lastByMember.set(s.memberId, s.takenOn);
  }

  const cur = (m: number, sub: number): number | null => {
    const v = current.get(`${m}:${sub}`);
    return v === undefined ? null : v;
  };

  // Scoreboard + per-member overall
  const scoreboard: ScoreboardRow[] = members.map((m) => {
    const cells: Record<number, number | null> = {};
    const vals: number[] = [];
    for (const sub of subjects) {
      const v = cur(m.id, sub.id);
      cells[sub.id] = v;
      if (v !== null) vals.push(v);
    }
    return {
      memberId: m.id,
      memberName: m.name,
      cells,
      overall: vals.length ? avg(vals) : null,
    };
  });

  // Group average per subject + weakest member
  const groupAvg: Record<number, number | null> = {};
  const weakestMember: Record<number, string | null> = {};
  for (const sub of subjects) {
    const entries = members
      .map((m) => ({ name: m.name, v: cur(m.id, sub.id) }))
      .filter((e) => e.v !== null) as { name: string; v: number }[];
    groupAvg[sub.id] = entries.length ? avg(entries.map((e) => e.v)) : null;
    weakestMember[sub.id] = entries.length
      ? entries.reduce((a, b) => (b.v < a.v ? b : a)).name
      : null;
  }

  // Training priority: subjects with data sorted ascending (weakest first),
  // subjects without data appended at the end.
  const priority: PriorityRow[] = subjects
    .map((sub) => ({
      subjectId: sub.id,
      name: sub.name,
      groupPct: groupAvg[sub.id],
      target: sub.target,
      gap: groupAvg[sub.id] === null ? null : (groupAvg[sub.id] as number) - sub.target,
      weakestMemberName: weakestMember[sub.id],
    }))
    .sort((a, b) => {
      if (a.groupPct === null && b.groupPct === null) return 0;
      if (a.groupPct === null) return 1;
      if (b.groupPct === null) return -1;
      return a.groupPct - b.groupPct;
    });

  const withData = priority.filter((p) => p.groupPct !== null);
  const todayDrill = withData[0]?.name ?? subjects[0]?.name ?? null;

  // Gap analysis: member current - group average
  const gaps = members.map((m) => {
    const cells: Record<number, number | null> = {};
    for (const sub of subjects) {
      const v = cur(m.id, sub.id);
      const g = groupAvg[sub.id];
      cells[sub.id] = v === null || g === null ? null : v - g;
    }
    return { memberId: m.id, memberName: m.name, cells };
  });

  // Submission status for the current round
  const roundStart = settings.roundStart ? new Date(settings.roundStart) : null;
  const deadline = settings.deadline ? new Date(settings.deadline) : null;
  const now = new Date();
  const submission: SubmissionRow[] = members.map((m) => {
    const last = lastByMember.get(m.id) ?? null;
    const attemptsThisRound = roundStart
      ? scores.filter((s) => s.memberId === m.id && s.takenOn >= roundStart).length
      : scores.filter((s) => s.memberId === m.id).length;
    let status: SubmissionRow["status"];
    if (attemptsThisRound > 0) status = "submitted";
    else if (deadline && now > deadline) status = "late";
    else status = "pending";
    return {
      memberId: m.id,
      memberName: m.name,
      lastSubmission: last ? last.toISOString() : null,
      attemptsThisRound,
      status,
    };
  });

  return {
    members: members.map((m) => ({ id: m.id, name: m.name, isAdmin: m.isAdmin })),
    subjects: subjects.map((s) => ({ id: s.id, name: s.name, target: s.target })),
    scoreboard,
    groupAvg,
    priority,
    todayDrill,
    gaps,
    submission,
    settings,
    hasScores: scores.length > 0,
  };
}

function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
