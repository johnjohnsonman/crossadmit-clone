export function naverHeaders(): HeadersInit | null {
  const id = process.env.NAVER_CLIENT_ID?.trim();
  const secret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!id || !secret) return null;
  return {
    "X-Naver-Client-Id": id,
    "X-Naver-Client-Secret": secret,
  };
}

export function isNaverConfigured(): boolean {
  return Boolean(
    process.env.NAVER_CLIENT_ID?.trim() &&
      process.env.NAVER_CLIENT_SECRET?.trim()
  );
}

export function stripNaverHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}
