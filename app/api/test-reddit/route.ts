export async function GET() {
  const url = "https://www.reddit.com/r/studyinkorea/hot.json?limit=5";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  });
  const status = res.status;
  const text = await res.text();
  return Response.json({ status, preview: text.slice(0, 500) });
}
