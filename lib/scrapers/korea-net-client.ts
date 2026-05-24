/**
 * Cookie-aware fetch client for honoraryreporters.korea.net (passKey gate).
 */
import { BROWSER_HEADERS } from "@/lib/pipeline/study-korea/fetch-html";

export const KOREA_NET_HR_ORIGIN = "https://honoraryreporters.korea.net";

const jar = new Map<string, string>();

function cookieHeader(): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function absorbCookies(res: Response) {
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  for (const c of setCookies) {
    const [kv] = c.split(";");
    const i = kv.indexOf("=");
    if (i > 0) {
      jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
    }
  }
  const legacy = res.headers.get("set-cookie");
  if (legacy && setCookies.length === 0) {
    for (const part of legacy.split(/,(?=[^;]+=)/)) {
      const [kv] = part.split(";");
      const i = kv.indexOf("=");
      if (i > 0) jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
    }
  }
}

export function getHonoraryReportersPassKey(): string {
  const key =
    process.env.HONORARY_REPORTERS_PASS_KEY?.trim() ||
    process.env.KOREA_NET_HR_PASS_KEY?.trim();
  if (!key) {
    throw new Error(
      "HONORARY_REPORTERS_PASS_KEY is required to scrape honoraryreporters.korea.net"
    );
  }
  return key;
}

export async function fetchKoreaNetHr(
  pathOrUrl: string,
  init: RequestInit = {},
  timeoutMs = 20_000
): Promise<{ html: string; finalUrl: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let current = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${KOREA_NET_HR_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;

  try {
    for (let hop = 0; hop < 10; hop++) {
      const res = await fetch(current, {
        ...init,
        headers: {
          ...BROWSER_HEADERS,
          Cookie: cookieHeader(),
          Referer: `${KOREA_NET_HR_ORIGIN}/studio/index.do`,
          ...(init.headers as Record<string, string> | undefined),
        },
        redirect: "manual",
        signal: controller.signal,
      });
      absorbCookies(res);

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) {
          throw new Error(`Redirect without location from ${current}`);
        }
        current = loc.startsWith("http")
          ? loc
          : new URL(loc, KOREA_NET_HR_ORIGIN).href;
        continue;
      }

      const html = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${current}`);
      }
      return { html, finalUrl: current, status: res.status };
    }
    throw new Error(`Too many redirects for ${pathOrUrl}`);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Timeout ${timeoutMs}ms for ${pathOrUrl}`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Warm studio + submit passKey so board/list/detail are accessible. */
export async function loginHonoraryReporters(
  passKey: string,
  backUrl = "/board/list.do?searchtxt=GKS&searchtp=all&articlecate=1&pageidx=1&tpln=1"
): Promise<void> {
  jar.clear();
  await fetchKoreaNetHr("/studio/index.do");

  const res = await fetch(`${KOREA_NET_HR_ORIGIN}/passKeyCk.do`, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      Cookie: cookieHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${KOREA_NET_HR_ORIGIN}/passKey.do`,
    },
    body: new URLSearchParams({ passKey, backUrl }),
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
  absorbCookies(res);

  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (loc) {
      await fetchKoreaNetHr(
        loc.startsWith("http") ? loc : new URL(loc, KOREA_NET_HR_ORIGIN).href
      );
      return;
    }
  }

  const html = await res.text();
  if (html.includes("Incorrect password") || html.includes("passKey")) {
    throw new Error("Honorary Reporters passKey login failed");
  }
}
