import {
  DoubleSide,
  Group,
  MeshLambertMaterial,
  RepeatWrapping,
  Sprite,
  SpriteMaterial,
} from 'three/webgpu';
import { canvasTexture } from './world-kit';

/** A seamless 3.2 m square of local, uneven setts. The same atlas serves every sector chunk. */
export function arenbergPave() {
  const width = 512,
    rows = 21;
  let state = 2071;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const texture = canvasTexture(width, width, (g) => {
    g.fillStyle = '#615b4f';
    g.fillRect(0, 0, width, width);
    for (let row = 0; row < rows; row++) {
      const columns = 13 + Math.floor(random() * 3);
      const h = width / rows,
        w = width / columns;
      const shift = random() * w;
      const offsets = Array.from({ length: columns }, () => w * (random() - 0.5) * 0.32);
      for (let col = 0; col < columns; col++) {
        const x = col * w + shift + offsets[col]!;
        const next = (col + 1) * w + shift + offsets[(col + 1) % columns]!;
        const tone = 131 + Math.floor(random() * 48);
        const tilt = (random() - 0.5) * 4;
        const a = 1 + random() * 4,
          b = 1 + random() * 4;
        for (const wrapX of [-width, 0]) {
          for (const wrapY of row === 0 ? [0, width] : row === rows - 1 ? [-width, 0] : [0]) {
            const left = x + wrapX + 1,
              right = next + wrapX - 1;
            const top = row * h + wrapY + 1.3,
              bottom = top + h - 2.7;
            const light = g.createLinearGradient(left, top, left + 7, bottom);
            light.addColorStop(0, 'rgb(' + [tone + 25, tone + 23, tone + 13].join(',') + ')');
            light.addColorStop(0.34, 'rgb(' + [tone + 9, tone + 8, tone - 2].join(',') + ')');
            light.addColorStop(0.77, 'rgb(' + [tone, tone - 2, tone - 10].join(',') + ')');
            light.addColorStop(1, 'rgb(' + [tone - 26, tone - 27, tone - 34].join(',') + ')');
            g.fillStyle = light;
            g.beginPath();
            g.moveTo(left + 3, top + tilt);
            g.lineTo(right - a - 2, top - tilt);
            g.lineTo(right, top + b + 2);
            g.lineTo(right - 1, bottom - b);
            g.lineTo(right - 4, bottom - tilt);
            g.lineTo(left + b, bottom + tilt);
            g.lineTo(left, bottom - a - 1);
            g.lineTo(left + 0.4, top + 3);
            g.closePath();
            g.fill();
          }
        }
      }
    }
    for (let i = 0; i < 19000; i++) {
      g.fillStyle = i % 4 === 0 ? 'rgba(242,234,213,.14)' : 'rgba(52,46,43,.11)';
      g.fillRect(random() * width, random() * width, random() * 1.6 + 0.3, random() * 1.1 + 0.3);
    }
  });
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / 3.2, 1 / 3.2);
  const material = new MeshLambertMaterial({ map: texture, side: DoubleSide });
  const leaves = canvasTexture(128, 128, (g) => {
    // Seeded oak and birch leaflets leave a broken canopy edge on either face.
    g.fillStyle = '#d4d2af';
    for (let i = 0; i < 390; i++) {
      const angle = random() * Math.PI * 2,
        rad = Math.sqrt(random());
      const x = 64 + Math.cos(angle) * rad * 61,
        y = 65 + Math.sin(angle) * rad * 58;
      const tone = 178 + Math.floor(random() * 77);
      g.fillStyle = 'rgb(' + [tone, tone, tone - 19].join(',') + ')';
      g.beginPath();
      g.ellipse(x, y, 2 + random() * 3.8, 1.3 + random() * 2.2, angle, 0, Math.PI * 2);
      g.fill();
    }
  });
  const foliage = new MeshLambertMaterial({
    map: leaves,
    vertexColors: true,
    side: DoubleSide,
    alphaTest: 0.46,
  });
  const dust = canvasTexture(32, 32, (g) => {
    const haze = g.createRadialGradient(16, 17, 1, 16, 17, 15);
    haze.addColorStop(0, 'rgba(181,171,143,.30)');
    haze.addColorStop(0.55, 'rgba(171,162,143,.14)');
    haze.addColorStop(1, 'rgba(170,163,154,0)');
    g.fillStyle = haze;
    g.fillRect(0, 0, 32, 32);
  });
  const sprayMaterial = new SpriteMaterial({ map: dust, transparent: true, depthWrite: false });
  const trail = new Group();
  const puffs = Array.from({ length: 5 }, () => new Sprite(sprayMaterial));
  trail.add(...puffs);
  const sector = (distance: number) => distance >= 320 && distance < 2720;
  return {
    material,
    foliage,
    trail,
    wheelRise(distance: number) {
      return sector(distance)
        ? 0.012 * Math.sin(distance * 11.3) + 0.006 * Math.sin(distance * 17.9)
        : 0;
    },
    updateTrail(distance: number, time: number, moving: boolean) {
      trail.visible = moving && sector(distance);
      if (!trail.visible) return;
      puffs.forEach((puff, i) => {
        const t = (time * 1.36 + i / puffs.length) % 1;
        const size = 0.67 * Math.sin(Math.PI * t);
        puff.scale.set(size * 1.4, size, 1);
        puff.position.set(0.11 * Math.sin(i * 2.3) + 0.24 * t, 0.13 + 0.57 * t, 0.79 + 2.05 * t);
      });
    },
    dispose() {
      trail.removeFromParent();
      sprayMaterial.dispose();
      dust.dispose();
      leaves.dispose();
      foliage.dispose();
      texture.dispose();
      material.dispose();
    },
  };
}
