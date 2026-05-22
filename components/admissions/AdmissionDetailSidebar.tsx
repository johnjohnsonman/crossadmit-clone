import Link from "next/link";
import type { AdmissionRecord } from "@/lib/types";
import { schoolDisplayLines } from "@/lib/supabase/map";

type Props = {
  record: AdmissionRecord;
  related: AdmissionRecord[];
  basePath?: string;
};

export default function AdmissionDetailSidebar({
  record,
  related,
  basePath = "/admissions",
}: Props) {
  const crosses = record.crossComparisons ?? [];

  return (
    <aside className="space-y-5">
      {related.length > 0 && (
        <section className="rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
            이 학교의 다른 합격 후기
          </h2>
          <ul className="mt-3 space-y-2">
            {related.map((r) => {
              const lines = schoolDisplayLines(r, "ko");
              const regist = lines.find((l) => l.badge === "등록");
              return (
                <li key={r.id}>
                  <Link
                    href={`${basePath}/${r.id}`}
                    className="block rounded-lg px-2 py-2 hover:bg-[#FAFAF8] transition-colors"
                  >
                    <p className="text-xs text-[#6B7280]">
                      {r.year}년 · {r.admissionSchools[0]?.admissionType || "—"}
                    </p>
                    <p className="text-sm font-medium text-[#1A1A1A] mt-0.5 line-clamp-2">
                      {regist
                        ? `${regist.univ} ${regist.dept}`
                        : r.title || "합격 후기"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {crosses.length > 0 && (
        <section className="rounded-xl border border-[#E5E5E0] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
            관련 크로스어드밋 비교
          </h2>
          <ul className="mt-3 space-y-2">
            {crosses.slice(0, 6).map((c) => (
              <li
                key={c.id}
                className="text-sm text-[#1A1A1A] leading-snug border-b border-[#E5E5E0]/80 pb-2 last:border-0 last:pb-0"
              >
                <span className="font-medium text-[#2D5A27]">
                  {c.univNameWin}
                </span>
                <span className="text-[#6B7280] mx-1">vs</span>
                <span className="font-medium">{c.univNameLose}</span>
                {c.count > 1 && (
                  <span className="ml-1 text-xs text-[#9CA3AF]">
                    ({c.count})
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/crossadmit"
            className="mt-3 inline-block text-xs font-medium text-[#2D5A27] hover:underline"
          >
            크로스어드밋 더보기 →
          </Link>
        </section>
      )}
    </aside>
  );
}
