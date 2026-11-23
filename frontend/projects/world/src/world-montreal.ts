// Montreal Jazz Fest's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Rue
// Sainte-Catherine through the Quartier des Spectacles on a summer evening, closed to traffic for
// the festival. The riders take the street between crowds dancing on both sides; festoon lights
// swing overhead between the façades, banners hang from the lamp posts, food kiosks glow under
// their awnings, and once a lap the main stage rises on the left, its truss lit and its screen
// cycling colours over the band, with a smaller stage across the street between sets. Glass and
// old stone fronts wall it in. Built on the shared kit (world-kit.ts) on the pattern of Old
// Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
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

/** The street repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.12;
/** The crowds' pavements, and the fronts' line beyond them. */
const PAVEMENT = 7;
/** Festoons cross the street every STRING metres; the stages stand at MAIN and SIDE. */
const STRING = 14;
const MAIN = 140;
const SIDE = 290;
/** The bands play to a beat of BEAT seconds. */
const BEAT = 0.5;

const STAGE_COLOURS = [0xff2d78, 0x2dd4ff, 0xffb020, 0x9b5cff, 0x30ff9a];

const CROWD_WEAR = {
  tops: [
    '#ff6b5a',
    '#2ec4b6',
    '#ffffff',
    '#1d1f24',
    '#ffd23f',
    '#3a86ff',
    '#f15bb5',
    '#ff9f1c',
    '#9b5cff',
  ],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#e8c9a0', '#8a8f99'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#5a3a29', '#f5d3b5'],
};

interface Dancer {
  readonly offset: number;
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly phase: number;
  readonly lift: number;
}

