import { mix, positionWorld, smoothstep, texture, vec2 } from 'three/tsl';
import { MeshStandardNodeMaterial, RepeatWrapping } from 'three/webgpu';
import { canvasTexture, seeded } from './world-kit';

/** Timber and cobbles repeat on the same physical surface on both crossings and the return. */
export function brooklynDeck() {
  const random = seeded(2089);
  const wood = canvasTexture(512, 512, (g) => {
    for (let j = 0; j < 16; j++) {
      const y = j * 32,
        hue = 116 + Math.floor(random() * 29);
      g.fillStyle = 'rgb(' + [hue + 26, hue + 12, hue - 6].join(',') + ')';
      g.fillRect(0, y, 512, 32);
      for (let k = 0; k < 65; k++) {
        const x = random() * 510,
          v = y + 2 + random() * 27;
        g.strokeStyle = random() > 0.5 ? 'rgba(81,65,44,.21)' : 'rgba(239,220,181,.21)';
        g.lineWidth = 0.7 + random();
        g.beginPath();
        g.moveTo(x, v);
        g.quadraticCurveTo(x + 23, v + random() * 3 - 1, x + 30 + random() * 98, v);
        g.stroke();
      }
      g.fillStyle = 'rgba(58,46,31,.7)';
      g.fillRect(0, y, 512, 1.7);
      for (const u of [16, 492]) {
        g.fillStyle = 'rgba(80,70,57,.75)';
        g.beginPath();
        g.arc(u, y + 12 + random() * 7, 1.7, 0, 2 * Math.PI);
        g.fill();
      }
    }
  });
  const cobbles = canvasTexture(512, 512, (g) => {
    g.fillStyle = '#716f6b';
    g.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 16; row++)
      for (let j = -1; j < 10; j++) {
        const x = j * 51.2 + (row % 2) * 25.6,
          y = row * 32,
          v = 118 + Math.floor(random() * 31);
        g.fillStyle = 'rgb(' + [v + 8, v + 3, v - 1].join(',') + ')';
        g.beginPath();
        g.roundRect(x + 1.6, y + 1.8, 48.4, 28.8, 3 + random() * 3);
        g.fill();
        for (let k = 0; k < 24; k++) {
          g.fillStyle = k % 2 ? 'rgba(220,210,193,.15)' : 'rgba(58,58,58,.11)';
          g.fillRect(x + 4 + random() * 41, y + 4 + random() * 23, 1.4, 1.2);
        }
      }
  });
  for (const map of [wood, cobbles]) map.wrapS = map.wrapT = RepeatWrapping;
  const x = positionWorld.x;
  const board = texture(wood, vec2(positionWorld.z.div(5.5), x.div(3.2)));
  const stone = texture(cobbles, vec2(positionWorld.z.div(2.52), x.div(1.75)));
  const raised = smoothstep(515, 519, x).mul(smoothstep(2626, 2630, x).oneMinus());
  const material = new MeshStandardNodeMaterial({ roughness: 0.91 });
  material.colorNode = mix(stone.rgb, board.rgb, raised);
  return { material, textures: [wood, cobbles] };
}
