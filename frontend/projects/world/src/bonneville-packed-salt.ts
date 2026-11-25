import type { CanvasTexture } from 'three/webgpu';
import { canvasTexture, seeded } from './world-kit';

/** The course: packed salt, a little grey, scored along its length by tyre tracks. */
export function packedSaltTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#e4e2dc';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(4401);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(150,146,138,0.18)' : 'rgba(255,255,255,0.5)';
      g.fillRect(random() * 256, random() * 256, 2 + random() * 3, 2 + random() * 3);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = 'rgba(120,116,108,0.14)';
      g.fillRect(random() * 256, 0, 3 + random() * 6, 256);
    }
  });
}
