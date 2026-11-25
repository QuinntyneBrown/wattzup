import type { CanvasTexture } from 'three/webgpu';
import { canvasTexture, speckle } from './world-kit';

/** Pale limestone, pitted and weathered. */
export function limestoneTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#d8d0bc', 3051));
}

/** A woven textile in bright bands. */
export function textileTexture(k: number): CanvasTexture {
  const palettes = [
    ['#ff2d78', '#ffd23f', '#2ec4b6', '#ffffff'],
    ['#3a86ff', '#ff9f1c', '#ffffff', '#1d1f24'],
    ['#9b5cff', '#30ff9a', '#ff6b5a', '#ffd23f'],
    ['#c8102e', '#ffffff', '#2a8a4a', '#ffd23f'],
  ];
  return canvasTexture(64, 96, (g) => {
    const p = palettes[k]!;
    for (let y = 0; y < 96; y += 6) {
      g.fillStyle = p[(y / 6) % p.length]!;
      g.fillRect(0, y, 64, 6);
    }
  });
}

/** A stele carved with glyphs in blocks. */
export function steleTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#b8b0a0', 3081);
    g.strokeStyle = 'rgba(50,44,36,0.6)';
    g.lineWidth = 2;
    for (let y = 8; y < 120; y += 16)
      for (const x of [8, 34]) {
        g.strokeRect(x, y, 22, 13);
        g.beginPath();
        g.arc(x + 11, y + 6, 4, 0, Math.PI * 2);
        g.stroke();
      }
  });
}

/** El Castillo's terraces: grey-gold stone in panels. */
export function terraceTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    speckle(g, 128, 64, '#c8b898', 3091);
    g.fillStyle = 'rgba(60,50,40,0.35)';
    for (let x = 0; x < 128; x += 16) g.fillRect(x, 8, 2, 48);
    g.fillRect(0, 6, 128, 2);
    g.fillRect(0, 56, 128, 2);
  });
}
