import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import yaml from "js-yaml";

const prisma = new PrismaClient();

type Cfg = {
  members?: string[];
  subjects?: string[];
  default_target?: number;
  group_target?: number;
  deadline_in_days?: number;
};

function loadConfig(): Cfg {
  // config.yaml lives at the repo root, one level above platform/.
  const candidates = [
    path.join(process.cwd(), "..", "config.yaml"),
    path.join(process.cwd(), "config.yaml"),
  ];
  for (const p of candidates) {
    try {
      return (yaml.load(readFileSync(p, "utf8")) as Cfg) ?? {};
    } catch {
      /* try next */
    }
  }
  return {};
}

async function main() {
  const cfg = loadConfig();
  const members = cfg.members?.length ? cfg.members : ["You", "Friend A", "Friend B"];
  const subjects = cfg.subjects?.length
    ? cfg.subjects
    : ["Number Series", "Figure / Picture Series", "Shape Scanning", "Aircraft / Spatial Rotation"];
  const target = cfg.default_target ?? 0.8;
  const groupTarget = cfg.group_target ?? 0.75;
  const deadlineInDays = cfg.deadline_in_days ?? 7;

  // Members — first one is the admin (can upload PDFs / set deadlines).
  for (let i = 0; i < members.length; i++) {
    await prisma.member.upsert({
      where: { name: members[i] },
      update: { isAdmin: i === 0 },
      create: { name: members[i], isAdmin: i === 0 },
    });
  }

  // Subjects
  for (const name of subjects) {
    await prisma.subject.upsert({
      where: { name },
      update: { target },
      create: { name, target },
    });
  }

  // Settings (round window + group target)
  const today = new Date();
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + deadlineInDays);
  const settings: Record<string, string> = {
    roundStart: startOfDay(today).toISOString(),
    deadline: startOfDay(deadline).toISOString(),
    groupTarget: String(groupTarget),
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  if (process.argv.includes("--demo")) await seedDemoScores();

  console.log(
    `Seeded ${members.length} members, ${subjects.length} subjects` +
      (process.argv.includes("--demo") ? " + demo scores." : "."),
  );
}

async function seedDemoScores() {
  const dbMembers = await prisma.member.findMany({ orderBy: { id: "asc" } });
  const dbSubjects = await prisma.subject.findMany({ orderBy: { id: "asc" } });
  const today = new Date();
  const d1 = new Date(today);
  d1.setDate(d1.getDate() - 7);
  const d2 = new Date(today);
  d2.setDate(d2.getDate() - 1);

  // (memberIdx, subjectIdx, date, correct, total) — same shape we validated.
  const rows: [number, number, Date, number, number][] = [
    [0, 0, d1, 14, 20], [0, 0, d2, 17, 20], [0, 1, d2, 16, 20], [0, 2, d2, 9, 20], [0, 3, d2, 15, 20],
    [1, 0, d1, 12, 20], [1, 0, d2, 13, 20], [1, 1, d2, 11, 20], [1, 2, d2, 8, 20], [1, 3, d2, 10, 20],
    [2, 0, d2, 18, 20], [2, 1, d2, 17, 20], [2, 2, d2, 12, 20], [2, 3, d2, 16, 20],
  ];

  // Move the round start before the demo attempts so they count as "submitted".
  await prisma.setting.upsert({
    where: { key: "roundStart" },
    update: { value: startOfDay(d1).toISOString() },
    create: { key: "roundStart", value: startOfDay(d1).toISOString() },
  });

  await prisma.score.deleteMany();
  for (const [mi, si, d, correct, total] of rows) {
    if (mi >= dbMembers.length || si >= dbSubjects.length) continue;
    await prisma.score.create({
      data: {
        memberId: dbMembers[mi].id,
        subjectId: dbSubjects[si].id,
        correct,
        total,
        takenOn: d,
      },
    });
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
