import type { ReactNode } from "react";

export function formatText(text: string | null | undefined): string {
  if (!text) return "-";
  return text
    .replace(/\\n/g, "\n")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

export function formatTextWithLineBreaks(
  text: string | null | undefined
): ReactNode {
  const cleaned = formatText(text);
  if (cleaned === "-") return "-";
  const lines = cleaned.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ));
}
