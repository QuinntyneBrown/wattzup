import { parkCarriage } from './park-carriage';
// Central Park Loop's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Park
// Drive on an early morning. The rider takes the cyclists' lane; joggers run the lane to their
// left and horse carriages clip along the lane to their right. American elms arch over the
// drive, cast-iron lamps and benches line it, the Reservoir opens on the left behind its iron
// fence with Fifth Avenue beyond, Bethesda Fountain's angel stands on its terrace once a lap, and
// Midtown's towers rise over the trees ahead. Built on the shared kit (world-kit.ts) on the
// pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  type Material,
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

/** The drive repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 420;
const BEHIND = 24;
const KERB = 0.12;
/** The runners' lane, left of the rider, and the carriage lane, right of them. */
const RUNNERS = 6.2;
const CARRIAGES = 7.0;
/** The Reservoir's iron fence and its water, on the left. */
const FENCE = 26;
/** Bethesda Terrace opens on the right this far round each lap. */
const TERRACE_AT = 210;
const TERRACE_X = 20;
/** Midtown's towers stand this far ahead, hazed by hand. */
const MIDTOWN_AHEAD = 1500;
const HAZE = 0xc9d6df;

const RUNNING_KIT = {
  tops: ['#ff4f5e', '#2c7be5', '#f5f5f0', '#111318', '#ffb000', '#14b8a6', '#9b5de5', '#ff7a00'],
  bottoms: ['#111318', '#24262b', '#2f3e5c', '#5a5f69'],
  skins: ['#5a3a29', '#8d5a3b', '#c48a5f', '#e2b48c', '#f0c8a0', '#3f2a1f'],
};

interface Jogger {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly scale: number;
  readonly phase: number;
}

interface Carriage {
  readonly mesh: Group;
  readonly offset: number;
  readonly speed: number;
  readonly legs: Mesh[];
}

