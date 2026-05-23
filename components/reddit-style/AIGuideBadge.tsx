type Props = {
  compact?: boolean;
};

export default function AIGuideBadge({ compact }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded text-white bg-purple-600 ${
        compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
      }`}
    >
      🤖 AI Guide
    </span>
  );
}
