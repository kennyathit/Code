"use client";

import { useSelectedMember } from "./MemberPicker";

export default function DownloadButton({ bookId }: { bookId: number }) {
  const member = useSelectedMember();
  const href = `/api/materials/${bookId}/download${member ? `?memberId=${member.id}` : ""}`;
  return (
    <a
      href={href}
      className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
    >
      ⬇ Download
    </a>
  );
}
