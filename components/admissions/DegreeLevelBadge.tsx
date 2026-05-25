import {
  degreeLevelLabel,
  DEGREE_LEVEL_BADGE_CLASS,
  shouldShowDegreeBadge,
  type DegreeLevel,
} from "@/lib/admissions/degree-level";

type Props = {
  level?: string | null;
  locale?: "ko" | "en";
  className?: string;
};

export default function DegreeLevelBadge({
  level,
  locale = "ko",
  className = "",
}: Props) {
  if (!shouldShowDegreeBadge(level)) return null;

  const label = degreeLevelLabel(level as DegreeLevel, locale);
  const colors = DEGREE_LEVEL_BADGE_CLASS[level];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight ${colors} ${className}`}
    >
      {label}
    </span>
  );
}
