import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Rounded Remodelado vestibules wrap the original 28E panels, with the bow collector at wire height. */
export class LisbonTram {
  private readonly panels = new BufferGeometry();
  private readonly trim: BufferGeometry;
  private readonly ink: MeshBasicMaterial;
  private readonly solid = new MeshBasicMaterial({ vertexColors: true });
  readonly cars: Group[] = [];
  constructor(atlas: Texture) {
    this.ink = new MeshBasicMaterial({ map: atlas, side: DoubleSide });
    const positions: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    const face = (a: number[], b: number[], u0: number, u1: number) => {
      const n = positions.length / 3;
      positions.push(
        a[0]!,
        0.64,
        a[1]!,
        b[0]!,
        0.64,
        b[1]!,
        b[0]!,
        2.97,
        b[1]!,
        a[0]!,
        2.97,
        a[1]!,
      );
      uv.push(u0, 0.003, u1, 0.003, u1, 0.997, u0, 0.997);
      indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
    };
    for (const side of [-1, 1]) face([side * 1.12, -3.06], [side * 1.12, 3.06], 0.003, 0.497);
    for (const end of [-1, 1]) {
      for (let j = 0; j < 6; j++) {
        const point = (i: number) => {
          const angle = (i * Math.PI) / 6;
          return [-1.12 * Math.cos(angle), end * (3.06 + 0.74 * Math.sin(angle))];
        };
        const left = end === 1 ? j : 6 - j,
          right = end === 1 ? j + 1 : 5 - j;
        face(point(left), point(right), 0.503 + (0.494 * j) / 6, 0.503 + (0.494 * (j + 1)) / 6);
      }
    }
    this.panels.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.panels.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    this.panels.setIndex(indices);
    const pieces: BufferGeometry[] = [],
      cube = new BoxGeometry(1, 1, 1),
      round = new CylinderGeometry(1, 1, 1, 16);
    const pose = new Object3D();
    const add = (
      base: BufferGeometry,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
      tint: number,
      rx = 0,
      rz = 0,
    ) => {
      const part = base.clone();
      pose.position.set(x, y, z);
      pose.scale.set(w, h, l);
      pose.rotation.set(rx, 0, rz);
      pose.updateMatrix();
      part.applyMatrix4(pose.matrix);
      const paint = new Color(tint);
      const colors = new Float32Array(part.getAttribute('position').count * 3);
      for (let i = 0; i < colors.length; i += 3) paint.toArray(colors, i);
      part.setAttribute('color', new Float32BufferAttribute(colors, 3));
      pieces.push(part);
    };
    add(cube, 0, 0.52, 0, 2.14, 0.28, 6.45, 0x493e36);
    add(cube, 0, 3.01, 0, 2.32, 0.17, 6.13, 0xe3dfd2);
    add(cube, 0, 3.14, 0, 1.98, 0.2, 5.74, 0x898e88);
    for (const end of [-1, 1]) {
      add(round, 0, 3.01, end * 3.04, 1.16, 0.17, 0.82, 0xe3dfd2);
      add(round, 0, 0.59, end * 3.02, 1.15, 0.14, 0.83, 0x574637);
      add(cube, 0, 0.41, end * 3.79, 1.6, 0.095, 0.15, 0x444541);
      for (const side of [-1, 1])
        add(round, side * 0.48, 0.38, end * 1.36, 0.36, 0.13, 0.36, 0x3a3d3e, 0, Math.PI / 2);
    }
    for (const x of [-1.14, 1.14]) add(cube, x, 1.51, 0, 0.04, 0.055, 6.1, 0x624634);
    add(cube, 0, 3.36, 0.31, 0.82, 0.18, 1.22, 0x686862);
    for (const side of [-1, 1]) {
      add(cube, side * 0.22, 3.94, 0.37, 0.056, 1.3, 0.058, 0x4a4b48, 0.54);
      add(cube, side * 0.22, 4.94, 0.41, 0.049, 1.3, 0.048, 0x555650, -0.54);
    }
    add(cube, 0, 5.48, 0.12, 0.72, 0.064, 0.09, 0x4f514d);
    this.trim = mergeGeometries(pieces);
    for (const p of pieces) p.dispose();
    cube.dispose();
    round.dispose();
    for (let i = 0; i < 4; i++) {
      const g = new Group();
      g.add(new Mesh(this.panels, this.ink), new Mesh(this.trim, this.solid));
      this.cars.push(g);
    }
  }
  dispose() {
    for (const g of this.cars) g.clear();
    this.panels.dispose();
    this.trim.dispose();
    this.ink.dispose();
    this.solid.dispose();
  }
}
