import type { CanvasTexture } from 'three/webgpu';
import { canvasTexture } from './world-kit';

/** The Welcome sign's diamond: white board, bulbs round its edge, and its lettering. */
export function welcomeTexture(): CanvasTexture {
  return canvasTexture(512, 380, (g) => {
    g.clearRect(0, 0, 512, 380);
    g.fillStyle = '#f4f1e8';
    g.beginPath();
    g.moveTo(256, 6);
    g.lineTo(506, 190);
    g.lineTo(256, 374);
    g.lineTo(6, 190);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd23f';
    for (let k = 0; k < 40; k++) {
      const u = k / 40;
      const corners = [
        [256, 18],
        [490, 190],
        [256, 362],
        [22, 190],
      ];
      const seg = Math.floor(u * 4);
      const f = u * 4 - seg;
      const [ax, ay] = corners[seg]!;
      const [bx, by] = corners[(seg + 1) % 4]!;
      g.beginPath();
      g.arc(ax! + (bx! - ax!) * f, ay! + (by! - ay!) * f, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#1b3a8a';
    g.font = 'bold 30px serif';
    g.fillText('WELCOME', 256, 110);
    g.fillStyle = '#1b3a8a';
    g.font = 'italic bold 30px serif';
    g.fillText('to Fabulous', 256, 158);
    g.fillStyle = '#ce1126';
    g.font = 'bold 74px serif';
    g.fillText('LAS VEGAS', 256, 222);
    g.fillStyle = '#1b3a8a';
    g.font = 'bold 30px serif';
    g.fillText('NEVADA', 256, 286);
  });
}
