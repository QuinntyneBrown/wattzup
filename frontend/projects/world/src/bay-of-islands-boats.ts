import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';

const anchorages = [365, 1550, 3200, 8170, 15100, 22200, 26630];
/** A wedge with a narrow bow, shared by the ferry, moored yachts and tall ship. */
function hullGeometry(): BufferGeometry {
  const coordinates: number[] = [];
  const stations = [
    [-0.5, 0.36],
    [-0.28, 0.48],
    [0.16, 0.5],
    [0.38, 0.34],
    [0.5, 0.02],
  ] as const;
  for (let i = 1; i < stations.length; i++) {
    const [a, wa] = stations[i - 1]!,
      [b, wb] = stations[i]!;
    for (const side of [-1, 1]) {
      const rimA = [a, 1, side * wa],
        rimB = [b, 1, side * wb],
        keelA = [a, 0, side * wa * 0.48],
        keelB = [b, 0, side * wb * 0.48];
      coordinates.push(...rimA, ...keelA, ...keelB, ...rimA, ...keelB, ...rimB);
    }
    coordinates.push(a, 1, wa, b, 1, wb, b, 1, -wb, a, 1, wa, b, 1, -wb, a, 1, -wa);
  }
  coordinates.push(
    -0.5,
    1,
    0.36,
    -0.5,
    0,
    0.173,
    -0.5,
    0,
    -0.173,
    -0.5,
    1,
    0.36,
    -0.5,
    0,
    -0.173,
    -0.5,
    1,
    -0.36,
  );
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(coordinates, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export class BayOfIslandsBoats {
  readonly group = new Group();
  private readonly material = new MeshLambertMaterial({ side: DoubleSide });
  private readonly hull = hullGeometry();
  private readonly deck = new BoxGeometry();
  private readonly sail = new BufferGeometry();
  private readonly hulls = new InstancedMesh(this.hull, this.material, 9);
  private readonly deckParts = new InstancedMesh(this.deck, this.material, 150);
  private readonly sails: InstancedMesh;
  private readonly boat = new Group();
  private readonly part = new Object3D();
  private readonly at: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly colour = new Color();
  private hullCount = 0;
  private deckCount = 0;
  private sailCount = 0;
  ferryX: number | null = null;

  constructor(private readonly course: Course) {
    this.sail.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    this.sail.computeVertexNormals();
    this.sails = new InstancedMesh(this.sail, this.material, 20);
    this.boat.add(this.part);
    this.group.add(this.hulls, this.deckParts, this.sails);
    for (const mesh of [this.hulls, this.deckParts, this.sails]) mesh.frustumCulled = false;
    this.update(0, 0);
  }

  private draw(
    mesh: InstancedMesh,
    index: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    tint: number,
    yaw = 0,
  ): void {
    this.part.position.set(x, y, z);
    this.part.rotation.set(0, yaw, 0);
    this.part.scale.set(w, h, depth);
    this.part.updateWorldMatrix(false, false);
    mesh.setMatrixAt(index, this.part.matrixWorld);
    mesh.setColorAt(index, this.colour.setHex(tint));
  }
  private box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    tint: number,
    yaw = 0,
  ): void {
    this.draw(this.deckParts, this.deckCount++, x, y, z, w, h, depth, tint, yaw);
  }
  private place(d: number, lane: number, yaw: number, roll: number): void {
    this.course.place(d, lane, this.at);
    this.boat.position.set(this.at.x, 0.1, this.at.z);
    this.boat.rotation.set(roll, this.at.heading + Math.PI / 2 + yaw, 0);
    this.boat.updateMatrixWorld();
  }

  update(metres: number, time: number): void {
    const anchor = anchorages.find((d) => Math.abs(d - metres) < 420);
    this.group.visible = anchor !== undefined;
    this.ferryX = null;
    if (anchor === undefined) return;
    this.hullCount = this.deckCount = this.sailCount = 0;
    // The ferry follows an elongated loop around its mooring. Its heading follows the tangent at either end.
    const phase = time * 0.025;
    this.place(
      anchor + 32 * Math.sin(phase),
      48 + 15 * Math.cos(phase),
      Math.atan2(15 * Math.sin(phase), 32 * Math.cos(phase)),
      0.016 * Math.sin(time * 0.6),
    );
    this.ferryX = this.boat.position.x;
    const white = 0xeee9d6,
      glass = 0x455f70;
    this.draw(this.hulls, this.hullCount++, 0, 0, 0, 13.4, 1.45, 4.0, 0x375d6a);
    this.box(-0.18, 1.86, 0, 8.65, 1.32, 3.25, white);
    this.box(-0.45, 2.65, 0, 9.3, 0.25, 3.66, 0x9baa94);
    this.box(0.64, 3.14, 0, 3.75, 0.89, 2.66, white);
    this.box(0.68, 3.66, 0, 4.18, 0.18, 2.98, 0x64877c);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++)
        this.box(-3.73 + i * 1.15, 2.01, side * 1.64, 0.88, 0.61, 0.09, glass);
      this.box(0.65, 3.21, side * 1.34, 3.3, 0.48, 0.07, glass);
      this.box(-8.3, 0.05, side * 1.69, 7.2, 0.07, 0.43, 0xc2ded6, side * 0.18);
    }
    for (let i = 0; i < 7; i++) {
      const tall = i === 6;
      this.place(
        anchor + 22 + i * 15,
        66 + (i % 3) * 20 + (tall ? 15 : 0),
        0.38 * i + 0.08 * Math.sin(time * 0.19 + i),
        0.035 * Math.sin(time * 0.62 + i),
      );
      const length = tall ? 21 : 6.5 + (i % 3),
        height = tall ? 1.7 : 0.83;
      this.draw(
        this.hulls,
        this.hullCount++,
        0,
        0,
        0,
        length,
        height,
        tall ? 4.8 : 2.35,
        tall ? 0x6a4e39 : [0xe1dacc, 0x708f9c, 0xb98d6c][i % 3]!,
      );
      this.box(-length * 0.13, height + 0.17, 0, length * 0.33, 0.39, tall ? 3 : 1.5, 0xc2b395);
      for (let mast = 0; mast < (tall ? 3 : 1); mast++) {
        const mx = tall ? (mast - 1) * 5.1 : 0,
          high = tall ? 12.4 : 6.7;
        this.box(mx, height + high * 0.5, 0, 0.12, high, 0.12, tall ? 0x84674d : 0xaeb7aa);
        if (tall) {
          for (let yard = 0; yard < 3; yard++)
            this.box(mx, height + 4.2 + yard * 2.8, 0, 0.16, 0.18, 5.3 - yard * 0.9, 0x926d51);
        } else {
          this.draw(
            this.sails,
            this.sailCount++,
            mx + 0.1,
            height + 0.5,
            0,
            2.7,
            5.8,
            1,
            i % 3 === 0 ? 0xe1be77 : 0xe9e4cf,
          );
          this.draw(
            this.sails,
            this.sailCount++,
            mx - 0.12,
            height + 0.48,
            0.08,
            1.93,
            4.6,
            1,
            0xebe5d2,
            Math.PI,
          );
        }
      }
    }
    for (const [mesh, count] of [
      [this.hulls, this.hullCount],
      [this.sails, this.sailCount],
      [this.deckParts, this.deckCount],
    ] as const) {
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const r of [
      this.hulls,
      this.deckParts,
      this.sails,
      this.hull,
      this.deck,
      this.sail,
      this.material,
    ])
      r.dispose();
  }
}
