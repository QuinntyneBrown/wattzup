import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshLambertMaterial,
  type BufferGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A short-wheelbase shuttle. All panels, glazing and wheels share one draw. */
export function makeShuttle(green: boolean, material: MeshLambertMaterial) {
  const panels: BufferGeometry[] = [];
  function panel(geometry: BufferGeometry, x: number, y: number, z: number, tint: number) {
    const g = geometry.toNonIndexed();
    geometry.dispose();
    g.translate(x, y, z);
    const colour = new Color(tint);
    const count = g.getAttribute('position').count;
    const colours = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colour.toArray(colours, i * 3);
    g.setAttribute('color', new Float32BufferAttribute(colours, 3));
    panels.push(g);
  }
  function box(x: number, y: number, z: number, w: number, h: number, l: number, t: number) {
    panel(new BoxGeometry(w, h, l), x, y, z, t);
  }
  const body = green ? 0x63965f : 0xb8c0b8;
  box(0, 1.29, 0, 2.32, 1.28, 8.52, body);
  box(0, 2.29, 0, 2.26, 1.03, 8.32, 0x253c42);
  box(0, 2.9, 0, 2.36, 0.22, 8.49, 0xd5d8c8);
  box(0, 3.09, 0.9, 1.5, 0.22, 2.95, 0x859089);
  for (const side of [-1, 1]) {
    box(side * 1.175, 1.42, -0.03, 0.03, 0.18, 8.14, green ? 0xbcd09b : 0x59836d);
    for (let n = 0; n < 8; n++)
      box(side * 1.14, 2.27, -3.95 + n * 1.12, 0.045, 1.02, 0.079, 0xadb8ac);
    box(side * 1.24, 2.27, -3.84, 0.15, 0.32, 0.21, 0x303c39);
    box(side * 0.85, 1.04, -4.28, 0.39, 0.21, 0.04, 0xf4e9c1);
    box(side * 0.91, 1.01, 4.28, 0.24, 0.32, 0.04, 0xa53d2b);
    for (const z of [-2.56, 2.56]) {
      const wheel = new CylinderGeometry(0.51, 0.51, 0.26, 14);
      wheel.rotateZ(Math.PI / 2);
      panel(wheel, side * 1.1, 0.53, z, 0x333a35);
      const hub = new CylinderGeometry(0.25, 0.25, 0.032, 12);
      hub.rotateZ(Math.PI / 2);
      panel(hub, side * 1.25, 0.53, z, 0x8e9388);
    }
  }
  box(0, 1.89, -4.22, 0.065, 0.87, 0.08, 0xa5aea6);
  box(0, 0.76, -4.28, 2.24, 0.18, 0.13, 0x636c65);
  box(0, 1.09, -4.29, 0.85, 0.2, 0.04, 0x404a45);
  const merged = mergeGeometries(panels);
  for (const g of panels) g.dispose();
  return new Mesh(merged, material);
}
