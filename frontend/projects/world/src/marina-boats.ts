import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  TorusGeometry,
  type Material,
  type Scene,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';
import { cayanTower } from './world-dubai';
import { seeded, Yachts } from './world-kit';

interface Resource {
  dispose(): void;
}

function dhowGeometry() {
  const xyz: number[] = [],
    rgb: number[] = [];
  function face(points: number[][], tint: number) {
    const c = new Color(tint);
    for (const i of [0, 1, 2, 0, 2, 3]) {
      xyz.push(...points[i]!);
      rgb.push(c.r, c.g, c.b);
    }
  }
  const stations = [
    [-13, 0.1, 1.6],
    [-10.4, 2, 1.0],
    [-6.5, 3.05, 0.81],
    [6.3, 3.05, 0.84],
    [10.1, 2.15, 1.04],
    [12, 0.65, 1.93],
  ];
  for (let i = 1; i < stations.length; i++) {
    const [a, wa, ha] = stations[i - 1]!,
      [b, wb, hb] = stations[i]!;
    for (const side of [-1, 1]) {
      for (let row = 0; row < 6; row++) {
        const low = row / 6,
          high = (row + 1) / 6;
        const pt = (x: number, w: number, h: number, f: number) => [
          x,
          -0.5 + (h + 0.5) * f,
          side * w * (0.68 + 0.32 * f),
        ];
        face(
          [
            pt(a!, wa!, ha!, low),
            pt(b!, wb!, hb!, low),
            pt(b!, wb!, hb!, high),
            pt(a!, wa!, ha!, high),
          ],
          row === 5 ? 0xefbf65 : row % 2 ? 0x754833 : 0x935b37,
        );
      }
    }
    face(
      [
        [a!, ha!, -wa!],
        [b!, hb!, -wb!],
        [b!, hb!, wb!],
        [a!, ha!, wa!],
      ],
      0xb18b58,
    );
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(xyz, 3));
  g.setAttribute('color', new Float32BufferAttribute(rgb, 3));
  g.computeVertexNormals();
  return g;
}

/** Combines a yacht by material once so that its windows and rails share their draw across decks. */
function batchYacht(source: Group, owned: Resource[]): Group {
  source.updateMatrixWorld(true);
  const byMaterial = new Map<Material, BufferGeometry[]>();
  source.traverse((part) => {
    const item = part as Mesh;
    if (!item.isMesh || Array.isArray(item.material)) return;
    const geometry = item.geometry.index ? item.geometry.toNonIndexed() : item.geometry.clone();
    geometry.applyMatrix4(item.matrixWorld);
    const batch = byMaterial.get(item.material);
    if (batch) batch.push(geometry);
    else byMaterial.set(item.material, [geometry]);
  });
  const group = new Group();
  for (const [material, parts] of byMaterial) {
    const mesh = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    owned.push(mesh);
    group.add(new Mesh(mesh, material));
  }
  return group;
}

