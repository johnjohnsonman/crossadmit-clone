import AIGuideBadge from "./AIGuideBadge";

type Props = {
  sources?: string[] | null;
  lastUpdated?: string | null;
};

function parseSources(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s)).filter((s) => s.startsWith("http"));
  }
  return [];
}

export default function AIGuideBanner({ sources, lastUpdated }: Props) {
  const urls = parseSources(sources);
  const updated =
    lastUpdated ?
      new Date(lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="mb-4 rounded-lg border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <AIGuideBadge />
        <span className="text-xs font-medium text-purple-800 dark:text-purple-200">
          AI Generated · Verified Sources
        </span>
      </div>
      <p className="text-sm text-purple-950 dark:text-purple-100 leading-relaxed">
        📚 This is an AI-generated guide based on official sources. For personal
        experiences, see user posts below. Always verify important information
        with official sources before applying or traveling.
      </p>
      {urls.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
          <p className="text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
            Sources
          </p>
          <ul className="space-y-1 text-sm">
            {urls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 dark:text-purple-300 hover:underline break-all"
                >
                  {url.replace(/^https?:\/\//, "")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {updated && (
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
          Last updated: {updated}
        </p>
      )}
    </div>
  );
}
