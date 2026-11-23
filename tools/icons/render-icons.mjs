// Renders the installed app's icons (L2-150 AC1) from their sources in docs/design-system/assets/icons/ to the PNGs the
// web app manifest lists, at their exact sizes, with the Chromium Playwright installs. Run from the repository root:
// `node tools/icons/render-icons.mjs`. The PNGs are committed; run it again only when the artwork changes.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const { chromium } = createRequire(path.join(root, "frontend/package.json"))(
  "@playwright/test",
);
const sources = path.join(root, "docs/design-system/assets/icons");
const out = path.join(root, "frontend/projects/ride/public/icons");

const icons = [
  { source: "app-icon.svg", size: 192, file: "icon-192.png" },
  { source: "app-icon.svg", size: 512, file: "icon-512.png" },
  { source: "app-icon-maskable.svg", size: 512, file: "icon-maskable-512.png" },
];

const browser = await chromium.launch();
try {
  for (const icon of icons) {
    const page = await browser.newPage({
      viewport: { width: icon.size, height: icon.size },
      deviceScaleFactor: 1,
    });
    const svg = await readFile(path.join(sources, icon.source), "utf8");
    await page.setContent(
      `<!doctype html><style>html,body{margin:0}svg{display:block;width:${icon.size}px;height:${icon.size}px}</style>${svg}`,
    );
    await page.screenshot({
      path: path.join(out, icon.file),
      clip: { x: 0, y: 0, width: icon.size, height: icon.size },
    });
    await page.close();
    console.log(
      `wrote ${path.relative(root, path.join(out, icon.file))} (${icon.size}×${icon.size})`,
    );
  }
} finally {
  await browser.close();
}