export class MarinaBoats {
  readonly group = new Group();
  readonly dhow = new Group();
  readonly wheel = new Group();
  private readonly resources: Resource[] = [];
  private readonly moorings: { boat: Group; metres: number }[] = [];
  private lastMetres = -Infinity;
  constructor(
    private readonly course: Course,
    scene: Scene,
  ) {
    const track = <T extends Texture>(t: T) => {
      this.resources.push(t);
      return t;
    };
    const tower = cayanTower(track, this.resources, new Color(0x807881));
    const landmark = course.place(1320, -105);
    tower.position.set(landmark.x, 0, landmark.z);
    this.group.add(tower);
    const kit = new Yachts(this.resources, [0xf5f3e8, 0xe1ded6, 0x364357]);
    const boats = Array.from({ length: 4 }, (_, i) =>
      batchYacht(kit.make(i, 21 + i * 4, seeded(317 + i)), this.resources),
    );
    for (let d = 40, i = 0; d < course.length; d += 86, i++) {
      const where = course.place(d + (i % 3) * 3, -(21 + (i % 4) * 2)),
        boat = boats[i % 4]!.clone();
      boat.position.set(where.x, 0.44, where.z);
      boat.rotation.y = where.heading + 0.18;
      this.moorings.push({ boat, metres: d });
    }
    const hull = dhowGeometry(),
      wood = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
    this.resources.push(hull, wood);
    this.dhow.add(new Mesh(hull, wood));
    const cube = new BoxGeometry(1, 1, 1),
      canopy = new MeshLambertMaterial({ color: 0xc79e6a }),
      light = new MeshBasicMaterial({ color: 0xffcc6a, toneMapped: false });
    this.resources.push(cube, canopy, light);
    const box = (
      parent: Group,
      m: Material,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      l: number,
    ) => {
      const p = new Mesh(cube, m);
      p.position.set(x, y, z);
      p.scale.set(w, h, l);
      parent.add(p);
    };
    for (const z of [-2.2, 2.2])
      for (const x of [-6, -2, 2, 6]) box(this.dhow, canopy, x, 2.27, z, 0.12, 2.82, 0.12);
    box(this.dhow, canopy, 0, 3.73, 0, 16, 0.22, 5.2);
    for (const z of [-2.62, 2.62]) box(this.dhow, light, 0, 3.62, z, 16, 0.06, 0.06);
    const berth = course.place(1708, -19.5);
    this.dhow.position.set(berth.x, 0.48, berth.z);
    this.dhow.rotation.y = berth.heading + Math.PI / 2;
    this.group.add(this.dhow);
    const hub = course.place(8190, -85);
    const support = new Group();
    const rim = new TorusGeometry(88, 1.65, 6, 96);
    this.resources.push(rim);
    this.wheel.add(new Mesh(rim, light));
    const lines: number[] = [];
    for (let i = 0; i < 48; i++) {
      const a = (i * Math.PI) / 24,
        x = 88 * Math.cos(a),
        y = 88 * Math.sin(a);
      lines.push(0, 0, 0, x, y, 0);
      if (i % 2 === 0) box(this.wheel, canopy, x, y, 0, 4.4, 2.75, 3.1);
    }
    const spokes = new BufferGeometry();
    spokes.setAttribute('position', new Float32BufferAttribute(lines, 3));
    const steel = new LineBasicMaterial({ color: 0xdacbc5 });
    this.resources.push(spokes, steel);
    this.wheel.add(new LineSegments(spokes, steel));
    const leg = new CylinderGeometry(1.25, 2.1, 101, 7);
    this.resources.push(leg);
    for (const side of [-1, 1]) {
      const p = new Mesh(leg, canopy);
      p.rotation.z = -side * 0.32;
      p.position.set(-side * 16, 48, 0);
      support.add(p);
    }
    this.wheel.position.y = 96;
    support.add(this.wheel);
    support.rotation.y = course.place(7760).heading;
    support.position.set(hub.x, 0.35, hub.z);
    this.group.add(support);
    scene.add(this.group);
    this.follow(0);
  }
  follow(metres: number) {
    if (Math.abs(metres - this.lastMetres) < 18) return;
    this.lastMetres = metres;
    for (const { boat, metres: berth } of this.moorings) {
      const delta = Math.abs(berth - metres);
      if (Math.min(delta, this.course.length - delta) < 280) {
        if (!boat.parent) this.group.add(boat);
      } else if (boat.parent) boat.removeFromParent();
    }
  }
  at(time: number) {
    this.dhow.rotation.z = 0.026 * Math.sin(0.76 * time);
    this.dhow.position.y = 0.52 + 0.15 * Math.sin(0.54 * time);
    this.wheel.rotation.z = (time * Math.PI) / 1080;
  }
  dispose() {
    this.group.removeFromParent();
    this.group.clear();
    for (const r of this.resources) r.dispose();
    this.resources.length = 0;
    this.moorings.length = 0;
  }
}
