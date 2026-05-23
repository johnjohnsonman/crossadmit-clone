type Props = {
  compact?: boolean;
};

export default function AIGuideBadge({ compact }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded ${
        compact
          ? "text-[10px] px-1.5 py-0.5"
          : "text-xs px-2 py-0.5"
      } bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100 border border-purple-300 dark:border-purple-700`}
    >
      🤖 AI Guide
    </span>
  );
}
