import { useEffect } from "react";
// Spatial D-pad navigation for Android TV remotes and keyboards.
export function useTvNav() {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const dirs: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      const d = dirs[e.key]; if (!d) return;
      const a = document.activeElement as HTMLElement | null;
      if (a?.tagName === "INPUT" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
      if (a?.tagName === "VIDEO") return;
      const els = [...document.querySelectorAll<HTMLElement>("button, a[href], input, [data-focus]")].filter((el) => el.offsetParent && !el.hasAttribute("disabled"));
      if (!a || a === document.body) { els[0]?.focus(); e.preventDefault(); return; }
      const r = a.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      let best: HTMLElement | null = null, bs = Infinity;
      for (const el of els) {
        if (el === a) continue;
        const o = el.getBoundingClientRect(); const dx = o.x + o.width / 2 - cx, dy = o.y + o.height / 2 - cy;
        const main = dx * d[0] + dy * d[1]; if (main <= 1) continue;
        const cross = Math.abs(dx * d[1] + dy * d[0]); const s = main + cross * 2.5;
        if (s < bs) { bs = s; best = el; }
      }
      if (best) { e.preventDefault(); best.focus(); best.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
}
