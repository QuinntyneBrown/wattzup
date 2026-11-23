// Copies the marketing site's media into its public folder before it is served or built (ADR 0027):
// the pitch film and its captions from docs/videos, the design system's photographs, and curated
// screenshots of the best 3D worlds and completed screens. The copies are ignored by git. A missing
// film or docs folder (e.g. in CI) is skipped gracefully so the build never fails.
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

// Curated screenshots of the best 3D worlds and completed screens (ADR 0027).
const showcaseDir = join(site, 'images', 'showcase');
mkdirSync(showcaseDir, { recursive: true });
const showcaseAssets = [
  ['docs/screenshots/courses/ibiza/sky-01-strip.jpg', 'ibiza-course.jpg'],
  ['docs/videos/08-2-draw-the-route-world/shots/neon-docklands-xl.png', 'neon-docklands.png'],
  ['docs/videos/08-2-draw-the-route-world/shots/vice-city-xl.png', 'vice-city.png'],
  ['docs/screenshots/courses/realism-on-coast.jpg', 'cliffside-coast.jpg'],
  ['docs/screenshots/cinqueterre/course-032-path-crossings.jpg', 'cinque-terre.jpg'],
  ['docs/screenshots/haleakala/course-028-fruit-stands.jpg', 'haleakala.jpg'],
  ['docs/videos/11-3-celebrate-an-unlock/shots/unlock-xl.png', 'results-unlock.png'],
  ['docs/videos/21-3-ride-a-custom-workout/shots/ride-xl.png', 'custom-workout.png'],
];

for (const [relSource, destName] of showcaseAssets) {
  const source = join(root, relSource);
  if (existsSync(source)) {
    copyFileSync(source, join(showcaseDir, destName));
  } else {
    console.warn(`media:sync: ${source} is not present; ${destName} skipped.`);
  }
}
