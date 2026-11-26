import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Mesh,
  type MeshLambertMaterial,
  type BufferGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** The clerestory roof, arched windows and single trolley pole of a St. Charles streetcar. */
export function perleyThomas(paint: MeshLambertMaterial) {
  const pieces: BufferGeometry[] = [];
  function panel(g: BufferGeometry, x: number, y: number, z: number, tint: number, angle = 0) {
    const vertices = g.toNonIndexed();
    g.dispose();
    vertices.rotateX(angle);
    vertices.translate(x, y, z);
    const col = new Color(tint),
      rgb = new Float32Array(vertices.getAttribute('position').count * 3);
    for (let i = 0; i < rgb.length; i += 3) col.toArray(rgb, i);
    vertices.setAttribute('color', new Float32BufferAttribute(rgb, 3));
    pieces.push(vertices);
  }
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    tint: number,
    angle = 0,
  ) => panel(new BoxGeometry(w, h, l), x, y, z, tint, angle);
  const green = 0x476b4d,
    cream = 0xe8c996,
    glass = 0x424d4a;
  box(0, 1.21, 0, 2.48, 1.3, 11.6, green);
  box(0, 2.32, 0, 2.43, 1.11, 11.5, glass);
  box(0, 2.95, 0, 2.68, 0.22, 11.94, 0xa99170);
  box(0, 3.18, 0, 1.82, 0.33, 10.22, green);
  box(0, 3.39, 0, 1.94, 0.11, 10.43, 0xad9c7e);
  box(0, 4.27, 0.85, 0.055, 2.53, 0.053, 0x464a43, 0.75);
  for (const side of [-1, 1]) {
    box(side * 1.25, 1.68, 0, 0.042, 0.104, 11.53, cream);
    for (let j = 0; j < 13; j++)
      box(side * 1.23, 2.3, -5.48 + j * 0.915, 0.068, 1.16, 0.077, 0xb38d5f);
    for (let j = 0; j < 9; j++)
      box(side * 0.925, 3.2, -3.94 + j * 0.97, 0.045, 0.13, 0.73, 0x545a50);
    for (const z of [-3.7, 3.7]) {
      const wheel = new CylinderGeometry(0.41, 0.41, 0.19, 14);
      wheel.rotateZ(Math.PI / 2);
      panel(wheel, side * 1.01, 0.43, z, 0x45433c);
    }
    for (const end of [-1, 1]) {
      box(side * 0.48, 2.3, end * 5.78, 0.067, 1.15, 0.05, cream);
      box(side * 0.99, 1.11, end * 5.83, 0.21, 0.16, 0.07, 0xf4db9d);
    }
  }
  for (const end of [-1, 1]) {
    box(0, 0.57, end * 5.82, 2.25, 0.18, 0.32, 0x575347);
    box(0, 2.8, end * 5.8, 0.83, 0.23, 0.055, 0xefe0b5);
    box(0, 1.49, end * 5.83, 0.33, 0.32, 0.06, 0xf3d997);
  }
  const merged = mergeGeometries(pieces);
  for (const g of pieces) g.dispose();
  return new Mesh(merged, paint);
}
