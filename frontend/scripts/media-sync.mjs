// Copies the marketing site's media into its public folder before it is served or built (ADR 0027):
// the pitch film and its captions from docs/videos, and the design system's photographs. The copies
// are ignored by git. A film not rendered yet is skipped: the player still shows its still.
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const site = join(root, 'frontend', 'projects', 'marketing', 'public');
const filmFolder = join(root, 'docs', 'videos', '00-meet-telo-ride');
const images = join(root, 'docs', 'design-system', 'assets', 'images');

mkdirSync(join(site, 'media'), { recursive: true });
for (const [from, to] of [
  ['00-meet-telo-ride.mp4', 'meet-telo-ride.mp4'],
  ['captions.vtt', 'meet-telo-ride.vtt'],
]) {
  const source = join(filmFolder, from);
  if (existsSync(source)) {
    copyFileSync(source, join(site, 'media', to));
  } else {
    console.warn(`media:sync: ${source} is not rendered yet; the film will not play.`);
  }
}
// The design system's photographs, except the GCN class, which carries another brand's mark. CI checks out
// frontend and backend only, so a missing folder is skipped as a missing film is: the build does not need it.
for (const folder of ['classes', 'machines', 'worlds']) {
  if (!existsSync(join(images, folder))) {
    console.warn(
      `media:sync: ${join(images, folder)} is not checked out; its photographs are left out.`,
    );
    continue;
  }
  cpSync(join(images, folder), join(site, 'images', folder), {
    recursive: true,
    filter: (source) => !source.includes('gcn-'),
  });
}
