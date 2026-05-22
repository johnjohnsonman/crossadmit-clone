type Status = "enroll" | "accept" | "reject";

type Props = {
  status: Status;
  label?: string;
  /** 목록용 dot + 텍스트 (기본) / 배지 pill */
  variant?: "inline" | "pill";
  className?: string;
};

const LABELS: Record<Status, string> = {
  enroll: "등록",
  accept: "합격",
  reject: "불합격",
};

export function statusFromFlags(isRegist: boolean, isAccept: boolean): Status {
  if (isRegist) return "enroll";
  if (isAccept) return "accept";
  return "reject";
}

export default function StatusBadge({
  status,
  label,
  variant = "inline",
  className = "",
}: Props) {
  const text = label ?? LABELS[status];

  const dotClass =
    status === "enroll"
      ? "h-2 w-2 rounded-full bg-[#2D5A27] shrink-0"
      : status === "accept"
        ? "h-2 w-2 rounded-full border-2 border-blue-500 bg-transparent shrink-0"
        : "h-2 w-2 rounded-full border-2 border-[#9CA3AF] bg-transparent shrink-0";

  const textClass =
    status === "enroll"
      ? "font-semibold text-[#1A1A1A]"
      : status === "accept"
        ? "font-medium text-[#1A1A1A]"
        : "text-[#9CA3AF] line-through";

  if (variant === "pill") {
    const pill =
      status === "enroll"
        ? "bg-[#EBF5EB] text-[#166534] border-l-2 border-[#2D5A27] pl-2"
        : status === "accept"
          ? "bg-[#EBF5EB] text-[#2D5A27]"
          : "bg-[#F5F5F4] text-[#9CA3AF]";
    return (
      <span
        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${pill} ${className}`}
      >
        {text}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={dotClass} aria-hidden />
      <span className={`text-xs ${textClass}`}>{text}</span>
    </span>
  );
}
