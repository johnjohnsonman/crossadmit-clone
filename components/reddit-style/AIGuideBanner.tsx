export default function AIGuideBanner() {
  return (
    <div
      className="my-4 rounded-r-lg border-l-4 border-purple-500 bg-[#F5F3FF] dark:bg-[#2D1B4E]/40 p-4"
      role="note"
    >
      <p className="text-sm text-[#1C1C1C] dark:text-[#D7DADC] leading-relaxed">
        <span className="font-semibold text-purple-800 dark:text-purple-200">
          📚 AI-generated guide
        </span>
        {" — "}
        This content is based on official sources, not personal experiences. For
        student stories and discussions, see user posts in this community.
        Always verify important information with official sources before
        applying or traveling.
      </p>
    </div>
  );
}
