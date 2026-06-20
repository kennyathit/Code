import Link from "next/link";

export const dynamic = "force-static";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
        {n}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">How to use this site</h1>
        <p className="text-slate-500">
          A 2-minute walkthrough. This is our shared study tracker for the TG (Thai Airways) pilot
          recruitment test — log your mock scores, see who needs to improve where, and share study
          material. Works on any phone or computer, no app to install.
        </p>
      </div>

      <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Everyone — getting started</h2>
        <Step n={1} title="Pick your name">
          Top-right corner → choose your name from the <em>“pick your name”</em> menu. The site
          remembers you on this device, so you only do it once.
        </Step>
        <Step n={2} title="Log a score after every mock">
          Go to <Link href="/scores" className="text-brand hover:underline">Submit score</Link> →
          choose the subject, type how many you got <strong>correct</strong> out of the{" "}
          <strong>total</strong>, pick the date (and the book, if it came from one) → Save. The site
          turns it into a percentage so all subjects compare fairly.
        </Step>
        <Step n={3} title="Read the Dashboard">
          The <Link href="/" className="text-brand hover:underline">Dashboard</Link> shows: the{" "}
          <strong>“Today the group drills”</strong> subject (our weakest, train it first); the{" "}
          <strong>Scoreboard</strong> (each box is the <em>average of all your attempts</em> — red =
          weak, green = strong); the <strong>Training priority</strong> list (weakest → strongest);
          and <strong>Submission status</strong> (who has/hasn’t done this round).
        </Step>
        <Step n={4} title="Track your progress">
          <Link href="/history" className="text-brand hover:underline">History</Link> → pick a
          person to see their <strong>progress graphs</strong> per subject, plus a log of every mock
          (date, book, score). You can edit or remove your own entries here if you mistyped.
        </Step>
        <Step n={5} title="Learn & share tips">
          <Link href="/learn" className="text-brand hover:underline">Learn</Link> → pick a subject to
          read the how-to guide, add your own <strong>strategy tips</strong>, and paste{" "}
          <strong>tutorial links</strong> (YouTube/articles) for the group.
        </Step>
        <Step n={6} title="Get the study material">
          <Link href="/materials" className="text-brand hover:underline">Materials</Link> → download
          the shared book/test PDFs. Each one shows its deadline. Do the mock, then log your score.
        </Step>
        <Step n={7} title="See where you’re behind">
          <Link href="/gaps" className="text-brand hover:underline">Gaps</Link> → shows each person
          vs the group average per subject (red = behind, green = ahead), so we know who to help.
        </Step>
      </section>

      <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Admin only (Kenny)</h2>
        <Step n={1} title="Share a book / test">
          <Link href="/materials" className="text-brand hover:underline">Materials</Link> → fill in
          the title, subject, max score, time limit, deadline, instructions, choose the PDF →{" "}
          <strong>Upload &amp; share</strong>. Everyone can download it. Use Edit/Remove on a card to
          change or delete it.
        </Step>
        <Step n={2} title="Write the how-to guides">
          <Link href="/learn" className="text-brand hover:underline">Learn</Link> → pick a subject →
          <strong> Add guide</strong> to write the recommended method for that part.
        </Step>
        <Step n={3} title="Manage scores">
          On <Link href="/history" className="text-brand hover:underline">History</Link> you can edit
          or remove anyone’s score entry.
        </Step>
      </section>

      <section className="rounded-xl bg-brand/5 p-6 text-sm text-slate-600">
        <h2 className="mb-2 text-base font-semibold text-slate-800">Good to know</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>The headline number per subject is the <strong>average of all</strong> your attempts — so doing more mocks really counts.</li>
          <li>There’s no password — anyone with the link can pick a name, so keep the link inside the group.</li>
          <li>It works the same on iPhone, Android, Mac and Windows — just open the link.</li>
        </ul>
      </section>
    </div>
  );
}
