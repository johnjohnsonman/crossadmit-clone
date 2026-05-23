export function generateSlug(text: string, id: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
  const shortId = id.replace(/-/g, "").substring(0, 6);
  return base ? `${base}-${shortId}` : shortId;
}
