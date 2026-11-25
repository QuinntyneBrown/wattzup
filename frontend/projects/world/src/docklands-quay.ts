import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  type BufferGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';

/** Bake the coloured pieces of each moving silhouette into one draw. */
function piece(
  shape: BufferGeometry,
  paint: number,
  x: number,
  y: number,
  z: number,
): BufferGeometry {
  const geometry = shape.index ? shape.toNonIndexed() : shape;
  if (geometry !== shape) shape.dispose();
  geometry.translate(x, y, z);
  geometry.deleteAttribute('uv');
  const rgb = new Color(paint);
  const colours = new Float32Array(geometry.getAttribute('position').count * 3);
  for (let i = 0; i < colours.length; i += 3) rgb.toArray(colours, i);
  geometry.setAttribute('color', new Float32BufferAttribute(colours, 3));
  return geometry;
}

function bake(parts: BufferGeometry[]): BufferGeometry {
  const geometry = mergeGeometries(parts)!;
  for (const part of parts) part.dispose();
  return geometry;
}

function passengerFerry(): BufferGeometry {
  const hull = new CylinderGeometry(1, 0.76, 1.6, 8);
  hull.scale(3.15, 1, 11);
  const parts = [piece(hull, 0x294057, 0, 0.5, 0)];
  for (let deck = 0; deck < 2; deck++) {
    const length = 15 - deck * 4;
    const y = 1.9 + deck * 1.35;
    parts.push(piece(new BoxGeometry(4.65, 1.35, length), 0xd1cdba, 0, y, 0));
    parts.push(piece(new BoxGeometry(5.1, 0.18, length + 0.6), 0x378993, 0, y + 0.7, 0));
    for (const side of [-1, 1]) {
      for (let z = 1 - length / 2; z < length / 2 - 0.4; z += 1.55) {
        parts.push(piece(new BoxGeometry(0.1, 0.77, 1.12), 0xffdd91, side * 2.34, y, z));
      }
    }
  }
  return bake(parts);
}

function pedestrian(coat: number, canopy: number): BufferGeometry {
  const leg = () => new CylinderGeometry(0.081, 0.066, 0.82, 6);
  return bake([
    piece(leg(), 0x253441, -0.12, 0.4, -0.09),
    piece(leg(), 0x253441, 0.12, 0.4, 0.1),
    piece(new CylinderGeometry(0.17, 0.27, 0.69, 8), coat, 0, 1.02, 0),
    piece(new SphereGeometry(0.155, 8, 6), 0xb78264, 0, 1.52, 0),
    piece(new CylinderGeometry(0.043, 0.057, 0.45, 6).rotateZ(-0.45), coat, 0.22, 1.2, 0),
    piece(new CylinderGeometry(0.015, 0.015, 0.82, 5), 0x9babae, 0.23, 1.66, 0),
    piece(new ConeGeometry(0.64, 0.29, 10), canopy, 0.23, 2.09, 0),
  ]);
}

export class DocklandsQuay {
  readonly group = new Group();
  private readonly material = new MeshLambertMaterial({ vertexColors: true });
  readonly ferry = new Mesh(passengerFerry(), this.material);
  private readonly walkers = [
    [1341, -8, 0x284958, 0xe78e45],
    [1358, -9, 0x71485b, 0x739ca7],
    [8291, -8, 0x573d51, 0xc55178],
    [8322, -9, 0x36405e, 0xb2aa57],
  ].map(([metres, lane, coat, canopy]) => ({
    metres: metres!,
    lane: lane!,
    mesh: new Mesh(pedestrian(coat!, canopy!), this.material),
  }));
  private readonly point = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };

  constructor(private readonly course: Course) {
    this.group.add(this.ferry, ...this.walkers.map((w) => w.mesh));
    this.at(0);
  }

  get walkerZ(): number {
    return this.walkers[0]!.mesh.position.z;
  }

  at(time: number): void {
    const p = this.course.place(8300 + 14 * Math.sin(time * 0.045), -57, this.point);
    this.ferry.position.set(p.x, 0.25 + 0.12 * Math.sin(time * 0.8), p.z);
    this.ferry.rotation.set(0, p.heading, 0.025 * Math.sin(time * 0.69), 'YXZ');
    for (const [i, w] of this.walkers.entries()) {
      const phase = time * 0.105 + i * 1.2;
      this.course.place(w.metres + 8 * Math.sin(phase), w.lane, p);
      w.mesh.position.set(p.x, p.y + 0.04 * Math.abs(Math.sin(time * 3.2 + i)), p.z);
      w.mesh.rotation.y = p.heading + (Math.cos(phase) < 0 ? Math.PI : 0);
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    this.ferry.geometry.dispose();
    for (const walker of this.walkers) walker.mesh.geometry.dispose();
    this.material.dispose();
  }
}