export class CentralParkStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly joggers: Jogger[] = [];
  private figures: Figures | null = null;
  private readonly carriages: Carriage[] = [];
  private readonly skyline = new Group();
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
    this.addElms();
    this.addLampsAndBenches();
    this.addJoggers(roadHalf);
    this.addCarriages(roadHalf);
    this.addTerrace();
    this.addSkyline();
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
    const figures = this.figures;
    if (figures) {
      this.joggers.forEach((j, i) => {
        const metres = loopMetres(j.offset + j.speed * this.time, s, LOOP, BEHIND);
        const stride = Math.abs(Math.sin(this.time * 8 + j.phase)) * 0.07;
        figures.set(i, j.x, heightAt(metres), -metres, j.speed > 0 ? 0 : Math.PI, j.scale, stride);
      });
      figures.commit();
    }
    for (const c of this.carriages) {
      const metres = loopMetres(c.offset + c.speed * this.time, s, LOOP, BEHIND);
      c.mesh.position.set(c.mesh.position.x, heightAt(metres), -metres);
      // A trot: diagonal pairs of legs swing together.
      c.legs.forEach((leg, k) => {
        leg.rotation.x = Math.sin(this.time * 9 + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.45;
      });
    }
    this.skyline.position.set(0, heightAt(1e6) - 3, -MIDTOWN_AHEAD);
  }

  /**
   * The drive's two painted lanes, its kerbs, the lawns, the Reservoir's cinder track, iron fence
   * and water on the left, and the bridle path's woods on the right.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const runners = this.material({
      map: this.repeat(laneTexture('#3d4046', 'RUNNERS'), RUNNERS - r, 14),
    });
    const carriage = this.material({
      map: this.repeat(laneTexture('#44464b', 'HORSE'), CARRIAGES - r, 14),
    });
    const lawn = this.material({ map: this.repeat(lawnTexture(), 6, 6), roughness: 1 });
    const cinder = this.material({ map: this.repeat(cinderTexture(), 3, 3), roughness: 1 });
    const fence = this.material({
      map: this.repeat(fenceTexture(), 1 / 1.3, 1 / 2.2),
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0x1f2a24,
      metalness: 0.5,
      roughness: 0.5,
    });
    const water = this.material({
      map: this.repeat(reservoirTexture(), 30, 30),
      color: 0xa9c4d6,
      roughness: 0.08,
      metalness: 0.15,
    });
    const granite = this.material({ map: this.repeat(graniteTexture(), 2, 2), roughness: 0.9 });
    this.ribbons.add(points, runners, [
      [-r, 0.004],
      [-RUNNERS, 0.004],
    ]);
    this.ribbons.add(points, carriage, [
      [CARRIAGES, 0.004],
      [r, 0.004],
    ]);
    this.ribbons.add(points, lawn, [
      [-RUNNERS, 0],
      [-RUNNERS - 0.25, KERB],
      [-FENCE + 3.2, KERB + 0.1],
    ]);
    this.ribbons.add(points, cinder, [
      [-FENCE + 3.2, KERB + 0.1],
      [-FENCE + 0.2, KERB + 0.1],
    ]);
    this.ribbons.add(points, granite, [
      [-FENCE + 0.2, KERB + 0.1],
      [-FENCE + 0.2, KERB + 0.6],
      [-FENCE - 0.4, KERB + 0.6],
      [-FENCE - 0.4, -1.2],
    ]);
    this.ribbons.add(points, fence, [
      [-FENCE, KERB + 0.6],
      [-FENCE, KERB + 1.9],
    ]);
    this.ribbons.add(points, water, [
      [-FENCE - 0.4, -1.2],
      [-600, -1.2],
    ]);
    this.ribbons.add(points, lawn, [
      [400, KERB + 0.4],
      [CARRIAGES + 0.25, KERB],
      [CARRIAGES, 0],
    ]);
  }

  /** American elms: tall grey trunks forking into a vase, the crowns arching over the drive. */
  private addElms(): void {
    const random = seeded(17);
    const bark = this.material({ color: 0x5b554c, roughness: 1 });
    const leaves = [0x3f6f2e, 0x4a7c34, 0x355f2a, 0x5a8a3c].map((hex) =>
      this.material({ color: hex, roughness: 0.95 }),
    );
    const trunk = elmTrunk();
    const crown = elmCrown();
    this.disposables.push(trunk, crown);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += side < 0 ? 15 : 10) {
        if (side > 0 && Math.abs(offset - TERRACE_AT) < 26) continue;
        const tree = new Group();
        const t = new Mesh(trunk, bark);
        const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
        t.castShadow = true;
        c.castShadow = true;
        tree.add(t, c);
        tree.scale.setScalar(0.85 + random() * 0.35);
        // The crowns lean out over the drive.
        tree.rotation.y = side < 0 ? Math.PI : 0;
        this.group.add(tree);
        const x = side < 0 ? -RUNNERS - 3 - random() * 2.5 : CARRIAGES + 3 + random() * 9;
        this.props.push({ mesh: tree, offset: offset + random() * 5, x });
      }
    }
  }

  /** Central Park's cast-iron lamps, a lantern on each, and slatted benches between them. */
  private addLampsAndBenches(): void {
    const iron = this.material({ color: 0x23302a, metalness: 0.5, roughness: 0.45 });
    const globe = this.material({
      color: 0xfdf6e3,
      emissive: 0xffe2a6,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const slats = this.material({ map: this.track(slatTexture()), roughness: 0.8 });
    const post = new CylinderGeometry(0.06, 0.12, 3.6, 10);
    post.translate(0, 1.8, 0);
    const foot = new CylinderGeometry(0.18, 0.22, 0.5, 10);
    foot.translate(0, 0.25, 0);
    const lantern = new SphereGeometry(0.24, 14, 10);
    lantern.translate(0, 3.85, 0);
    const finial = new ConeGeometry(0.1, 0.3, 8);
    finial.translate(0, 4.2, 0);
    this.disposables.push(post, foot, lantern, finial);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 30) {
        const lamp = new Group();
        lamp.add(new Mesh(post, iron), new Mesh(foot, iron), new Mesh(lantern, globe));
        lamp.add(new Mesh(finial, iron));
        lamp.children.forEach((m) => (m.castShadow = true));
        this.group.add(lamp);
        const x = side < 0 ? -RUNNERS - 0.9 : CARRIAGES + 0.9;
        this.props.push({ mesh: lamp, offset: offset + (side > 0 ? 15 : 0), x });
      }
      for (let offset = 7; offset < LOOP; offset += 30) {
        const bench = new Group();
        const seat = new Mesh(this.unit, slats);
        seat.scale.set(0.5, 0.06, 1.8);
        seat.position.y = 0.45;
        const back = new Mesh(this.unit, slats);
        back.scale.set(0.06, 0.5, 1.8);
        back.position.set(side * 0.25, 0.75, 0);
        bench.add(seat, back);
        for (const z of [-0.8, 0.8]) {
          const leg = new Mesh(this.unit, iron);
          leg.scale.set(0.5, 0.45, 0.06);
          leg.position.set(0, 0.22, z);
          bench.add(leg);
        }
        bench.children.forEach((m) => (m.castShadow = true));
        this.group.add(bench);
        const x = side < 0 ? -RUNNERS - 1.6 : CARRIAGES + 1.6;
        this.props.push({ mesh: bench, offset: offset + (side > 0 ? 15 : 0), x });
      }
    }
  }

  /** Joggers in the runners' lane, most running with the rider, some towards them. */
  private addJoggers(roadHalf: number): void {
    const random = seeded(29);
    for (let offset = 0; offset < LOOP; offset += 5 + random() * 9) {
      const towards = random() < 0.35;
      this.joggers.push({
        offset,
        x: -(roadHalf + 0.6 + random() * (RUNNERS - roadHalf - 1.2)),
        speed: (towards ? -1 : 1) * (2.6 + random() * 1.4),
        scale: 0.92 + random() * 0.14,
        phase: random() * 6.3,
      });
    }
    this.figures = new Figures(this.group, this.disposables, this.joggers.length, RUNNING_KIT, 31);
  }

  /** Horse carriages clipping along the carriage lane with the rider, a driver up on each. */
  private addCarriages(roadHalf: number): void {
    const random = seeded(37);
    const coats = [0x5a3a24, 0xe9e4da, 0x2a211b, 0x8a5a3a];
    const bodies = [0x7a1424, 0x101114, 0x1b3a2a, 0xf1ece2];
    for (let i = 0; i < 4; i++) {
      const horse = this.material({ color: coats[i % coats.length]!, roughness: 0.6 });
      const body = this.material({
        color: bodies[i % bodies.length]!,
        roughness: 0.35,
        metalness: 0.3,
      });
      const { group, legs } = parkCarriage(horse, body, this.disposables);
      group.position.x = roadHalf + (CARRIAGES - roadHalf) / 2;
      this.group.add(group);
      this.carriages.push({
        mesh: group,
        offset: (i * LOOP) / 4 + random() * 30,
        speed: 2.2 + random() * 0.8,
        legs,
      });
    }
  }

  /**
   * Bethesda Terrace, once a lap on the right: a stone plaza and its fountain, a basin, two tiers
   * and the bronze Angel of the Waters on top, with the arcade's balustrade behind.
   */
  private addTerrace(): void {
    const t = new Group();
    const stone = this.material({ map: this.repeat(graniteTexture(), 4, 4), color: 0xd9cdb4 });
    const bronze = this.material({ color: 0x4f6b5a, metalness: 0.7, roughness: 0.4 });
    const pool = this.material({ color: 0x86a9bd, roughness: 0.05, metalness: 0.2 });
    const plaza = new Mesh(this.unit, stone);
    plaza.scale.set(30, 0.2, 40);
    plaza.position.set(TERRACE_X - 8, 0.1, 0);
    plaza.receiveShadow = true;
    const basin = new CylinderGeometry(7, 7.3, 0.7, 40);
    const water = new CylinderGeometry(6.6, 6.6, 0.1, 40);
    const shaft = new CylinderGeometry(0.6, 1.0, 2.6, 16);
    const lower = new CylinderGeometry(2.6, 1.2, 0.4, 24);
    const upper = new CylinderGeometry(1.4, 0.6, 0.3, 20);
    const angel = angelGeometry();
    this.disposables.push(basin, water, shaft, lower, upper, angel);
    const part = (geometry: BufferGeometry, m: Material, y: number) => {
      const mesh = new Mesh(geometry, m);
      mesh.position.set(TERRACE_X, y, 0);
      mesh.castShadow = true;
      t.add(mesh);
    };
    t.add(plaza);
    part(basin, stone, 0.55);
    part(water, pool, 0.88);
    part(shaft, stone, 2.1);
    part(lower, stone, 2.2);
    part(upper, bronze, 3.6);
    part(angel, bronze, 3.75);
    const balustrade = new Mesh(this.unit, stone);
    balustrade.scale.set(0.5, 1.1, 38);
    balustrade.position.set(TERRACE_X + 9, 0.75, 0);
    t.add(balustrade);
    this.group.add(t);
    this.props.push({ mesh: t, offset: TERRACE_AT, x: 0 });
  }

  /** Midtown over the trees: the slender towers of Billionaires' Row and the blocks below them. */
  private addSkyline(): void {
    const haze = new Color(HAZE);
    const glass = this.track(towerTexture());
    glass.wrapS = RepeatWrapping;
    glass.wrapT = RepeatWrapping;
    const random = seeded(43);
    const shades = [0xb9c4cc, 0xd4cfc4, 0x9fb0bd, 0xe0d8c8].map((hex) => {
      const m = new MeshStandardMaterial({ map: glass, fog: false, roughness: 0.5 });
      m.color.set(hex).lerp(haze, 0.62);
      this.disposables.push(m);
      return m;
    });
    for (let i = 0; i < 60; i++) {
      const slender = i < 7;
      const w = slender ? 18 + random() * 10 : 30 + random() * 40;
      const h = slender ? 300 + random() * 170 : 60 + random() * 140;
      const tower = new Mesh(this.unit, shades[i % shades.length]!);
      tower.scale.set(w, h, w);
      tower.position.set(-700 + random() * 1400, h / 2, -random() * 200);
      this.skyline.add(tower);
    }
    // Fifth Avenue's apartment houses, across the Reservoir on the left.
    for (let i = 0; i < 18; i++) {
      const h = 50 + random() * 60;
      const block = new Mesh(this.unit, shades[(i + 1) % shades.length]!);
      block.scale.set(40, h, 30);
      block.position.set(-560 - random() * 60, h / 2, 400 + i * 70);
      this.skyline.add(block);
    }
    this.group.add(this.skyline);
  }

  private material(options: ConstructorParameters<typeof MeshStandardMaterial>[0]) {
    const material = new MeshStandardMaterial(options);
    this.disposables.push(material);
    return material;
  }

  private repeat(texture: ReturnType<typeof canvasTexture>, x: number, y: number) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / x, 1 / y);
    return this.track(texture);
  }
}

