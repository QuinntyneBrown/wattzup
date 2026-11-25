import { Color, type CanvasTexture } from 'three/webgpu';
import { canvasTexture, seeded } from './world-kit';

/**
 * Clinker bricks laid in herringbone, in the given colour: each brick its own shade, some
 * burnt darker or redder, worn smooth on their faces, in sandy joints.
 */
export function clinkerTexture(base: string): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.scale(2, 2);
    g.fillStyle = '#5a4a3e';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(479);
    const colour = new Color(base);
    const shade = new Color();
    const brick = (points: number[][]) => {
      const lift = (random() - 0.5) * 0.13;
      shade.copy(colour).offsetHSL((random() - 0.5) * 0.03, (random() - 0.5) * 0.12, lift);
      if (random() < 0.08) shade.multiplyScalar(0.7);
      g.fillStyle = `#${shade.getHexString()}`;
      g.beginPath();
      g.moveTo(points[0]![0]!, points[0]![1]!);
      for (const [x, y] of points.slice(1)) g.lineTo(x!, y!);
      g.closePath();
      g.fill();
    };
    for (let y = -32; y < 256; y += 16) {
      for (let x = 0; x < 256; x += 32) {
        brick([
          [x + 1, y + 2],
          [x + 15, y + 16],
          [x + 15, y + 30],
          [x + 1, y + 16],
        ]);
        brick([
          [x + 17, y + 16],
          [x + 31, y + 2],
          [x + 31, y + 16],
          [x + 17, y + 30],
        ]);
      }
    }
    // Wear and grime over the whole.
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '0,0,0' : '255,240,220'},${random() * 0.06})`;
      g.fillRect(random() * 256, random() * 256, 2 + random() * 4, 2 + random() * 4);
    }
  });
}