export class MontrealStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly dancers: Dancer[] = [];
  private crowd: Figures | null = null;
  private readonly screens: MeshBasicMaterial[] = [];
  private readonly beams: { material: MeshBasicMaterial; phase: number }[] = [];
  private readonly bulbs: MeshBasicMaterial[] = [];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly colour = new Color();

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addPavements(roadHalf, points);
    this.addFronts(roadHalf);
    this.addFestoons(roadHalf);
    this.addBanners(roadHalf);
    this.addKiosks(roadHalf);
    this.addStage(roadHalf, MAIN, -1, 1);
    this.addStage(roadHalf, SIDE, 1, 0.6);
    this.addCrowd(roadHalf);
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The screens and the beams cycle through the show's colours; the bulbs shimmer.
    const step = Math.floor(seconds / (BEAT * 4));
    this.screens.forEach((screen, k) =>
      screen.color.setHex(STAGE_COLOURS[(step + k) % STAGE_COLOURS.length]!),
    );
    for (const beam of this.beams) {
      const k = Math.floor(seconds / BEAT + beam.phase) % STAGE_COLOURS.length;
      beam.material.color.setHex(STAGE_COLOURS[k]!);
      beam.material.opacity = 0.18 + 0.12 * Math.abs(Math.sin(seconds * 3 + beam.phase));
    }
    this.bulbs.forEach((bulb, k) =>
      bulb.color.copy(this.colour.setHSL(0.11, 1, 0.62 + 0.08 * Math.sin(seconds * 2 + k))),
    );
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(Math.max(metres, 0)), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      // Everyone bounces on the beat, each a little out of step.
      const beat = (this.time / BEAT) * Math.PI;
      this.dancers.forEach((d, i) => {
        const metres = loopMetres(d.offset, s, LOOP, BEHIND);
        const hop = Math.abs(Math.sin(beat + d.phase)) * d.lift;
        const sway = Math.sin(beat * 0.5 + d.phase) * 0.25;
        crowd.set(
          i,
          d.x,
          heightAt(Math.max(metres, 0)) + d.y + hop,
          -metres,
          d.heading + sway,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
  }

  /** The street's kerbs and the pavements where the crowds stand, both sides. */
  private addPavements(roadHalf: number, points: number): void {
    const r = roadHalf;
    const granite = this.material({ map: this.repeat(pavingTexture(), 2, 2), roughness: 0.8 });
    this.ribbons.add(points, granite, [
      [-r, 0.004],
      [-r - 0.05, KERB],
      [-r - PAVEMENT, KERB],
    ]);
    this.ribbons.add(points, granite, [
      [r + PAVEMENT, KERB],
      [r + 0.05, KERB],
      [r, 0.004],
    ]);
  }

  /** The fronts: Place des Arts' glass, and old stone with lit windows, side by side. */
  private addFronts(roadHalf: number): void {
    const random = seeded(1101);
    const kinds = [
      frontTexture('#3a4656', '#ffd8a0', 1103, true),
      frontTexture('#8a7a68', '#ffcf8a', 1109, false),
      frontTexture('#5a4a40', '#ffe0b0', 1117, false),
      frontTexture('#2a3038', '#9ad8ff', 1123, true),
    ];
    kinds.forEach((t) => {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      this.track(t);
    });
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP;) {
        const width = 18 + random() * 22;
        const height = 14 + random() * 40;
        const map = kinds[Math.floor(random() * kinds.length)]!.clone();
        map.repeat.set(width / 5, height / 5);
        map.needsUpdate = true;
        this.track(map);
        const front = this.material({
          map,
          emissiveMap: map,
          emissive: 0xffffff,
          emissiveIntensity: 0.35,
          roughness: 0.6,
        });
        const building = new Group();
        const body = new Mesh(this.unit, front);
        body.scale.set(20, height, width - 0.4);
        body.position.set(side * 10, height / 2, -width / 2);
        building.add(body);
        this.group.add(building);
        this.props.push({ mesh: building, offset, x: side * (roadHalf + PAVEMENT) });
        offset += width;
      }
    }
  }

  /** Festoons of warm bulbs strung across the street between the fronts, sagging in the middle. */
  private addFestoons(roadHalf: number): void {
    const span = roadHalf + PAVEMENT;
    const bulb = new SphereGeometry(0.09, 6, 4);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      const x = -span + u * span * 2;
      const sag = 1.8 * Math.sin(Math.PI * u);
      const b = bulb.clone();
      b.translate(x, 9 - sag, 0);
      parts.push(b);
    }
    const string = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    bulb.dispose();
    this.disposables.push(string);
    for (let offset = 6, k = 0; offset < LOOP; offset += STRING, k++) {
      const material = new MeshBasicMaterial({ color: 0xffd08a });
      this.disposables.push(material);
      if (k < 6) this.bulbs.push(material);
      const festoon = new Group();
      festoon.add(new Mesh(string, k < 6 ? material : this.bulbs[k % 6]!));
      this.group.add(festoon);
      this.props.push({ mesh: festoon, offset, x: 0 });
    }
  }

  /** Lamp posts along both kerbs, each hung with the festival's banner. */
  private addBanners(roadHalf: number): void {
    const steel = this.material({ color: 0x2a2e34, metalness: 0.6, roughness: 0.4 });
    const banners = ['#ff2d78', '#1d1f24', '#ffb020'].map((c, k) =>
      this.material({ map: this.track(bannerTexture(c, k)), roughness: 0.7, side: 2 }),
    );
    const pole = new CylinderGeometry(0.07, 0.1, 7, 8);
    pole.translate(0, 3.5, 0);
    const cloth = new PlaneGeometry(0.9, 2.4);
    cloth.translate(0, 5, 0);
    this.disposables.push(pole, cloth);
    for (let offset = 3, k = 0; offset < LOOP; offset += 22, k++) {
      for (const side of [-1, 1] as const) {
        const post = new Group();
        const flag = new Mesh(cloth, banners[(k + (side > 0 ? 1 : 0)) % 3]!);
        // Hung across the post so it reads from up and down the street.
        flag.position.x = -side * 0.5;
        post.add(new Mesh(pole, steel), flag);
        this.group.add(post);
        this.props.push({ mesh: post, offset, x: side * (roadHalf + 0.5) });
      }
    }
  }

  /** Food kiosks with striped awnings and glowing counters at the back of the pavements. */
  private addKiosks(roadHalf: number): void {
    const random = seeded(1129);
    const wood = this.material({ color: 0x5a3a28, roughness: 0.8 });
    const counter = this.material({ color: 0xffd8a0, emissive: 0xffb050, emissiveIntensity: 0.6 });
    const awnings = ['#ff2d78', '#2dd4ff', '#ffb020', '#30ff9a'].map((c) =>
      this.material({ map: this.track(awningTexture(c)), roughness: 0.7 }),
    );
    for (let offset = 20; offset < LOOP; offset += 30 + random() * 25) {
      if (Math.abs(offset - MAIN) < 30 || Math.abs(offset - SIDE) < 20) continue;
      const side = random() < 0.5 ? -1 : 1;
      const kiosk = new Group();
      const body = new Mesh(this.unit, wood);
      body.scale.set(2.2, 2.4, 3);
      body.position.y = 1.2;
      const glow = new Mesh(this.unit, counter);
      glow.scale.set(0.1, 1, 2.6);
      glow.position.set(-side * 1.12, 1.4, 0);
      const awning = new Mesh(this.unit, awnings[Math.floor(random() * 4)]!);
      awning.scale.set(3, 0.1, 3.4);
      awning.position.set(-side * 0.5, 2.8, 0);
      awning.rotation.z = side * 0.25;
      kiosk.add(body, glow, awning);
      this.group.add(kiosk);
      this.props.push({ mesh: kiosk, offset, x: side * (roadHalf + PAVEMENT - 1.4) });
    }
  }

  /**
   * A stage on the given side, facing the street: its deck, a black truss over it with its
   * lamps throwing coloured beams, a screen cycling colours behind the band, and speaker stacks.
   */
  private addStage(roadHalf: number, offset: number, side: -1 | 1, size: number): void {
    const black = this.material({ color: 0x15161a, roughness: 0.7 });
    const truss = this.material({ color: 0x8a8f99, metalness: 0.8, roughness: 0.3 });
    const screenMaterial = new MeshBasicMaterial({ color: STAGE_COLOURS[0]! });
    this.disposables.push(screenMaterial);
    this.screens.push(screenMaterial);
    const stage = new Group();
    const w = 16 * size;
    const deck = new Mesh(this.unit, black);
    deck.scale.set(8 * size, 1.4, w);
    deck.position.set(side * 4 * size, 0.7, 0);
    stage.add(deck);
    // The truss: two towers and a top span, facing the street.
    for (const z of [-w / 2, w / 2]) {
      const tower = new Mesh(this.unit, truss);
      tower.scale.set(0.5, 10 * size, 0.5);
      tower.position.set(side * 0.6, 5 * size, z);
      stage.add(tower);
    }
    const span = new Mesh(this.unit, truss);
    span.scale.set(0.6, 0.6, w + 0.5);
    span.position.set(side * 0.6, 10 * size, 0);
    const back = new Mesh(this.unit, black);
    back.scale.set(0.4, 10 * size, w);
    back.position.set(side * 8 * size, 5 * size, 0);
    const screen = new Mesh(new PlaneGeometry(w * 0.6, 4.5 * size), screenMaterial);
    this.disposables.push(screen.geometry);
    screen.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    screen.position.set(side * (8 * size - 0.25), 6.5 * size, 0);
    stage.add(span, back, screen);
    // Lamps along the span, each throwing a translucent beam down onto the band.
    const beam = new CylinderGeometry(0.15, 1.4 * size, 8 * size, 10, 1, true);
    beam.translate(0, -4 * size, 0);
    this.disposables.push(beam);
    for (let k = 0; k < 6; k++) {
      const material = new MeshBasicMaterial({
        color: STAGE_COLOURS[k % 5]!,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        side: 2,
      });
      this.disposables.push(material);
      this.beams.push({ material, phase: k * 1.3 });
      const b = new Mesh(beam, material);
      b.position.set(side * 0.8, 10 * size, -w / 2 + ((k + 0.5) / 6) * w);
      b.rotation.z = side * (0.35 + (k % 2) * 0.15);
      stage.add(b);
    }
    // Speaker stacks at each end of the deck.
    for (const z of [-w / 2 - 1, w / 2 + 1]) {
      const stack = new Mesh(this.unit, black);
      stack.scale.set(1.6, 4 * size, 1.4);
      stack.position.set(side * 1.2, 2 * size, z);
      stage.add(stack);
    }
    stage.children.forEach((c) => (c.castShadow = true));
    this.group.add(stage);
    this.props.push({ mesh: stage, offset, x: side * (roadHalf + PAVEMENT + 1) });
  }

  /** The crowds: packed along both pavements, thickest before the stages, the bands on their decks. */
  private addCrowd(roadHalf: number): void {
    const random = seeded(1151);
    const add = (offset: number, x: number, heading: number, y = KERB, lift = 0.12) =>
      this.dancers.push({
        offset,
        x,
        y,
        heading,
        phase: random() * 6.3,
        lift: lift * (0.5 + random()),
      });
    for (let offset = 0; offset < LOOP; offset += 0.7 + random() * 1.2) {
      const nearStage = Math.abs(offset - MAIN) < 14 || Math.abs(offset - SIDE) < 9;
      for (const side of [-1, 1] as const) {
        if (random() < (nearStage ? 0.1 : 0.45)) continue;
        const depth = 0.6 + random() * (PAVEMENT - (nearStage ? 1.2 : 2.6));
        // Facing the street, or the stage across it.
        add(offset, side * (roadHalf + depth), side < 0 ? -Math.PI / 2 : Math.PI / 2);
      }
    }
    // The bands on the decks, facing the street.
    for (const [offset, side, size] of [
      [MAIN, -1, 1],
      [SIDE, 1, 0.6],
    ] as const) {
      for (let k = 0; k < 5; k++) {
        const z = (k - 2) * 2.4 * size;
        add(
          offset + z,
          side * (roadHalf + PAVEMENT + 1 + 4 * size),
          side < 0 ? -Math.PI / 2 : Math.PI / 2,
          1.4,
          0.06,
        );
      }
    }
    this.crowd = new Figures(this.group, this.disposables, this.dancers.length, CROWD_WEAR, 1153);
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

/** Grey granite paving, with the quarter's red dots set into it. */
function pavingTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#8a8a8e', 1163);
    g.fillStyle = 'rgba(30,30,30,0.35)';
    g.fillRect(0, 0, 128, 2);
    g.fillRect(0, 0, 2, 128);
    g.fillStyle = '#e0303a';
    g.beginPath();
    g.arc(64, 64, 9, 0, Math.PI * 2);
    g.fill();
  });
}