/** An elm's grey trunk forking into four limbs that rise in a vase. */
function elmTrunk(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const trunk = new CylinderGeometry(0.28, 0.4, 4.5, 8);
  trunk.translate(0, 2.25, 0);
  parts.push(trunk);
  for (let k = 0; k < 4; k++) {
    const limb = new CylinderGeometry(0.12, 0.22, 5, 6);
    limb.translate(0, 2.5, 0);
    limb.rotateZ(0.45);
    limb.rotateY((k / 4) * Math.PI * 2 + 0.4);
    limb.translate(0, 4.3, 0);
    parts.push(limb);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** The elm's crown: a wide, arching canopy of leafy masses high on the limbs, reaching -x. */
function elmCrown(): BufferGeometry {
  const random = seeded(53);
  const parts: BufferGeometry[] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const reach = 3.2 + random() * 1.4;
    const blob = new IcosahedronGeometry(2.1 + random() * 0.9, 2);
    blob.scale(1, 0.7, 1);
    blob.translate(Math.cos(a) * reach - 1.2, 8.6 + random() * 1.6, Math.sin(a) * reach);
    parts.push(blob);
  }
  const top = new IcosahedronGeometry(3, 2);
  top.scale(1.2, 0.6, 1.2);
  top.translate(-1, 10.2, 0);
  parts.push(top);
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** The Angel of the Waters: a robed figure, wings spread, one arm raised in blessing. */
function angelGeometry(): BufferGeometry {
  const robe = new ConeGeometry(0.45, 1.5, 12);
  robe.translate(0, 0.75, 0);
  const torso = new CapsuleGeometry(0.2, 0.4, 4, 8);
  torso.translate(0, 1.7, 0);
  const head = new SphereGeometry(0.15, 10, 8);
  head.translate(0, 2.2, 0);
  const wings = [-1, 1].map((side) => {
    const wing = new ConeGeometry(0.35, 1.5, 4);
    wing.scale(0.4, 1, 1);
    wing.rotateZ(-side * 0.5);
    wing.translate(side * 0.55, 2.0, 0.15);
    return wing;
  });
  const arm = new CylinderGeometry(0.05, 0.05, 0.7, 6);
  arm.rotateZ(-0.9);
  arm.translate(0.4, 2.1, -0.1);
  const parts = [robe, torso, head, ...wings, arm];
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A painted lane of the drive: tarmac, its white edge line and its name stencilled along it. */
function laneTexture(base: string, word: string) {
  return canvasTexture(256, 1024, (g) => {
    speckle(g, 256, 1024, base, 59);
    g.fillStyle = '#ecece6';
    g.fillRect(0, 0, 10, 1024);
    g.save();
    g.translate(128, 520);
    // The lane is read from the rider's side: across runs outwards, along runs away.
    g.scale(-1, 3.2);
    g.font = 'bold 48px sans-serif';
    g.textAlign = 'center';
    g.fillText(word, 0, 0);
    g.restore();
  });
}

/** Mown lawn in the morning light. */
function lawnTexture() {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#4e8a3a';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(61);
    for (let i = 0; i < 9000; i++) {
      g.strokeStyle = `hsl(${92 + random() * 22},46%,${30 + random() * 22}%)`;
      const x = random() * 512;
      const y = random() * 512;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + random() * 4 - 2, y - 4 - random() * 5);
      g.stroke();
    }
  });
}

