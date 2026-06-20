import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { prisma } from "@/lib/db";
import MemberPicker from "@/components/MemberPicker";

export const metadata: Metadata = {
  title: "TG Pilot Study",
  description: "Thai Airways pilot recruitment study platform",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/scores", label: "Submit score" },
  { href: "/materials", label: "Materials" },
  { href: "/gaps", label: "Gaps" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const members = await prisma.member.findMany({ orderBy: { id: "asc" } });
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="bg-brand text-white shadow">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              ✈️ TG Pilot Study
            </Link>
            <nav className="flex flex-1 flex-wrap gap-4 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:underline">
                  {n.label}
                </Link>
              ))}
            </nav>
            <MemberPicker
              members={members.map((m) => ({ id: m.id, name: m.name, isAdmin: m.isAdmin }))}
            />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
          Train the weakest first • scores = correct ÷ total • built for the TG recruitment group
        </footer>
      </body>
    </html>
  );
}
