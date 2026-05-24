import {
  admitTrackLabel,
  ADMIT_TRACK_BADGE_CLASS,
  isAdmitTrack,
  type AdmitTrack,
} from "@/lib/admissions/admit-track";

type Props = {
  track?: string | null;
  locale?: "ko" | "en";
  className?: string;
};

export default function AdmitTrackBadge({
  track,
  locale = "ko",
  className = "",
}: Props) {
  const key: AdmitTrack =
    track && isAdmitTrack(track) ? track : "unknown";
  const label = admitTrackLabel(key, locale);
  const colors = ADMIT_TRACK_BADGE_CLASS[key];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight ${colors} ${className}`}
    >
      {label}
    </span>
  );
}
