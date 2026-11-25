import type { CanvasTexture } from 'three/webgpu';
import { canvasTexture, speckle, seeded } from './world-kit';
/** The dam's face: pale concrete poured in courses, streaked by a century of weather. */
export function damFaceTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#cfc3a8', 9451);
    const random = seeded(9453);
    g.fillStyle = 'rgba(110,95,70,0.25)';
    for (let y = 0; y < 128; y += 16) g.fillRect(0, y, 128, 1);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(90,80,60,${0.08 + random() * 0.12})`;
      g.fillRect(random() * 128, 0, 1 + random() * 3, 128);
    }
  });
}

/** A tower's clock: a pale face, its hours marked, its hands at twenty to two. */
export function clockTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#ddd1b6';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#f4f0e4';
    g.beginPath();
    g.arc(32, 32, 26, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2a2420';
    g.lineWidth = 2;
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(32 + Math.sin(a) * 20, 32 - Math.cos(a) * 20);
      g.lineTo(32 + Math.sin(a) * 24, 32 - Math.cos(a) * 24);
      g.stroke();
    }
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(32, 32);
    g.lineTo(32 + Math.sin(-1.05) * 18, 32 - Math.cos(-1.05) * 18);
    g.moveTo(32, 32);
    g.lineTo(32 + Math.sin(1.0) * 12, 32 - Math.cos(1.0) * 12);
    g.stroke();
  });
}

/** The plaza's terrazzo star map round the Winged Figures. */
export function terrazzoTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#3a3a40', 9501);
    g.strokeStyle = 'rgba(220,200,150,0.7)';
    g.lineWidth = 1.5;
    for (const r of [20, 40, 60]) {
      g.beginPath();
      g.arc(64, 64, r, 0, Math.PI * 2);
      g.stroke();
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(64, 64);
      g.lineTo(64 + Math.cos(a) * 62, 64 + Math.sin(a) * 62);
      g.stroke();
    }
  });
}
