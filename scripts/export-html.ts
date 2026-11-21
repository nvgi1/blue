import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";

// Bundle the existing screen, data and playback engines, not a second implementation.
const root = resolve(import.meta.dir, "..");
const staging = "/tmp/blue-iptv-export";
await mkdir(staging, { recursive: true });
const screen = await Bun.file(resolve(root, "src/routes/index.tsx")).text();
const standaloneScreen = screen
  .replace('import { createFileRoute } from "@tanstack/react-router";\n', "")
  .replace(/export const Route = createFileRoute\("\/"\)\(\{[\s\S]*?\n\}\);/, "")
  .replace("function App() {", "export function App() {");
const entry = resolve(staging, "entry.tsx");
await Bun.write(entry, `import { createRoot } from "${root}/node_modules/react-dom/client";
import { App } from "${root}/src/routes/index.tsx";
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
`);
const result = await Bun.build({
  entrypoints: [entry],
  target: "browser",
  format: "iife",
  minify: true,
  splitting: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [{
    name: "standalone-screen",
    setup(builder) {
      builder.onLoad({ filter: /src\/routes\/index\.tsx$/ }, () => ({
        contents: standaloneScreen,
        loader: "tsx",
      }));
      builder.onResolve({ filter: /^@\// }, async ({ path }) => {
        const base = resolve(root, "src", path.slice(2));
        for (const extension of ["", ".tsx", ".ts", ".json"]) {
          if (await Bun.file(base + extension).exists()) return { path: base + extension };
        }
        throw new Error(`Cannot resolve ${path}`);
      });
    },
  }],
});
if (!result.success) throw new Error(result.logs.map(String).join("\n"));
if (result.outputs.length !== 1) throw new Error("Expected a single JavaScript bundle");
const bundle = result.outputs[0];
if (!bundle) throw new Error("Missing bundle");
const response = await fetch("http://localhost:8080/src/styles.css?direct");
if (!response.ok) throw new Error("Could not read the current app stylesheet");
const css = await response.text();
const javascript = (await bundle.text()).replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blue IPTV — بث مباشر للقنوات العربية والرياضية</title>
<meta name="description" content="تطبيق Blue IPTV لمشاهدة القنوات العربية والرياضية والإخبارية على الجوال والتلفاز.">
<meta property="og:title" content="Blue IPTV — بث مباشر">
<meta property="og:description" content="شاهد القنوات العربية والرياضية والإخبارية مباشرة.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b1630">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap">
<style>${css.replace(/<\/style/gi, "<\\/style")}</style>
</head>
<body><div id="root"></div><script>${javascript}</script></body>
</html>`;
await Bun.write(resolve(staging, "Blue_IPTV.html"), html);
console.log(`Exported ${html.length} characters to ${staging}/Blue_IPTV.html`);