import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import raw from "@/data/channels.json";
import { Player } from "@/components/iptv/Player";
import { useTvNav } from "@/components/iptv/useTvNav";
import type { Category, Channel } from "@/components/iptv/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blue IPTV — بث مباشر للقنوات العربية والرياضية" },
      { name: "description", content: "تطبيق Blue IPTV لمشاهدة القنوات العربية والرياضية والإخبارية على الجوال والتلفاز." },
      { property: "og:title", content: "Blue IPTV — بث مباشر" },
      { property: "og:description", content: "شاهد أكثر من 130 قناة مباشرة على أندرويد وآيفون وأندرويد TV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const channels = raw as Channel[];
const LOGO = "https://www2.0zz0.com/2025/04/20/15/334855513.png";
const ACTIVATION_CODE = "123456";
const CATS: { id: Category | "all" | "fav"; label: string; icon: string }[] = [
  { id: "all", label: "الكل", icon: "◉" },
  { id: "arabic", label: "عربية", icon: "📺" },
  { id: "sports", label: "رياضة", icon: "⚽" },
  { id: "news", label: "أخبار", icon: "📰" },
  { id: "entertainment", label: "ترفيه", icon: "🎬" },
  { id: "fav", label: "المفضلة", icon: "★" },
];

function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  useEffect(() => { try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch { /* ignore */ } }, [key]);
  const set = (n: T) => { setV(n); localStorage.setItem(key, JSON.stringify(n)); };
  return [v, set] as const;
}

function App() {
  useTvNav();
  const [authed, setAuthed] = useStored("blue-auth", false);
  return <AnimatePresence mode="wait">{authed ? <Home key="h" onLogout={() => setAuthed(false)} /> : <Login key="l" onOk={() => setAuthed(true)} />}</AnimatePresence>;
}

function Tilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 18 });
  return (
    <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }} className={`preserve-3d ${className}`}
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5); }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>{children}</motion.div>
  );
}

function Orb() {
  return (
    <div className="pointer-events-none relative mx-auto h-64 w-64 [perspective:800px]">
      <div className="absolute inset-0 animate-orbit rounded-full border-2 border-primary/40 preserve-3d" />
      <div className="absolute inset-6 animate-orbit rounded-full border border-accent/40 [animation-direction:reverse] [animation-duration:9s]" />
      <motion.img src={LOGO} alt="Blue IPTV" className="absolute inset-10 h-44 w-44 animate-float object-contain drop-shadow-[0_0_40px_var(--glow)]"
        initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 1.2 }} />
    </div>
  );
}

function Login({ onOk }: { onOk: () => void }) {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [err, setErr] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const submit = () => { if (code.join("") === ACTIVATION_CODE) onOk(); else { setErr(true); setTimeout(() => setErr(false), 600); } };
  return (
    <motion.main exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} className="grid min-h-screen place-items-center gap-8 p-6 lg:grid-cols-2 lg:px-20">
      <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-center">
        <Orb />
        <h1 className="mt-4 text-5xl font-black">مرحباً بك في <span className="text-gradient">Blue</span></h1>
        <p className="mt-3 text-muted-foreground">بث مباشر لأكثر من {channels.length} قناة — على الجوال والتلفاز</p>
      </motion.div>
      <Tilt className="w-full max-w-md">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1, x: err ? [0, -12, 12, -8, 8, 0] : 0 }} className="glass rounded-[2rem] p-8 shadow-glow">
          <h2 className="mb-6 text-center text-2xl font-bold">أدخل كود التفعيل</h2>
          <div dir="ltr" className="mb-6 flex justify-center gap-2">
            {code.map((c, i) => (
              <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="numeric" maxLength={1} aria-label={`رقم ${i + 1}`}
                className={`tv-focus h-14 w-12 rounded-xl border bg-secondary text-center text-2xl font-bold focus:border-primary ${err ? "border-destructive" : "border-border"}`}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(-1); const n = [...code]; n[i] = v; setCode(n); if (v) refs.current[i + 1]?.focus(); }}
                onKeyDown={(e) => { if (e.key === "Backspace" && !c) refs.current[i - 1]?.focus(); if (e.key === "Enter") submit(); }}
                onPaste={(e) => { const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split(""); if (p.length) { e.preventDefault(); setCode([...p, ...Array(6 - p.length).fill("")]); } }} />
            ))}
          </div>
          <button onClick={submit} className="tv-focus w-full rounded-xl bg-gradient-primary py-4 text-lg font-bold text-primary-foreground">تسجيل الدخول</button>
          <div className="mt-8 border-t border-border pt-6 text-center">
            <p className="mb-3 text-sm text-muted-foreground">احصل على الكود من قناتنا الرسمية</p>
            <a href="https://t.me/BLUEIPTV1" target="_blank" rel="noreferrer" className="tv-focus inline-block rounded-full bg-secondary px-6 py-3 font-semibold">✈ تيليجرام @BLUEIPTV1</a>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">v5.0</p>
        </motion.div>
      </Tilt>
    </motion.main>
  );
}