/** Ten metres of a front at dusk: its wall, and windows lit warm (or a curtain of glass). */
function frontTexture(wall: string, light: string, seed: number, glass: boolean): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, wall, seed);
    const random = seeded(seed + 1);
    if (glass) {
      for (let x = 0; x < 256; x += 32) {
        for (let y = 0; y < 256; y += 32) {
          g.fillStyle = random() < 0.4 ? light : 'rgba(40,60,80,0.8)';
          g.fillRect(x + 2, y + 2, 28, 28);
        }
      }
      return;
    }
    for (let y = 16; y < 256; y += 64) {
      for (let x = 14; x < 256; x += 60) {
        g.fillStyle = random() < 0.55 ? light : '#1d2228';
        g.fillRect(x, y, 32, 40);
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.fillRect(x + 15, y, 2, 40);
      }
    }
  });
}

/** A festival banner: the words and a saxophone's curve on a bold ground. */
function bannerTexture(ground: string, k: number): CanvasTexture {
  return canvasTexture(96, 256, (g) => {
    g.fillStyle = ground;
    g.fillRect(0, 0, 96, 256);
    g.strokeStyle = k === 1 ? '#ffb020' : '#ffffff';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(58, 40);
    g.lineTo(58, 130);
    g.quadraticCurveTo(58, 170, 34, 160);
    g.quadraticCurveTo(22, 150, 30, 130);
    g.stroke();
    g.fillStyle = '#ffffff';
    g.font = 'bold 26px sans-serif';
    g.textAlign = 'center';
    g.fillText('JAZZ', 48, 208);
    g.font = 'bold 13px sans-serif';
    g.fillText('MONTRÉAL', 48, 232);
  });
}

/** A kiosk's striped awning. */
function awningTexture(colour: string): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    for (let x = 0; x < 64; x += 8) {
      g.fillStyle = (x / 8) % 2 ? '#ffffff' : colour;
      g.fillRect(x, 0, 8, 64);
    }
  });
}
