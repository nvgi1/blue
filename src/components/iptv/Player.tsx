import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Channel } from "./types";

export function Player({ channel, list, onClose, onSwitch, isFav, onFav }: {
  channel: Channel; list: Channel[]; onClose: () => void; onSwitch: (c: Channel) => void; isFav: boolean; onFav: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"loading" | "playing" | "error">("loading");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const v = ref.current; if (!v) return;
    setState("loading");
    let hls: { destroy: () => void } | undefined; let dead = false;
    const onPlay = () => setState("playing");
    const onErr = () => setState("error");
    v.addEventListener("playing", onPlay); v.addEventListener("error", onErr);
    if (v.canPlayType("application/vnd.apple.mpegurl")) { v.src = channel.url; v.play().catch(() => {}); }
    else import("hls.js").then(({ default: Hls }) => {
      if (dead) return;
      if (!Hls.isSupported()) { v.src = channel.url; return; }
      const h = new Hls({ lowLatencyMode: true }); hls = h;
      h.loadSource(channel.url); h.attachMedia(v);
      h.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}));
      h.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) setState("error"); });
    });
    const t = setTimeout(() => setState((s) => (s === "loading" ? "error" : s)), 20000);
    return () => { dead = true; clearTimeout(t); hls?.destroy(); v.removeEventListener("playing", onPlay); v.removeEventListener("error", onErr); v.removeAttribute("src"); v.load(); };
  }, [channel.url, retry]);

  const idx = list.findIndex((c) => c.id === channel.id);
  const step = (d: number) => { const n = list[(idx + d + list.length) % list.length]; if (n) onSwitch(n); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "GoBack") { e.preventDefault(); onClose(); }
      if (e.key === "ChannelUp" || e.key === "PageUp") step(1);
      if (e.key === "ChannelDown" || e.key === "PageDown") step(-1);
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col bg-background" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
      <div className="relative flex-1 bg-background">
        <video ref={ref} className="h-full w-full" controls playsInline autoPlay />
        {state === "loading" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-background/80 p-6 text-center">
            <div className="glass rounded-3xl p-8">
              <p className="mb-2 text-xl font-bold">تعذر تشغيل القناة</p>
              <p className="mb-6 text-muted-foreground">قد يكون البث غير متاح حالياً في منطقتك.</p>
              <div className="flex justify-center gap-3">
                <button autoFocus className="tv-focus rounded-xl bg-gradient-primary px-6 py-3 font-bold text-primary-foreground" onClick={() => setRetry((r) => r + 1)}>إعادة المحاولة</button>
                <button className="tv-focus rounded-xl bg-secondary px-6 py-3" onClick={() => step(1)}>القناة التالية</button>
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center gap-3 bg-gradient-to-b from-background/90 to-transparent p-4">
          <button className="tv-focus glass rounded-full px-4 py-2" onClick={onClose}>→ رجوع</button>
          {channel.logo && <img src={channel.logo} alt="" className="h-10 w-10 rounded-lg bg-secondary object-contain p-1" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-bold"><span className="h-2 w-2 animate-live rounded-full bg-live" />{channel.name}</div>
            <div className="truncate text-xs text-muted-foreground">{channel.description}</div>
          </div>
          <button className="tv-focus glass rounded-full px-4 py-2" onClick={onFav}>{isFav ? "★ مفضلة" : "☆ أضف"}</button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto p-3 glass">
        <button className="tv-focus shrink-0 rounded-xl bg-secondary px-4" onClick={() => step(-1)}>‹ السابق</button>
        {list.map((c) => (
          <button key={c.id} onClick={() => onSwitch(c)} className={`tv-focus shrink-0 rounded-xl px-4 py-2 text-sm ${c.id === channel.id ? "bg-gradient-primary text-primary-foreground" : "bg-secondary"}`}>{c.name}</button>
        ))}
        <button className="tv-focus shrink-0 rounded-xl bg-secondary px-4" onClick={() => step(1)}>التالي ›</button>
      </div>
    </motion.div>
  );
}
