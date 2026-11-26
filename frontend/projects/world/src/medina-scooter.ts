import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Mesh,
  SphereGeometry,
  type BufferGeometry,
  type MeshLambertMaterial,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Small local step-through with leg shield, parcel rack, wheels and a seated rider. */
export function medinaScooter(material: MeshLambertMaterial) {
  const pieces: BufferGeometry[] = [];
  function part(
    g: BufferGeometry,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    colour: number,
    tilt = 0,
  ) {
    const shape = g.toNonIndexed();
    g.dispose();
    shape.scale(w, h, l);
    shape.rotateX(tilt);
    shape.translate(x, y, z);
    const c = new Color(colour),
      rgb = new Float32Array(shape.getAttribute('position').count * 3);
    for (let i = 0; i < rgb.length; i += 3) c.toArray(rgb, i);
    shape.setAttribute('color', new Float32BufferAttribute(rgb, 3));
    pieces.push(shape);
  }
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    c: number,
    tilt = 0,
  ) => part(new BoxGeometry(), x, y, z, w, h, l, c, tilt);
  const oval = (x: number, y: number, z: number, w: number, h: number, l: number, c: number) =>
    part(new SphereGeometry(1, 10, 7), x, y, z, w, h, l, c);
  for (const z of [-0.64, 0.67]) {
    for (const [r, width, c] of [
      [0.265, 0.13, 0x393b38],
      [0.145, 0.15, 0xaaa898],
    ] as const) {
      const wheel = new CylinderGeometry(r, r, width, 14);
      wheel.rotateZ(Math.PI / 2);
      part(wheel, 0, 0.27, z, 1, 1, 1, c);
    }
  }
  oval(0, 0.48, 0.38, 0.24, 0.26, 0.55, 0xaa5547);
  box(0, 0.35, -0.04, 0.4, 0.075, 0.68, 0x787d71);
  box(0, 0.65, -0.43, 0.41, 0.67, 0.14, 0xaa594c, -0.25);
  oval(0, 0.82, 0.29, 0.23, 0.076, 0.36, 0x47423c);
  box(0, 1.04, -0.52, 0.58, 0.045, 0.057, 0x878a81);
  oval(0, 1.02, -0.58, 0.12, 0.1, 0.1, 0xe4d4b2);
  box(0, 0.76, 0.8, 0.41, 0.062, 0.35, 0x9f9b87);
  box(0, 0.92, 0.83, 0.36, 0.28, 0.29, 0x8d7056);
  oval(0, 1.1, 0.24, 0.18, 0.3, 0.13, 0x607a78);
  oval(0, 1.46, 0.19, 0.108, 0.15, 0.1, 0xaf8367);
  oval(0, 1.56, 0.2, 0.127, 0.085, 0.117, 0x534d44);
  for (const sign of [-1, 1]) {
    box(sign * 0.17, 0.76, -0.07, 0.14, 0.39, 0.15, 0x514e4b, -0.44);
    box(sign * 0.15, 1.14, -0.075, 0.09, 0.46, 0.1, 0x6e827b, 0.97);
    oval(sign * 0.16, 1.04, -0.29, 0.055, 0.053, 0.07, 0xab8069);
  }
  const g = mergeGeometries(pieces);
  for (const p of pieces) p.dispose();
  return new Mesh(g, material);
}
