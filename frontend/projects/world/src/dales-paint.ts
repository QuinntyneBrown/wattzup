import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  type Scene,
} from 'three/webgpu';
import type { Course } from './course';

function lettering(text: string, pub: boolean): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = pub ? 240 : 192;
  const g = canvas.getContext('2d')!;
  if (pub) {
    g.fillStyle = '#294a3b';
    g.fillRect(0, 0, 512, 240);
    g.strokeStyle = '#c8ad70';
    g.lineWidth = 5;
    g.strokeRect(10, 10, 492, 220);
    g.font = 'bold 40px Georgia';
    g.textAlign = 'center';
    g.fillStyle = '#ede3bd';
    g.fillText('✿', 256, 68);
    g.font = 'bold 48px Georgia';
    g.fillText(text, 256, 136, 470);
    g.font = '25px Georgia';
    g.fillText('PUBLIC HOUSE', 256, 192);
  } else {
    g.fillStyle = '#eee9d6';
    g.textAlign = 'center';
    g.font = 'bold italic 75px sans-serif';
    g.fillText(text, 256, 92, 496);
    g.lineWidth = 10;
    g.strokeStyle = '#e3d762';
    g.beginPath();
    g.moveTo(208, 156);
    g.lineTo(257, 120);
    g.lineTo(303, 156);
    g.stroke();
    g.globalCompositeOperation = 'destination-out';
    let seed = 61;
    for (let i = 0; i < 3600; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const x = seed % 512;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      g.fillRect(x, seed % 192, 1 + (i % 3), 1);
    }
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function dalesPaint(course: Course, scene: Scene) {
  const meshes: Mesh<BufferGeometry, MeshBasicMaterial>[] = [];
  const paints = ['AY UP!', 'YORKSHIRE', 'CHAPEAU!', 'THE CROWN', 'FARMERS ARMS'].map(
    (s, i) =>
      new MeshBasicMaterial({
        map: lettering(s, i > 2),
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
      }),
  );
  for (const [i, d] of [
    8732, 8856, 8970, 9044, 9094, 9134, 9156, 9205, 9246, 9312, 9359,
  ].entries()) {
    const g = new BufferGeometry(),
      pos: number[] = [];
    for (const [station, lane] of [
      [d, -1.7],
      [d, 1.7],
      [d + 2.2, -1.7],
      [d + 2.2, 1.7],
    ]) {
      const p = course.place(station!, lane!);
      pos.push(p.x, p.y + 0.047, p.z);
    }
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
    g.setIndex([0, 1, 2, 1, 3, 2]);
    const mesh = new Mesh(g, paints[i % 3]);
    scene.add(mesh);
    meshes.push(mesh);
  }
  for (const [i, d] of [85, 135, 13188, 22858, 22915].entries()) {
    const p = course.place(d, -4.85);
    const sign = new Mesh(new PlaneGeometry(1.39, 0.73), paints[3 + (i > 2 ? 1 : 0)]);
    sign.position.set(p.x, p.y + 2.86, p.z);
    sign.rotation.y = p.heading;
    scene.add(sign);
    meshes.push(sign);
  }
  return {
    dispose() {
      for (const mesh of meshes) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
      }
      for (const m of paints) {
        m.map?.dispose();
        m.dispose();
      }
    },
  };
}
