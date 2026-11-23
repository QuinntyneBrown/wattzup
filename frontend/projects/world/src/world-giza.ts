// Giza Plateau's road, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the desert
// road round the pyramids at sunrise. Golden sand drifts over the road's edges between limestone
// kerbs; low mastaba tombs and scattered blocks line it, a camel caravan plods along the verge
// with its riders, and once a lap the Sphinx crouches beside the road. The three great pyramids
// and their queens' pyramids stand over the plateau on the left at the bearing the road keeps
// round them, and Cairo's minarets rise out of the haze on the right. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  Figures,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The road repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
const KERB = 0.18;
/** The Sphinx crouches beside the road this far round each lap. */
const SPHINX_AT = 260;
/** Every camel in the caravan is CAMEL metres behind the one in front. */
const CAMEL = 4.5;

/** The pyramids: x and z from the rider, half the base and the height, in metres. */
const PYRAMIDS: readonly (readonly [number, number, number, number, boolean])[] = [
  // Khufu, Khafre (its casing cap still on), Menkaure, and the queens' pyramids.
  [-240, -900, 115, 139, false],
  [-520, -1300, 107, 136, true],
  [-760, -1640, 52, 65, false],
  [-120, -760, 23, 30, false],
  [-90, -820, 23, 30, false],
  [-860, -1560, 17, 21, false],
  [-900, -1600, 17, 21, false],
];

const RIDER_WEAR = {
  tops: ['#f5f1e8', '#1b3a5c', '#c8102e', '#e8c9a0', '#2a2a2e'],
  bottoms: ['#f5f1e8', '#5a4a3a', '#2f3e5c'],
  skins: ['#8d5a3b', '#c48a5f', '#5a3a29', '#e2b48c'],
};

interface Camel {
  readonly mesh: Group;
  readonly legs: Mesh[];
  readonly offset: number;
  readonly x: number;
  readonly phase: number;
}