/** The Reservoir's running track: packed reddish cinders. */
function cinderTexture() {
  return canvasTexture(256, 256, (g) => speckle(g, 256, 256, '#9a6f5a', 67));
}

/** Grey granite blocks, the Reservoir's wall and the terrace's paving. */
function graniteTexture() {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#a8a39a', 71);
    g.strokeStyle = 'rgba(50,48,45,0.45)';
    g.lineWidth = 2;
    for (let y = 0; y <= 256; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
      for (let x = (y / 64) % 2 ? 0 : 64; x <= 256; x += 128) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 64);
        g.stroke();
      }
    }
  });
}

/** The Reservoir's iron fence: tall pickets between rails, cut out. */
function fenceTexture() {
  return canvasTexture(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 30, 512, 10);
    g.fillRect(0, 220, 512, 12);
    for (let x = 6; x < 512; x += 24) {
      g.fillRect(x, 10, 5, 246);
      g.beginPath();
      g.moveTo(x - 3, 12);
      g.lineTo(x + 2.5, 0);
      g.lineTo(x + 8, 12);
      g.fill();
    }
  });
}

/** The Reservoir's still water, the sky in long ripples. */
function reservoirTexture() {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#5d8aa8';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(73);
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = `rgba(255,255,255,${0.05 + random() * 0.18})`;
      g.fillRect(random() * 512, random() * 512, 10 + random() * 26, 1.5);
    }
  });
}

/** A park bench's green slats. */
function slatTexture() {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#1f3d2c';
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#2f5a40';
    for (let y = 2; y < 64; y += 10) g.fillRect(0, y, 64, 7);
  });
}

/** Towers' glazing and stone: bands of windows in the morning light. */
function towerTexture() {
  const texture = canvasTexture(128, 256, (g) => {
    g.fillStyle = '#e8e6e0';
    g.fillRect(0, 0, 128, 256);
    const random = seeded(79);
    for (let y = 0; y < 256; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        g.fillStyle = `hsl(210,15%,${35 + random() * 25}%)`;
        g.fillRect(x + 1, y + 1, 6, 5);
      }
    }
  });
  texture.repeat.set(3, 8);
  return texture;
}
