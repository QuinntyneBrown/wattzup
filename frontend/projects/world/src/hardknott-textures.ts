import type { CanvasTexture } from 'three/webgpu';
import { canvasTexture, seeded, speckle } from './world-kit';

/** Bracken and rough fell grass, rust-brown among the green. */
export function brackenTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a7a44', 2341);
    const random = seeded(2343);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = [
        'rgba(150,90,40,0.55)',
        'rgba(120,110,50,0.5)',
        'rgba(70,90,50,0.5)',
        'rgba(140,140,130,0.5)',
      ][Math.floor(random() * 4)]!;
      g.fillRect(random() * 256, random() * 256, 4 + random() * 18, 3 + random() * 10);
    }
  });
}

/** The red-bordered triangle warning of the 30% gradient. */
export function warningTexture(): CanvasTexture {
  return canvasTexture(128, 116, (g) => {
    g.clearRect(0, 0, 128, 116);
    g.fillStyle = '#c8102e';
    g.beginPath();
    g.moveTo(64, 2);
    g.lineTo(126, 114);
    g.lineTo(2, 114);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(64, 24);
    g.lineTo(108, 104);
    g.lineTo(20, 104);
    g.closePath();
    g.fill();
    g.fillStyle = '#1d1f24';
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    g.fillText('30%', 64, 94);
  });
}

/** The plate under the sign. */
export function plateTexture(): CanvasTexture {
  return canvasTexture(160, 64, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 160, 64);
    g.strokeStyle = '#1d1f24';
    g.lineWidth = 3;
    g.strokeRect(3, 3, 154, 58);
    g.fillStyle = '#1d1f24';
    g.font = 'bold 15px sans-serif';
    g.textAlign = 'center';
    g.fillText('Hardknott Pass', 80, 26);
    g.fillText('Bends · 1 in 3', 80, 48);
  });
}

/** Soft low cloud with ragged edges. */
export function cloudTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    const random = seeded(2381);
    for (let i = 0; i < 40; i++) {
      const x = 20 + random() * 216;
      const y = 22 + random() * 20;
      const fade = g.createRadialGradient(x, y, 0, x, y, 18 + random() * 14);
      fade.addColorStop(0, 'rgba(255,255,255,0.6)');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = fade;
      g.fillRect(0, 0, 256, 64);
    }
  });
}
