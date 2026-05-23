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
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-sm font-semibold tracking-tight text-white">
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
                    className="block rounded-lg px-2 py-2 hover:bg-gray-800 transition-colors"
                  >
                    <p className="text-xs text-gray-400">
                      {r.year}년 · {r.admissionSchools[0]?.admissionType || "—"}
                    </p>
                    <p className="text-sm font-medium text-gray-200 mt-0.5 line-clamp-2">
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
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            관련 크로스어드밋 비교
          </h2>
          <ul className="mt-3 space-y-2">
            {crosses.slice(0, 6).map((c) => (
              <li
                key={c.id}
                className="text-sm text-gray-200 leading-snug border-b border-gray-800 pb-2 last:border-0 last:pb-0"
              >
                <span className="font-medium text-orange-400">
                  {c.univNameWin}
                </span>
                <span className="text-gray-500 mx-1">vs</span>
                <span className="font-medium">{c.univNameLose}</span>
                {c.count > 1 && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({c.count})
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/crossadmit"
            className="mt-3 inline-block text-xs font-medium text-orange-400 hover:text-orange-300"
          >
            크로스어드밋 더보기 →
          </Link>
        </section>
      )}
    </aside>
  );
}
