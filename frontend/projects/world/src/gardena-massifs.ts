import type { Course } from './course';
import {
  BufferGeometry,
  CanvasTexture,
  Group,
  PlaneGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';

/** Three fixed mountain groups beyond the entire centre line, with an original summer rock portrait. */
export async function gardenaMassifs(course: Course) {
  const texture = await new TextureLoader().loadAsync('courses/dolomites-massifs.webp');
  texture.colorSpace = SRGBColorSpace;
  const rock = new MeshBasicMaterial({
    map: texture,
    side: DoubleSide,
    alphaTest: 0.38,
    fog: false,
  });
  const positions: number[] = [],
    uv: number[] = [],
    triangles: number[] = [];
  // Sassolungo lies ahead of Ortisei, Sella beyond Selva and the Odle north of the valley.
  for (const [angle, span, height, from, to] of [
    [0, 110, 1830, 0, 0.316],
    [91, 72, 1730, 0.316, 0.699],
    [-106, 106, 1850, 0.699, 1],
  ] as const) {
    for (let i = 0; i < 24; i++) {
      const n = positions.length / 3;
      for (const end of [i, i + 1]) {
        const t = end / 24,
          a = ((angle + span * (t - 0.5)) * Math.PI) / 180;
        const x = -310 + 5450 * Math.cos(a),
          z = 250 + 5450 * Math.sin(a);
        positions.push(x, -300, z, x, height, z);
        const u = from + (to - from) * t;
        uv.push(u, 0, u, 1);
      }
      triangles.push(n, n + 2, n + 3, n, n + 3, n + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(triangles);
  const mesh = new Mesh(geometry, rock);
  const group = new Group();
  group.add(mesh);
  const signs: { map: CanvasTexture; geometry: PlaneGeometry; material: MeshBasicMaterial }[] = [];
  for (const [metres, name, local] of [
    [110, 'ORTISEI', 'Urtijëi · St. Ulrich'],
    [8430, 'SANTA CRISTINA', 'S. Cristina Gherdëina'],
    [32630, 'SELVA', 'Sëlva · Wolkenstein'],
  ] as const) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const c = canvas.getContext('2d')!;
    c.fillStyle = '#eeeade';
    c.fillRect(0, 0, 512, 192);
    c.strokeStyle = '#33372e';
    c.lineWidth = 8;
    c.strokeRect(7, 7, 498, 178);
    c.textAlign = 'center';
    c.fillStyle = '#25291f';
    c.font = 'bold 52px sans-serif';
    c.fillText(name, 256, 80, 465);
    c.font = '36px sans-serif';
    c.fillText(local, 256, 144, 465);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    const material = new MeshBasicMaterial({ map });
    const geometry = new PlaneGeometry(3.1, 1.16);
    const sign = new Mesh(geometry, material);
    const at = course.place(metres, 7.35);
    sign.position.set(at.x, at.y + 1.78, at.z);
    sign.rotation.y = at.heading;
    group.add(sign);
    signs.push({ map, geometry, material });
  }
  return {
    mesh: group,
    dispose() {
      group.removeFromParent();
      for (const sign of signs) {
        sign.material.dispose();
        sign.geometry.dispose();
        sign.map.dispose();
      }
      geometry.dispose();
      rock.dispose();
      texture.dispose();
    },
  };
}
