// Run from frontend with node scripts/havana/bake.mjs.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const result = await build({
  entryPoints: ['scripts/havana/bake.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'Malecon',
  write: false,
});
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addScriptTag({ content: result.outputFiles[0].text });
  const { model, image, sizes, elevations } = await page.evaluate(() => globalThis.Malecon.bake());
  await mkdir('../tools/blender/assets', { recursive: true });
  await writeFile(
    'projects/ride/public/courses/havana-elevations.webp',
    Buffer.from(elevations.split(',')[1], 'base64'),
  );
  await writeFile(
    '../tools/blender/assets/havana-elevations.json',
    JSON.stringify(sizes, null, 2) + '\n',
  );
  await writeFile(
    '../tools/blender/assets/havana-source-models.glb',
    Buffer.from(model.split(',')[1], 'base64'),
  );
  await writeFile(
    'projects/ride/public/courses/havana-surfaces.webp',
    Buffer.from(image.split(',')[1], 'base64'),
  );
} finally {
  await browser.close();
}
