export type Category = "arabic" | "sports" | "news" | "entertainment" | "movies" | "kids" | "religious" | "music" | "documentary" | "mine";
export interface Channel { id: string; name: string; logo: string; description: string; quality: string; url: string; category: Category; }
export function parseM3U(text: string): Channel[] {
  const lines = text.split(/\r?\n/); const out: Channel[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i] ?? ""; if (!l.startsWith("#EXTINF")) continue;
    let u = ""; for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) { const x = (lines[j] ?? "").trim(); if (x && !x.startsWith("#")) { u = x; break; } }
    if (!u) continue;
    const name = (l.split(",").pop() ?? "").trim() || "قناة";
    out.push({ id: `mine-${out.length}-${u.length}`, name, logo: /tvg-logo="([^"]*)"/.exec(l)?.[1] ?? "", description: /group-title="([^"]*)"/.exec(l)?.[1] ?? "قائمتي", quality: "HD", url: u, category: "mine" });
  }
  return out;
}