function Home({ onLogout }: { onLogout: () => void }) {
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [favs, setFavs] = useStored<string[]>("blue-favs", []);
  const [recent, setRecent] = useStored<string[]>("blue-recent", []);
  const [playing, setPlaying] = useState<Channel | null>(null);

  const list = useMemo(() => channels.filter((c) =>
    (cat === "all" || (cat === "fav" ? favs.includes(c.id) : c.category === cat)) && c.name.toLowerCase().includes(q.toLowerCase())), [cat, q, favs]);
  const recentList = recent.map((id) => channels.find((c) => c.id === id)).filter((c): c is Channel => !!c);
  const play = (c: Channel) => { setPlaying(c); setRecent([c.id, ...recent.filter((r) => r !== c.id)].slice(0, 12)); };
  const toggleFav = (id: string) => setFavs(favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]);
  const featured = recentList[0] ?? channels.find((c) => c.category === "sports") ?? channels[0];

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl px-4 pb-24 pt-4 md:px-8">
      <header className="sticky top-2 z-30 glass mb-6 flex items-center gap-3 rounded-2xl p-3">
        <img src={LOGO} alt="Blue" className="h-10 w-10 object-contain" />
        <span className="hidden text-xl font-black text-gradient sm:block">Blue IPTV</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن قناة…" className="tv-focus mx-auto w-full max-w-md rounded-xl border border-border bg-secondary px-4 py-2" />
        <button onClick={onLogout} className="tv-focus rounded-xl bg-secondary px-4 py-2 text-sm">خروج</button>
      </header>

      {featured && (
        <Tilt className="mb-8">
          <section className="glass relative overflow-hidden rounded-[2rem] p-8 md:p-12">
            <div className="absolute -left-20 -top-20 h-72 w-72 animate-float rounded-full bg-primary/30 blur-3xl" />
            <div className="relative flex flex-col items-center gap-8 md:flex-row">
              <div className="flex-1 text-center md:text-right" style={{ transform: "translateZ(40px)" }}>
                <span className="inline-flex items-center gap-2 rounded-full bg-live/20 px-3 py-1 text-sm font-bold"><span className="h-2 w-2 animate-live rounded-full bg-live" />مباشر الآن</span>
                <h1 className="mt-4 text-4xl font-black md:text-6xl">{featured.name}</h1>
                <p className="mt-3 text-muted-foreground">{featured.description}</p>
                <button onClick={() => play(featured)} className="tv-focus mt-6 rounded-xl bg-gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-glow">▶ شاهد الآن</button>
              </div>
              <div style={{ transform: "translateZ(80px)" }}><Orb /></div>
            </div>
          </section>
        </Tilt>
      )}

      {recentList.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">شاهدته مؤخراً</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentList.map((c) => <button key={c.id} onClick={() => play(c)} className="tv-focus glass flex shrink-0 items-center gap-2 rounded-xl px-4 py-3"><Logo c={c} small />{c.name}</button>)}
          </div>
        </section>
      )}

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`tv-focus relative shrink-0 rounded-full px-5 py-2 font-semibold ${cat === c.id ? "text-primary-foreground" : "glass"}`}>
            {cat === c.id && <motion.span layoutId="pill" className="absolute inset-0 -z-10 rounded-full bg-gradient-primary" />}
            {c.icon} {c.label}
          </button>
        ))}
      </nav>

      <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <AnimatePresence>
          {list.map((c, i) => (
            <motion.div key={c.id} layout initial={{ opacity: 0, y: 30, rotateX: -30 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: Math.min(i * 0.02, 0.4) }} className="[perspective:800px]">
              <button onClick={() => play(c)} className="tv-focus glass group relative w-full rounded-2xl p-4 text-center hover:shadow-glow">
                <span className="absolute left-2 top-2 rounded-md bg-primary/20 px-2 text-xs font-bold text-primary">{c.quality}</span>
                {favs.includes(c.id) && <span className="absolute right-2 top-2 text-accent">★</span>}
                <div className="mx-auto mb-3 grid h-20 place-items-center transition-transform duration-500 group-hover:[transform:rotateY(18deg)_scale(1.1)]"><Logo c={c} /></div>
                <div className="truncate font-bold">{c.name}</div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && <p className="py-20 text-center text-muted-foreground">{cat === "fav" ? "لم تضف أي قناة للمفضلة بعد" : "لا توجد نتائج"}</p>}

      <AnimatePresence>
        {playing && <Player channel={playing} list={list.length ? list : channels} onClose={() => setPlaying(null)} onSwitch={play} isFav={favs.includes(playing.id)} onFav={() => toggleFav(playing.id)} />}
      </AnimatePresence>
    </motion.main>
  );
}

function Logo({ c, small }: { c: Channel; small?: boolean }) {
  const [bad, setBad] = useState(!c.logo);
  const s = small ? "h-8 w-8 text-xs" : "h-20 w-20 text-lg";
  return bad ? <span className={`${s} grid place-items-center rounded-xl bg-gradient-primary font-black text-primary-foreground`}>{c.name.slice(0, 3)}</span>
    : <img src={c.logo} alt="" loading="lazy" onError={() => setBad(true)} className={`${s} object-contain`} />;
}
