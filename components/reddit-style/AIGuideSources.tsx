type Props = {
  sources?: unknown;
  lastUpdated?: string | null;
};

function parseSources(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s)).filter((s) => s.startsWith("http"));
  }
  return [];
}

export default function AIGuideSources({ sources, lastUpdated }: Props) {
  const urls = parseSources(sources);
  if (urls.length === 0 && !lastUpdated) return null;

  const updated =
    lastUpdated ?
      new Date(lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <section className="mt-8 rounded-lg bg-[#F6F7F8] dark:bg-[#272729] border border-[#EDEFF1] dark:border-[#343536] p-4">
      <h2 className="text-sm font-bold text-[#1C1C1C] dark:text-[#D7DADC] mb-2">
        Sources
      </h2>
      {urls.length > 0 && (
        <ul className="space-y-2 text-sm">
          {urls.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF4500] hover:underline break-all"
              >
                {url.replace(/^https?:\/\//, "")}
              </a>
            </li>
          ))}
        </ul>
      )}
      {updated && (
        <p className="text-xs text-[#7C7C7C] dark:text-[#818384] mt-3">
          Last updated: {updated}
        </p>
      )}
    </section>
  );
}
