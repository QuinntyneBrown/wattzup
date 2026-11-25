// Bake the original AmsterdamStreet canvas artwork for its Blender course. Run from frontend/.
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const origin = server.resolvedUrls.local[0];
  await page.goto(origin + '@vite/client');
  const images = await page.evaluate(async () => {
    const { facadeTexture, leafTexture } = await import('/projects/world/src/world-amsterdam.ts');
    const sheet = document.createElement('canvas');
    sheet.width = 2048;
    sheet.height = 1280;
    const ctx = sheet.getContext('2d');
    const palette = [
      '#5a3326',
      '#d9cfb8',
      '#2a2a2e',
      '#7a4a36',
      '#e8e2d4',
      '#4a3a30',
      '#c9b79a',
      '#2f3a34',
    ];
    for (let i = 0; i < palette.length; i++) {
      const texture = facadeTexture(
        ['step', 'bell', 'neck', 'cornice'][i % 4],
        palette[i],
        503 + 7 * i,
        i % 2 === 1,
      );
      ctx.drawImage(texture.image, (i % 4) * 512, Math.floor(i / 4) * 640, 512, 640);
      texture.dispose();
    }
    const leaf = leafTexture();
    const foliage = leaf.image.toDataURL('image/webp', 0.94);
    leaf.dispose();
    return { fronts: sheet.toDataURL('image/webp', 0.9), foliage };
  });
  for (const [name, uri] of Object.entries(images)) {
    await writeFile(
      'projects/ride/public/courses/amsterdam-' + name + '.webp',
      Buffer.from(uri.split(',')[1], 'base64'),
    );
  }
} finally {
  await browser.close();
  await server.close();
}
