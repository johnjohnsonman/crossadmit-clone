type Source =
  | "naver_blog"
  | "naver_news"
  | "reddit"
  | "quora"
  | "youtube"
  | "university_official"
  | "studyinkorea"
  | string;

const STYLES: Record<string, { label: string; className: string }> = {
  naver_blog: { label: "네이버", className: "bg-[#EBF5EB] text-[#2D5A27]" },
  naver_news: { label: "네이버", className: "bg-[#EBF5EB] text-[#2D5A27]" },
  reddit: { label: "Reddit", className: "bg-orange-50 text-orange-700" },
  quora: { label: "Quora", className: "bg-blue-50 text-blue-700" },
  youtube: { label: "유튜브", className: "bg-red-50 text-red-700" },
  university_official: { label: "공식", className: "bg-blue-50 text-blue-700" },
  studyinkorea: { label: "공식", className: "bg-blue-50 text-blue-700" },
};

type Props = {
  source: Source;
  className?: string;
};

export default function SourceBadge({ source, className = "" }: Props) {
  const meta = STYLES[source] ?? {
    label: source,
    className: "bg-[#F5F5F4] text-[#6B7280]",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  );
}