export class GizaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly camels: Camel[] = [];
  private riders: Figures | null = null;
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addGround(roadHalf, points);
    this.addRubble(roadHalf);
    this.addMastabas(roadHalf);
    this.addSphinx(roadHalf);
    this.addCaravan(roadHalf);
    this.addPalms(roadHalf);
    this.addPyramids();
    this.addCairo();
  }

  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const riders = this.riders;
    this.camels.forEach((camel, i) => {
      const metres = loopMetres(camel.offset + 1.1 * this.time, s, LOOP, BEHIND);
      const y = heightAt(metres) + KERB;
      const sway = Math.sin(this.time * 2.4 + camel.phase);
      camel.mesh.position.set(camel.x, y + Math.abs(sway) * 0.05, -metres);
      camel.mesh.scale.setScalar(1.25);
      camel.mesh.rotation.z = sway * 0.03;
      camel.legs.forEach((leg, k) => {
        leg.rotation.x = Math.sin(this.time * 2.4 + camel.phase + (k % 2 ? Math.PI : 0)) * 0.35;
      });
      riders?.set(i, camel.x, y + 1.95 + Math.abs(sway) * 0.05, -metres + 0.1, 0, 0.9, 0);
    });
    riders?.commit();
    // The pyramids and the city keep their bearing as the road runs round the plateau.
    this.horizon.position.set(0, heightAt(0) - 6, 0);
  }

  /** The road's limestone kerbs and its drifted edges, and the sand rising away in dunes. */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const kerb = this.material({ map: this.repeat(limestoneTexture(), 1, 1), roughness: 0.9 });
    const drift = this.material({
      map: this.repeat(sandTexture(), 3, 6),
      roughness: 1,
      transparent: true,
    });
    const sand = this.material({ map: this.repeat(sandTexture(), 14, 14), roughness: 1 });
    for (const side of [-1, 1] as const) {
      const profile: [number, number][] = [
        [side * r, 0],
        [side * (r + 0.05), KERB],
        [side * (r + 0.45), KERB],
      ];
      this.ribbons.add(points, kerb, side < 0 ? profile : [...profile].reverse());
      // Sand blown across the road's edge, thinning onto the tarmac.
      const blown: [number, number][] = [
        [side * (r - 0.9), 0.01],
        [side * r, 0.05],
      ];
      this.ribbons.add(points, drift, side < 0 ? [...blown].reverse() : blown);
      const dunes: [number, number][] = [
        [side * (r + 0.45), KERB],
        [side * (r + 30), 0.6],
        [side * (r + 120), 3],
        [side * (r + 600), 10],
      ];
      this.ribbons.add(points, sand, side < 0 ? dunes : [...dunes].reverse());
    }
  }

  /** Limestone blocks and rubble scattered over the sand, in tiles along the road. */
  private addRubble(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(limestoneTexture(), 1.5, 1.5),
      roughness: 0.95,
    });
    const tiles = [0, 1, 2].map((k) => {
      const random = seeded(503 + k);
      const parts: BufferGeometry[] = [];
      for (let i = 0; i < 26; i++) {
        const block =
          random() < 0.4
            ? new BoxGeometry(1.2, 0.8, 0.9)
            : new IcosahedronGeometry(0.3 + random() * 0.5, 0);
        block.rotateY(random() * 3);
        block.rotateZ((random() - 0.5) * 0.4);
        const side = random() < 0.5 ? -1 : 1;
        block.translate(side * (roadHalf + 3 + random() * 60), 0.2, -random() * 50);
        parts.push(block.index ? block.toNonIndexed() : block);
      }
      const merged = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      this.disposables.push(merged);
      return merged;
    });
    for (let offset = 0, k = 0; offset < LOOP; offset += 50, k++) {
      const tile = new Group();
      tile.add(new Mesh(tiles[k % 3]!, stone));
      this.group.add(tile);
      this.props.push({ mesh: tile, offset, x: 0 });
    }
  }

  /** Mastaba tombs: low, battered limestone benches with a dark doorway, along both sides. */
  private addMastabas(roadHalf: number): void {
    const random = seeded(509);
    const stone = this.material({ map: this.repeat(coursesTexture(), 6, 3), roughness: 0.95 });
    const door = this.material({ color: 0x2a2018, roughness: 1 });
    const body = new CylinderGeometry(Math.SQRT1_2 * 0.82, Math.SQRT1_2, 1, 4);
    body.rotateY(Math.PI / 4);
    body.translate(0, 0.5, 0);
    this.disposables.push(body);
    for (let offset = 30; offset < LOOP; offset += 45 + random() * 30) {
      if (Math.abs(offset - SPHINX_AT) < 40) continue;
      const side = random() < 0.6 ? -1 : 1;
      const tomb = new Group();
      const mesh = new Mesh(body, stone);
      const length = 14 + random() * 12;
      mesh.scale.set(8 + random() * 4, 3.5 + random() * 2, length);
      mesh.castShadow = true;
      const d = new Mesh(this.unit, door);
      d.scale.set(0.1, 1.8, 1.1);
      d.position.set(-side * (mesh.scale.x * 0.42), 0.9, 0);
      tomb.add(mesh, d);
      this.group.add(tomb);
      this.props.push({ mesh: tomb, offset, x: side * (roadHalf + 14 + random() * 20) });
    }
  }

  /**
   * The Sphinx, once a lap on the right: a lion's body crouched on its paws, its head in the
   * striped nemes headdress, facing the road, on a hollow cut into the bedrock.
   */
  private addSphinx(roadHalf: number): void {
    const stone = this.material({
      map: this.repeat(coursesTexture(), 4, 4),
      color: 0xe0c08a,
      roughness: 0.95,
    });
    const nemes = this.material({ map: this.track(nemesTexture()), roughness: 0.9 });
    const sphinx = new Group();
    const part = (geometry: BufferGeometry, x: number, y: number, z: number, m = stone) => {
      const mesh = new Mesh(geometry, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      sphinx.add(mesh);
      return mesh;
    };
    const body = new CapsuleGeometry(4, 22, 6, 12);
    body.rotateX(Math.PI / 2);
    body.scale(1, 0.85, 1);
    const haunch = new SphereGeometry(5, 14, 10);
    haunch.scale(1, 0.8, 1.1);
    const paw = new BoxGeometry(2.6, 2, 12);
    const chest = new BoxGeometry(7, 7, 4);
    const head = new BoxGeometry(4.2, 4.6, 4.2);
    const hood = new CylinderGeometry(2.6, 4.2, 6, 4, 1);
    hood.rotateY(Math.PI / 4);
    hood.scale(1.1, 1, 0.8);
    const face = new BoxGeometry(3, 3.6, 0.8);
    this.disposables.push(body, haunch, paw, chest, head, hood, face);
    part(body, 0, 4.2, 4);
    part(haunch, 0, 4.2, 15);
    part(paw, -2, 1, -11);
    part(paw, 2, 1, -11);
    part(chest, 0, 5.5, -5.5);
    part(hood, 0, 10.5, -6.2, nemes);
    part(head, 0, 11.6, -6.6);
    part(face, 0, 11.4, -8.7);
    // The cut hollow it sits in, its walls of layered bedrock.
    const wall = this.material({
      map: this.repeat(coursesTexture(), 4, 2),
      color: 0xc8a878,
      roughness: 1,
    });
    for (const [x, z, w, d] of [
      [10, 0, 1.5, 44],
      [-10, 0, 1.5, 44],
      [0, 21, 20, 1.5],
    ] as const) {
      const cut = new Mesh(this.unit, wall);
      cut.scale.set(w, 4, d);
      cut.position.set(x, 1.6, z);
      sphinx.add(cut);
    }
    // Facing the road: the Sphinx looks out across it, to the rider's left.
    sphinx.rotation.y = -Math.PI / 2;
    sphinx.scale.setScalar(0.75);
    this.group.add(sphinx);
    this.props.push({ mesh: sphinx, offset: SPHINX_AT, x: roadHalf + 26 });
  }

  /** A camel caravan plodding along the left verge, a rider in a robe on each. */
  private addCaravan(roadHalf: number): void {
    const coat = this.material({ color: 0xb98a5a, roughness: 0.9 });
    const blanket = this.material({ map: this.track(blanketTexture()), roughness: 0.9 });
    const body = new CapsuleGeometry(0.42, 1.2, 4, 10);
    body.rotateX(Math.PI / 2);
    const hump = new SphereGeometry(0.42, 10, 8);
    hump.scale(1, 0.9, 1.2);
    const neck = new CapsuleGeometry(0.14, 0.9, 4, 8);
    neck.rotateX(-0.6);
    const head = new CapsuleGeometry(0.13, 0.42, 4, 8);
    head.rotateX(Math.PI / 2 - 0.2);
    const leg = new CylinderGeometry(0.08, 0.06, 1.2, 6);
    leg.translate(0, -0.6, 0);
    const saddle = new BoxGeometry(0.9, 0.12, 0.8);
    this.disposables.push(body, hump, neck, head, leg, saddle);
    const x = -roadHalf - 2.2;
    for (let k = 0; k < 7; k++) {
      const camel = new Group();
      const add = (
        g: BufferGeometry,
        m: MeshStandardMaterial,
        px: number,
        py: number,
        pz: number,
      ) => {
        const mesh = new Mesh(g, m);
        mesh.position.set(px, py, pz);
        mesh.castShadow = true;
        camel.add(mesh);
        return mesh;
      };
      add(body, coat, 0, 1.5, 0);
      add(hump, coat, 0, 1.9, 0.1);
      add(saddle, blanket, 0, 2.25, 0.1);
      add(neck, coat, 0, 1.85, -1.05);
      add(head, coat, 0, 2.3, -1.45);
      const legs = [
        [-0.25, -0.55],
        [0.25, -0.55],
        [-0.25, 0.6],
        [0.25, 0.6],
      ].map(([lx, lz]) => add(leg, coat, lx!, 1.25, lz!));
      this.group.add(camel);
      this.camels.push({ mesh: camel, legs, offset: 40 + k * CAMEL, x, phase: k * 0.9 });
    }
    this.riders = new Figures(this.group, this.disposables, this.camels.length, RIDER_WEAR, 521);
  }

  /** Date palms in clumps out on the sand, where the village edges the plateau on the right. */
  private addPalms(roadHalf: number): void {
    const random = seeded(523);
    const trunk = new CylinderGeometry(0.16, 0.26, 8, 8);
    trunk.translate(0, 4, 0);
    const crown = palmCrown();
    this.disposables.push(trunk, crown);
    const bark = this.material({ color: 0x7a6248, roughness: 1 });
    const fronds = this.material({ color: 0x4a6b34, roughness: 0.9 });
    for (let offset = 10; offset < LOOP; offset += 40 + random() * 40) {
      const clump = new Group();
      for (let k = 0; k < 3 + random() * 3; k++) {
        const palm = new Group();
        palm.add(new Mesh(trunk, bark), new Mesh(crown, fronds));
        palm.position.set((random() - 0.5) * 8, 0, (random() - 0.5) * 8);
        palm.scale.setScalar(0.8 + random() * 0.4);
        palm.rotation.set((random() - 0.5) * 0.15, random() * 6, (random() - 0.5) * 0.15);
        clump.add(palm);
      }
      this.group.add(clump);
      this.props.push({ mesh: clump, offset, x: roadHalf + 40 + random() * 50 });
    }
  }

  /**
   * The pyramids over the plateau on the left: square cones of stepped courses, Khafre's top still
   * cased in smooth white limestone.
   */
  private addPyramids(): void {
    const courses = this.track(coursesTexture());
    courses.wrapS = RepeatWrapping;
    courses.wrapT = RepeatWrapping;
    courses.repeat.set(30, 60);
    const stone = new MeshStandardMaterial({ map: courses, color: 0xe6c38c, roughness: 0.95 });
    const casing = this.material({ color: 0xf2e6cc, roughness: 0.6 });
    this.disposables.push(stone);
    for (const [x, z, half, height, capped] of PYRAMIDS) {
      const body = new ConeGeometry(half * Math.SQRT2, height, 4, 1);
      body.rotateY(Math.PI / 4);
      body.translate(0, height / 2, 0);
      this.disposables.push(body);
      const pyramid = new Mesh(body, stone);
      pyramid.position.set(x, 0, z);
      pyramid.castShadow = true;
      this.horizon.add(pyramid);
      if (capped) {
        const cap = new ConeGeometry(half * Math.SQRT2 * 0.22, height * 0.22, 4, 1);
        cap.rotateY(Math.PI / 4);
        cap.translate(0, height * 0.89 + 0.3, 0);
        this.disposables.push(cap);
        const top = new Mesh(cap, casing);
        top.position.set(x, 0, z);
        this.horizon.add(top);
      }
    }
    this.group.add(this.horizon);
  }

  /** Cairo across the haze on the right: blocks of the city, domes and the minarets over them. */
  private addCairo(): void {
    const random = seeded(541);
    const haze = this.material({ color: 0xd9b48a, roughness: 1 });
    const minaret = new CylinderGeometry(1.2, 1.8, 60, 8);
    minaret.translate(0, 30, 0);
    const tip = new ConeGeometry(1.6, 8, 8);
    tip.translate(0, 64, 0);
    const dome = new SphereGeometry(12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(minaret, tip, dome);
    for (let k = 0; k < 70; k++) {
      const a = -0.2 + random() * 1.8;
      const d = 1300 + random() * 500;
      const h = 15 + random() * 45;
      const block = new Mesh(this.unit, haze);
      block.scale.set(40 + random() * 50, h, 40 + random() * 50);
      block.position.set(Math.sin(a) * d, h / 2, -Math.cos(a) * d);
      this.horizon.add(block);
      if (random() < 0.15) {
        const at = block.position.clone();
        const m = new Mesh(minaret, haze);
        m.position.set(at.x + 20, 0, at.z);
        const t = new Mesh(tip, haze);
        t.position.set(at.x + 20, 0, at.z);
        const dm = new Mesh(dome, haze);
        dm.position.set(at.x - 10, h, at.z);
        this.horizon.add(m, t, dm);
      }
    }
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: CanvasTexture, x: number, y: number) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** A date palm's crown of drooping fronds. */
function palmCrown(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 9; k++) {
    const frond = new ConeGeometry(0.3, 3.6, 4);
    frond.scale(1, 1, 0.25);
    frond.translate(0, 1.8, 0);
    frond.rotateZ(1.1 + (k % 2) * 0.3);
    frond.rotateY((k / 9) * Math.PI * 2);
    frond.translate(0, 8, 0);
    parts.push(frond);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Golden sand, wind-rippled, warm in the low sun. */
function sandTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#d9a86a', 547);
    g.strokeStyle = 'rgba(150,100,50,0.2)';
    g.lineWidth = 3;
    for (let y = 0; y < 512; y += 14) {
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 512; x += 24) g.lineTo(x, y + Math.sin(x / 30 + y * 0.3) * 4);
      g.stroke();
    }
  });
}

/** Pale limestone, pitted. */
function limestoneTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => speckle(g, 256, 256, '#d8c39c', 557));
}

/** Courses of limestone blocks: the pyramids' steps, the mastabas' and the Sphinx's layers. */
function coursesTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#dcc08e', 563);
    const random = seeded(569);
    for (let y = 0; y < 256; y += 16) {
      g.fillStyle = 'rgba(90,60,30,0.45)';
      g.fillRect(0, y, 256, 3);
      g.fillStyle = 'rgba(255,240,210,0.25)';
      g.fillRect(0, y + 3, 256, 2);
      g.fillStyle = 'rgba(90,60,30,0.3)';
      for (let x = random() * 40; x < 256; x += 30 + random() * 30) g.fillRect(x, y, 2, 16);
    }
  });
}

/** The nemes headdress's stripes. */
function nemesTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = '#d9b67a';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#b8935a';
    for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 8, 128);
  });
}

/** A camel's woven saddle blanket. */
function blanketTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    const colours = ['#c8102e', '#ffd23f', '#1b3a5c', '#f5f1e8'];
    for (let y = 0; y < 64; y += 8) {
      g.fillStyle = colours[(y / 8) % colours.length]!;
      g.fillRect(0, y, 64, 8);
    }
  });
}
