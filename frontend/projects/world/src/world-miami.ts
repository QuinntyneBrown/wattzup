// Miami Neon Nights, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): Ocean Drive on
// a Miami night, the road wet from a passing shower that still drizzles. On the right a row of
// pastel art deco hotels in full detail (neon-traced crowns, blade and roof signs, balconies,
// lobbies, clubs and cafés) with Collins Avenue's towers behind; palms, lamps, festoons and a
// neon gateway over the boulevard; parked and passing cars and people on both sidewalks. On the
// left the promenade, the sea wall, the dune and the beach, and the moonlit Atlantic with its
// ships, pier and causeway; ahead, across the bay, the skyline under a sky of moon, cloud,
// searchlights and fireworks. The hotels and their names are invented. Built on the shared kit
// (world-kit.ts) on the pattern of Old Town's street; docs/screenshots/miami records each step.
import type { BufferGeometry } from 'three/webgpu';
import {
  AdditiveBlending,
  BufferAttribute,
  BoxGeometry,
  Color,
  ConeGeometry,
  DoubleSide,
  type CanvasTexture,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  TorusGeometry,
  type Texture,
  Vector3,
} from 'three/webgpu';
import {
  BoxBuilder,
  canvasTexture,
  Figures,
  haloTexture,
  LifeguardTowers,
  loopMetres,
  paintTexture,
  Palms,
  Ribbons,
  Yachts,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { StreetPoint } from './world-oldtown';

/** The boulevard repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
/** The sea lies SEA metres below the road, from BEACH metres beyond the verge. */
const SEA = 1.4;
const BEACH = 26;
/** The hotels stand back FRONT metres from the road's edge. */
const FRONT = 9;
/** Side streets cross the boulevard on the right at these offsets, each STREET metres wide. */
const CROSSINGS = [118, 286] as const;
const STREET = 12;
/** How many raindrop rings spread on the road at once. */
const RIPPLES = 90;
/** Fireworks: how many bursts are in the air at once, and the sparks in each. */
const BURSTS = 3;
const SPARKS = 70;

/** Whether `offset` falls within a side street, give or take `margin` metres. */
function inCrossing(offset: number, margin = 0): boolean {
  const o = ((offset % LOOP) + LOOP) % LOOP;
  return CROSSINGS.some((c) => Math.abs(o - c) < STREET / 2 + margin);
}

/** The neon colours, each a tube's colour and how hard it glows. */
const NEON = [0xff3fb4, 0x2fe6ff, 0xb46bff, 0x5aff8a, 0xffd23f, 0xff6a3f] as const;
const PASTELS = [0xf4b8c8, 0xa8e0dc, 0xf8e0a8, 0xc8b8ec, 0xb8e4b0, 0xf6c8a4] as const;
/** Trim colours painted over the pastel stucco, one per hotel. */
const ACCENTS = ['#2ab8b0', '#ff6f8f', '#7a6ad8', '#f4a040', '#3aa0e0', '#e05aa0'] as const;
const NAMES = ['AZURE', 'FLAMINGO', 'CORAL MOON', 'PALMETTO', 'SEABREEZE', 'STARLITE'] as const;

const NIGHT_WEAR = {
  tops: ['#ff4fa8', '#2fd3cf', '#f4f0e8', '#1d1f24', '#ffb23f', '#9a6bff', '#e8e8e8'],
  bottoms: ['#1d1f24', '#2a3a5a', '#f4f0e8', '#3a2a2a'],
  skins: ['#f1c9a5', '#c48a5f', '#8d5a3b', '#5a3a2a', '#e0b08a'],
};

const SKATE_WEAR = {
  tops: ['#ff3fb4', '#2fe6ff', '#5aff8a', '#ffd23f', '#f4f0e8'],
  bottoms: ['#1d1f24', '#ff3fb4', '#2fe6ff', '#f4f0e8'],
  skins: ['#f1c9a5', '#c48a5f', '#8d5a3b', '#5a3a2a'],
};

export class MiamiStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly traffic: { mesh: Group; offset: number; speed: number }[] = [];
  private trafficX = 0;
  /** The drivers and passengers in the open cars cruising the far lane. */
  private occupants: Figures | null = null;
  private roadWidth = 0;
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private chatting: Figures | null = null;
  private skating: Figures | null = null;
  private arms: InstancedMesh | null = null;
  private dogs: InstancedMesh | null = null;
  private dogWalkers: number[] = [];
  private hair: InstancedMesh | null = null;
  private readonly limb = new Matrix4();
  private readonly limbTurn = new Matrix4();
  private readonly limbScale = new Vector3();
  private readonly limbSpot = new Vector3();
  private readonly up = new Vector3(0, 1, 0);
  private readonly skaters: { offset: number; x: number; speed: number; phase: number }[] = [];
  private readonly standers: {
    offset: number;
    x: number;
    heading: number;
    phase: number;
    scale: number;
    /** How far a seated figure sinks so it sits on its chair, its legs under the table. */
    seat?: number;
    /** Whether the figure is dancing, arms up, bouncing on the beat. */
    dance?: boolean;
  }[] = [];
  private readonly diners: { offset: number; x: number; heading: number }[] = [];
  private readonly balconyGuests: { offset: number; x: number; y: number }[] = [];
  private water: Texture | null = null;
  private glitter: Texture | null = null;
  private stream: Texture | null = null;
  private chase: Texture | null = null;
  private mist: Texture | null = null;
  private readonly signs: MeshStandardMaterial[] = [];
  private readonly beacons: Mesh[] = [];
  private readonly foam: MeshBasicMaterial[] = [];
  private readonly searchlights: Mesh[] = [];
  private readonly vents: Mesh[][] = [];
  private plane: Group | null = null;
  private blimp: Group | null = null;
  private moonCloud: Mesh | null = null;
  private meteor: Mesh | null = null;
  private readonly clockHands: { pivot: Group; minute: boolean }[] = [];
  private starMaterial: MeshBasicMaterial | null = null;
  private readonly planeLights: Mesh[] = [];
  private readonly hazards: Mesh[] = [];
  private readonly flames: Mesh[] = [];
  private gateBulbs: Mesh[][] = [];
  private readonly cyclists: { mesh: Group; offset: number; speed: number; x: number }[] = [];
  private riders: Figures | null = null;
  /** The cruiser's red lamp, wash and flare, then its blue ones. */
  private patrol: Mesh[] = [];
  private storm: { flash: MeshBasicMaterial; bolt: MeshBasicMaterial } | null = null;
  private readonly lasers: Group[] = [];
  private sparks: InstancedMesh | null = null;
  private readonly sparkDirs: Vector3[] = [];
  private heli: { craft: Group; rotor: Mesh; lights: Mesh[] } | null = null;
  private readonly swaying: { palm: Group; phase: number; lean: number }[] = [];
  /** Where the nightclubs' doors are, in metres along the loop. */
  private readonly clubs: number[] = [];
  /** Where the vendors' carts stand on the promenade. */
  private readonly carts: number[] = [];
  private readonly drops: { x: number; y: number; z: number; speed: number }[] = [];
  private rain: InstancedMesh | null = null;
  private readonly drop = new Matrix4();
  private ripples: InstancedMesh | null = null;
  private readonly landed: { cycle: number; offset: number; x: number }[] = [];
  private readonly shade = new Color();
  /** The signals' red, amber and green lamps. */
  private readonly lights: MeshStandardMaterial[] = [];
  private readonly horizon = new Group();
  readonly backdrop = [this.horizon];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly flat = new PlaneGeometry(1, 1);
  private halo!: MeshBasicMaterial;

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.roadWidth = roadHalf * 2 - 0.6;
    this.disposables.push(this.unit, this.flat);
    this.halo = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(this.halo);
    this.addRoad(roadHalf, points);
    this.addHotels(roadHalf);
    this.addPalms(roadHalf);
    this.addLamps(roadHalf);
    this.addCars(roadHalf);
    this.addLifeguards(roadHalf);
    this.addCrossings(roadHalf);
    this.addPromenade(roadHalf);
    this.addKerbside(roadHalf);
    this.addDunes(roadHalf);
    this.addFestoons(roadHalf);
    this.addShelters(roadHalf);
    this.addGateway(roadHalf);
    this.addCollins(roadHalf);
    this.addSteam();
    this.addYachts(roadHalf);
    this.addBikeDocks(roadHalf);
    this.addPier(roadHalf);
    this.addCarts(roadHalf);
    this.addTaxis(roadHalf);
    this.addRoadPaint();
    this.addTikiBars(roadHalf);
    this.addPuddles(roadHalf);
    this.addScooters(roadHalf);
    this.addPatrol(roadHalf);
    this.addCyclists(roadHalf);
    this.addBeachParty(roadHalf);
    this.addLetters(roadHalf);
    this.addClock(roadHalf);
    this.addPeople(roadHalf);
    this.addBay();
    this.addDrizzle();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // Each line of surf swells as its wave breaks and fades as it runs out, 2.6 s apart.
    this.foam.forEach((m, k) => {
      const phase = (((seconds / 7.8 + k / 3) % 1) + 1) % 1;
      m.opacity = 0.15 + 0.65 * Math.sin(phase * Math.PI) ** 2;
    });
    // The signals cycle: green 14 s, amber 3 s, red 13 s.
    const cycle = seconds % 30;
    const lit = cycle < 14 ? 2 : cycle < 17 ? 1 : 0;
    this.lights.forEach((m, i) => (m.emissiveIntensity = i === lit ? 3.5 : 0.08));
    // The drizzle falls and slants, each drop wrapping back to the top of its 14 m column.
    const rain = this.rain;
    if (rain) {
      this.drops.forEach((d, i) => {
        const y = (((d.y - seconds * d.speed) % 14) + 14) % 14;
        this.drop.makeRotationZ(0.12);
        this.drop.setPosition(d.x + y * 0.12, y, d.z);
        rain.setMatrixAt(i, this.drop);
      });
      rain.instanceMatrix.needsUpdate = true;
    }
    // The palms sway in the sea breeze, gusting now and then.
    const gust = 0.6 + 0.4 * Math.sin(seconds * 0.23);
    for (const { palm, phase } of this.swaying) {
      palm.rotation.z = Math.sin(seconds * 0.9 + phase) * 0.018 * gust;
      palm.rotation.x = Math.cos(seconds * 0.7 + phase) * 0.012 * gust;
    }
    // The helicopter circles over the beach, 300 m ahead and 80 m up.
    if (this.heli) {
      const a = seconds * 0.08;
      this.heli.craft.position.set(-175 + Math.cos(a) * 60, 62, -430 + Math.sin(a) * 60);
      this.heli.craft.rotation.y = -a;
      this.heli.rotor.rotation.y = seconds * 25;
      const blink = seconds % 1.2 < 0.3;
      this.heli.lights.forEach((l) => (l.visible = blink));
    }
    // Each puff of steam rises 3.5 m over 3.5 s, swelling and drifting with the breeze.
    this.vents.forEach((puffs, v) =>
      puffs.forEach((m, i) => {
        const age = ((((seconds + v * 0.9) / 3.5 + i / puffs.length) % 1) + 1) % 1;
        const size = 0.8 + age * 2.6;
        m.scale.set(size, size, 1);
        m.position.set(age * 1.2 + Math.sin(i * 2.3) * 0.2, 0.3 + age * 3.5, 0);
        m.visible = age < 0.97;
      }),
    );
    // The banner plane flies along the shore, 200 m out and 70 m up, every two minutes.
    if (this.plane) {
      const along = ((seconds * 14 + 1250) % 1700) - 850;
      this.plane.position.set(-200, 70, -along);
      this.plane.rotation.y = Math.PI / 2;
      this.planeLights.forEach((l) => (l.visible = seconds % 1 < 0.5));
    }
    // Each burst lives 5 s, a burst every 1.7 s: it blooms to 60 m across, sags and fades.
    const sparks = this.sparks;
    if (sparks) {
      const palette = [0xff4fb8, 0x2fe6ff, 0xffd23f, 0x5aff8a, 0xb46bff];
      for (let b = 0; b < BURSTS; b++) {
        const life = seconds / 5 + b / BURSTS;
        const cycle = Math.floor(life);
        const age = life - cycle;
        const h = Math.sin(cycle * 91.7 + b * 13.1) * 43758.5453;
        const u = h - Math.floor(h);
        const cx = -500 + u * 1100;
        const cy = 220 + ((((h * 3.1) % 1) + 1) % 1) * 140;
        const spread = 75 * (1 - (1 - age) ** 3);
        this.shade
          .set(palette[cycle % palette.length]!)
          .multiplyScalar(Math.max(0, 1 - age) ** 1.5);
        for (let i = 0; i < SPARKS; i++) {
          const d = this.sparkDirs[i]!;
          this.drop.makeScale(1 - age * 0.6, 1 - age * 0.6, 1);
          this.drop.setPosition(
            cx + d.x * spread,
            cy + d.y * spread - age * age * 60,
            -1150 + d.z * spread,
          );
          sparks.setMatrixAt(b * SPARKS + i, this.drop);
          sparks.setColorAt(b * SPARKS + i, this.shade);
        }
      }
      sparks.instanceMatrix.needsUpdate = true;
      if (sparks.instanceColor) sparks.instanceColor.needsUpdate = true;
    }
    // The clubs' lasers sweep to a 124 bpm beat, the fan opening and closing.
    const beat = seconds * (124 / 60) * Math.PI;
    this.lasers.forEach((fan, k) => {
      fan.rotation.y = Math.sin(seconds * 0.6 + k) * 0.6;
      fan.rotation.x = Math.sin(beat / 4 + k) * 0.25;
      fan.children.forEach((b, i) => {
        // The last child is the glow at the lasers' source, which stays put.
        if (i < fan.children.length - 1)
          b.rotation.z = Math.PI / 2 + 0.2 + i * (0.08 + 0.05 * Math.sin(beat / 2));
      });
    });
    // The storm out to sea flashes every 11 s or so, a double flicker, with a bolt every third.
    if (this.storm) {
      const t = seconds % 11;
      const lit =
        (t > 3 && t < 3.12) || (t > 3.25 && t < 3.4) ? 1 : t > 3.4 && t < 3.9 ? (3.9 - t) * 1.2 : 0;
      this.storm.flash.opacity = lit * 0.9;
      this.storm.bolt.opacity = Math.floor(seconds / 11) % 3 === 0 && t > 3.25 && t < 3.4 ? 1 : 0;
    }
    // The cruiser's light bar: red and blue in turn, each a double flash.
    if (this.patrol.length) {
      const phase = (seconds * 2.2) % 2;
      const flick = phase % 1 < 0.18 || (phase % 1 > 0.3 && phase % 1 < 0.48);
      this.patrol.forEach((m, i) => (m.visible = flick && (i < 3 ? phase < 1 : phase >= 1)));
    }
    // The gateway's bulbs chase: two in three lit, the gap stepping along four times a second.
    const step = Math.floor(seconds * 4) % 3;
    this.gateBulbs.forEach((row, i) => row.forEach((b) => (b.visible = i !== step)));
    // The tiki torches' flames flicker, each on its own.
    this.flames.forEach((f, k) => {
      const flick = 0.8 + 0.3 * Math.sin(seconds * 13 + k * 1.7) * Math.sin(seconds * 7.3 + k);
      f.scale.set(1, flick, 1);
    });
    // The cabs' hazard lights blink.
    const blinking = seconds % 0.9 < 0.45;
    this.hazards.forEach((h) => (h.visible = blinking));
    // The stars shimmer through the haze, and every 23 s a shooting star falls in 0.8 s.
    if (this.starMaterial)
      this.starMaterial.opacity = 0.85 + Math.sin(seconds * 3.1) * Math.sin(seconds * 1.7) * 0.15;
    if (this.meteor) {
      const t = (seconds + 0.4) % 23;
      const m = this.meteor.material as MeshBasicMaterial;
      m.opacity = t < 0.8 ? Math.sin((t / 0.8) * Math.PI) : 0;
      const cycle = Math.floor((seconds + 0.4) / 23);
      this.meteor.position.set(-300 + (cycle % 4) * 260 + t * 160, 900 - t * 70, -2050);
    }
    // The street clock keeps the night's time from ten past eleven, a minute a second slowed
    // to real time: its hands turn clockwise as seen on each face.
    const minutes = 11 * 60 + 10 + seconds / 60;
    for (const { pivot, minute } of this.clockHands)
      pivot.rotation.z = -(
        (minute ? (minutes % 60) / 60 : ((minutes / 60) % 12) / 12) *
        Math.PI *
        2
      );
    // The silvered cloud drifts slowly across the moon and back.
    if (this.moonCloud) this.moonCloud.position.x = -880 + Math.sin(seconds * 0.02) * 90;
    // The blimp drifts slowly along the beach, 450 m ahead and 130 m up.
    if (this.blimp) {
      const drift = Math.sin(seconds * 0.01) * 120;
      this.blimp.position.set(-80 + drift, 130 + Math.sin(seconds * 0.2) * 2, -460);
      this.blimp.rotation.y = 0.15;
    }
    // The searchlights sweep slowly to and fro, out of step with each other.
    this.searchlights.forEach((m, k) => {
      m.rotation.z = Math.sin(seconds * 0.25 + k * 2.1) * 0.5;
      m.rotation.x = 0.3 + Math.cos(seconds * 0.19 + k) * 0.12;
    });
    // The aircraft beacons on the spires blink, a second apart.
    this.beacons.forEach((b, k) => (b.visible = (seconds + k * 0.37) % 1.6 < 0.9));
    if (this.water) this.water.offset.set(seconds * 0.004, seconds * 0.002);
    if (this.stream) this.stream.offset.x = seconds * 0.02;
    if (this.mist) this.mist.offset.x = seconds * 0.003;
    if (this.glitter) this.glitter.offset.set(Math.sin(seconds * 0.7) * 0.01, seconds * 0.05);
    // The blade signs pulse, each on its own beat, as neon on a timer does; every seventh sign
    // has a failing transformer and stutters, dropping out for a few frames now and then.
    this.signs.forEach((m, k) => {
      m.emissiveIntensity = 2.2 + Math.max(0, Math.sin(seconds * (0.9 + k * 0.23) + k)) * 1.2;
      if (k % 7 === 3) {
        const t = (seconds * 1.7 + k) % 6;
        if (t < 0.6 && Math.sin(seconds * 47 + k) > 0) m.emissiveIntensity = 0.15;
      }
    });
    // The bulbs step along the marquee, a bulb every eighth of a second.
    if (this.chase) this.chase.offset.x = Math.floor(seconds * 8) / 32;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the sea. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - SEA - 2);
      position.setY(i * 2 + 1, p.height - SEA - 2);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const riders = this.riders;
    this.cyclists.forEach((c, i) => {
      const metres = loopMetres(c.offset - c.speed * this.time, s, LOOP, BEHIND);
      const y = heightAt(metres);
      c.mesh.position.set(c.x, y + 0.02, -metres);
      riders?.set(i, c.x, y + 0.2, -metres + 0.15, Math.PI, 0.92);
    });
    riders?.commit();
    const occupants = this.occupants;
    this.traffic.forEach((car, c) => {
      const metres = loopMetres(car.offset - car.speed * this.time, s, LOOP, BEHIND);
      const y = heightAt(metres);
      car.mesh.position.set(this.trafficX, y, -metres);
      // The driver and a passenger sit up in each open car, heads above the windscreen.
      if (occupants && c < 5)
        [0.42, -0.42].forEach((side, i) =>
          occupants.set(c * 2 + i, this.trafficX - side, y - 0.38, -metres - 0.35, Math.PI, 0.9),
        );
    });
    occupants?.commit();
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const bob = Math.abs(Math.sin(this.time * 3 + p.phase)) * 0.04;
        const y = heightAt(metres) + 0.15 + bob;
        crowd.set(i, p.x, y, -metres, p.speed >= 0 ? 0 : Math.PI, 0.98, 0);
        this.dress(
          i,
          p.x,
          y,
          -metres,
          p.speed >= 0 ? 0 : Math.PI,
          0.98,
          Math.sin(this.time * 6 + p.phase) * 0.35,
        );
      });
      crowd.commit();
    }
    const dogs = this.dogs;
    if (dogs) {
      this.dogWalkers.forEach((w, i) => {
        const p = this.people[w]!;
        const metres =
          loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND) + (p.speed >= 0 ? 1.1 : -1.1);
        const trot = Math.abs(Math.sin(this.time * 9 + p.phase)) * 0.04;
        this.limb.makeRotationY(p.speed >= 0 ? 0 : Math.PI);
        this.limb.setPosition(p.x + 0.35, heightAt(metres) + 0.15 + trot, -metres);
        dogs.setMatrixAt(i, this.limb);
      });
      dogs.instanceMatrix.needsUpdate = true;
    }
    const skating = this.skating;
    if (skating) {
      this.skaters.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const stride = Math.sin(this.time * 2.6 + p.phase);
        const y = heightAt(metres) + 0.15;
        const turn = (p.speed >= 0 ? 0 : Math.PI) + stride * 0.3;
        skating.set(i, p.x + stride * 0.25, y, -metres, turn, 0.95);
        this.dress(
          this.people.length + i,
          p.x + stride * 0.25,
          y,
          -metres,
          turn,
          0.95,
          stride * 0.6,
        );
      });
      skating.commit();
    }
    const chatting = this.chatting;
    if (chatting) {
      this.standers.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        const sway = Math.sin(this.time * 1.3 + p.phase) * 0.12;
        // Dancers bounce on the beat with their arms thrown up and swaying.
        const bounce = p.dance ? Math.abs(Math.sin(this.time * 6.5 + p.phase)) * 0.12 : 0;
        const y = heightAt(metres) + 0.15 - (p.seat ?? 0) + bounce;
        const turn = p.heading + (p.dance ? sway * 3 : sway * (p.seat ? 0.3 : 1));
        chatting.set(i, p.x, y, -metres, turn, p.scale);
        this.dress(
          this.people.length + this.skaters.length + i,
          p.x,
          y,
          -metres,
          turn,
          p.scale,
          p.dance ? Math.PI * 0.85 + sway : sway,
        );
      });
      chatting.commit();
    }
    if (this.arms && this.hair) {
      this.arms.instanceMatrix.needsUpdate = true;
      this.hair.instanceMatrix.needsUpdate = true;
    }
    this.horizon.position.set(0, heightAt(0), 0);
    // Each ripple lives 0.8 s: it lands somewhere new on the road ahead, spreads and fades, and
    // stays where it landed as the rider rolls over it.
    const ripples = this.ripples;
    if (ripples) {
      for (let i = 0; i < RIPPLES; i++) {
        const life = this.time / 0.8 + i / RIPPLES;
        const cycle = Math.floor(life);
        const age = life - cycle;
        const spot = (this.landed[i] ??= { cycle: -1, offset: 0, x: 0 });
        if (spot.cycle !== cycle) {
          const h = Math.sin(i * 12.9898 + cycle * 78.233) * 43758.5453;
          const u = h - Math.floor(h);
          const v = (h * 7.13) % 1;
          spot.cycle = cycle;
          spot.offset = s + 2 + u * 30;
          spot.x = (Math.abs(v) - 0.5) * this.roadWidth;
        }
        const metres = spot.offset - s;
        const size = 0.08 + age * 0.5;
        this.drop.makeScale(size, 1, size);
        this.drop.setPosition(spot.x, heightAt(metres) + 0.03, -metres);
        ripples.setMatrixAt(i, this.drop);
        ripples.setColorAt(i, this.shade.setScalar(0.7 * (1 - age)));
      }
      ripples.instanceMatrix.needsUpdate = true;
      if (ripples.instanceColor) ripples.instanceColor.needsUpdate = true;
    }
  }

  /**
   * The wet asphalt, the sidewalk and hotel forecourts on the right, and on the left the
   * promenade, the sand falling to the sea and the water itself.
   */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const asphalt = this.material({
      map: this.repeat(roadTexture(), r * 2, 16),
      roughness: 0.25,
      metalness: 0.2,
    });
    const paving = this.material({
      map: this.repeat(pavingTexture(), 2.4, 2.4),
      roughness: 0.28,
      metalness: 0.12,
    });
    const promenade = this.material({
      map: this.repeat(promenadeTexture(), 4.75, 6),
      roughness: 0.3,
      metalness: 0.1,
    });
    const sand = this.material({ map: this.repeat(sandTexture(), 6, 6), roughness: 1 });
    const kerb = this.material({ color: 0xd8d4cc, roughness: 0.6 });
    this.ribbons.add(points, asphalt, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    // A green-painted bike lane along the promenade side, a white bicycle on it every 20 m.
    const lane = this.material({
      map: this.repeat(bikeLaneTexture(), 1.3, 20),
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.ribbons.add(points, lane, [
      [-r + 1.6, 0.016],
      [-r + 0.28, 0.016],
    ]);
    this.ribbons.add(points, kerb, [
      [r + 0.25, 0.15],
      [r, 0.15],
      [r, 0.01],
    ]);
    this.ribbons.add(points, paving, [
      [r + FRONT + 40, 0.16],
      [r + 0.25, 0.15],
    ]);
    this.ribbons.add(points, kerb, [
      [-r, 0.01],
      [-r, 0.15],
      [-r - 0.25, 0.15],
    ]);
    this.ribbons.add(points, promenade, [
      [-r - 0.25, 0.15],
      [-r - 5, 0.15],
    ]);
    // The low sea wall: pastel stucco panels between pilasters under a pale stone coping that
    // overhangs on the promenade side, with a strip of pink neon tucked under its lip.
    const wall = this.material({ map: this.repeat(seaWallTexture(), 0.6, 4), roughness: 0.8 });
    const coping = this.material({ color: 0xe8e2dc, roughness: 0.5 });
    const strip = this.material({ color: 0xff4fb8, emissive: 0xff4fb8, emissiveIntensity: 2.6 });
    this.ribbons.add(points, wall, [
      [-r - 5, 0.15],
      [-r - 5, 0.72],
    ]);
    this.ribbons.add(points, strip, [
      [-r - 4.94, 0.66],
      [-r - 4.94, 0.72],
    ]);
    this.ribbons.add(points, coping, [
      [-r - 4.86, 0.72],
      [-r - 4.86, 0.84],
      [-r - 5.64, 0.84],
      [-r - 5.64, 0.72],
      [-r - 5.5, 0.72],
      [-r - 5.5, -0.3],
    ]);
    this.ribbons.add(points, sand, [
      [-r - 5.5, -0.3],
      [-r - BEACH, -SEA + 0.1],
      [-r - BEACH - 4, -SEA - 0.4],
    ]);
    const water = this.track(seaTexture());
    water.wrapS = RepeatWrapping;
    water.wrapT = RepeatWrapping;
    water.repeat.set(1 / 16, 1 / 16);
    this.water = water;
    const sea = this.material({
      map: water,
      color: 0x8a9ac8,
      roughness: 0.08,
      metalness: 0.4,
      emissive: 0x141a3a,
      emissiveIntensity: 0.6,
    });
    this.ribbons.add(points, sea, [
      [-r - BEACH - 2, -SEA],
      [-r - 600, -SEA],
    ]);
    // The surf: three lines of foam rolling in, one after another, the nearest washing up
    // the wet sand; each brightens as its wave breaks and fades as it sinks back.
    const foamMap = this.track(foamTexture());
    foamMap.wrapS = RepeatWrapping;
    foamMap.wrapT = RepeatWrapping;
    foamMap.repeat.set(1 / 3, 1 / 24);
    for (const [near, far] of [
      [-r - BEACH - 1.2, -r - BEACH - 4],
      [-r - BEACH - 6, -r - BEACH - 8.5],
      [-r - BEACH - 13, -r - BEACH - 15],
    ] as const) {
      const foam = new MeshBasicMaterial({
        map: foamMap,
        color: 0xd8e0ff,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      this.disposables.push(foam);
      this.foam.push(foam);
      const mesh = this.ribbons.add(points, foam, [
        [near, -SEA + 0.03],
        [far, -SEA + 0.03],
      ]);
      mesh.renderOrder = 1;
      mesh.receiveShadow = false;
    }
  }

  /** The deco hotels, their neon-traced ledges and rooflines, and a blade sign on each. */
  private addHotels(roadHalf: number): void {
    const random = seeded(8101);
    const tube = new CylinderGeometry(0.07, 0.07, 1, 6);
    this.disposables.push(tube);
    const neon = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.6, roughness: 0.4 }),
    );
    const streaks = this.track(reflectionTexture());
    const reflections = NEON.map(
      (c) =>
        new MeshBasicMaterial({
          map: streaks,
          color: c,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
    );
    this.disposables.push(...reflections);
    const lobbies = [0, 1, 2, 3].map((v) =>
      this.material({
        map: this.track(lobbyTexture(8231 + v)),
        emissive: 0xffffff,
        emissiveMap: this.track(lobbyTexture(8231 + v)),
        emissiveIntensity: 0.9,
        roughness: 0.15,
        metalness: 0.3,
      }),
    );
    // The clubs' dance floors seen through their glass, and cocktail bars on some ground floors.
    const clubFloor = this.material({
      map: this.track(clubFloorTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(clubFloorTexture()),
      emissiveIntensity: 1.3,
      roughness: 0.15,
      metalness: 0.3,
    });
    const barFloor = this.material({
      map: this.track(cocktailBarTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(cocktailBarTexture()),
      emissiveIntensity: 1.1,
      roughness: 0.15,
      metalness: 0.3,
    });
    // The marquee bulbs chase round the fascia: the lit pattern slides along it.
    const chase = this.track(bulbTexture());
    chase.wrapS = RepeatWrapping;
    this.chase = chase;
    const bulbs = this.material({
      map: chase,
      emissive: 0xffffff,
      emissiveMap: chase,
      emissiveIntensity: 3,
    });
    const tableTop = this.material({ color: 0xf4f0ec, roughness: 0.3 });
    const metal = this.material({ color: 0x2a2a30, roughness: 0.4, metalness: 0.7 });
    const chair = this.material({ color: 0xf4f0ec, roughness: 0.6 });
    const umbrella = new ConeGeometry(1.5, 0.6, 8, 1, true);
    umbrella.translate(0, 0.3, 0);
    this.disposables.push(umbrella);
    const shades = [0xf4f0e8, 0xff6fb4, 0x3fd8d0, 0xfff0b0].map((c) =>
      this.material({
        color: c,
        roughness: 0.8,
        side: DoubleSide,
        emissive: c,
        emissiveIntensity: 0.12,
      }),
    );
    const candle = this.material({ color: 0xffd080, emissive: 0xffb050, emissiveIntensity: 4 });
    const candleGlow = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(candleGlow);
    const corner = new CylinderGeometry(3.4, 3.4, 1, 28);
    const ring = new CylinderGeometry(3.48, 3.48, 0.14, 28, 1, true);
    const capGeometry = new CylinderGeometry(2.2, 3.4, 0.6, 28);
    this.disposables.push(corner, ring, capGeometry);
    const plant = this.material({ color: 0x8a8890, roughness: 0.8, metalness: 0.3 });
    const plantDish = this.material({ color: 0xd0d0d8, roughness: 0.5, side: DoubleSide });
    const timber = this.material({ color: 0x5a4a3a, roughness: 0.9 });
    const warning = this.material({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 4 });
    const drum = new CylinderGeometry(1.4, 1.4, 2.6, 14);
    const saucer = new SphereGeometry(0.7, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3);
    this.disposables.push(drum, saucer);
    const soft = this.track(auraTexture());
    const auras = NEON.map((c) => {
      const m = new MeshBasicMaterial({
        map: soft,
        color: c,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      this.disposables.push(m);
      return m;
    });
    const blocks = this.material({
      map: this.track(glassBlockTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(glassBlockTexture()),
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const icons = (['flamingo', 'palm', 'cocktail', 'moon'] as const).map((kind) => {
      const m = this.material({
        map: this.track(iconTexture(kind)),
        emissive: 0xffffff,
        emissiveMap: this.track(iconTexture(kind)),
        emissiveIntensity: 2.4,
        transparent: true,
        depthWrite: false,
      });
      this.signs.push(m);
      return m;
    });
    const roofNames = NAMES.map((name, i) => {
      const colour = `#${NEON[i % NEON.length]!.toString(16).padStart(6, '0')}`;
      const m = this.material({
        map: this.track(roofNameTexture(name, colour)),
        emissive: 0xffffff,
        emissiveMap: this.track(roofNameTexture(name, colour)),
        emissiveIntensity: 2.4,
        transparent: true,
        depthWrite: false,
      });
      this.signs.push(m);
      return m;
    });
    const chalkboards = [
      ['HAPPY', 'HOUR', '2 x 1'],
      ['MOJITOS', '$9', 'LIVE DJ'],
      ['CUBAN', 'COFFEE', 'TAPAS'],
      ['OCEAN', 'VIEW', 'TABLES'],
    ].map((lines) =>
      this.material({
        map: this.track(chalkboardTexture(lines)),
        roughness: 0.9,
        side: DoubleSide,
      }),
    );
    const flamingoParts: BufferGeometry[] = [];
    const bodyPart = new SphereGeometry(0.16, 10, 8);
    bodyPart.scale(1.5, 0.9, 0.9);
    bodyPart.translate(0, 0.62, 0);
    const neck = new CylinderGeometry(0.025, 0.03, 0.42, 6);
    neck.rotateZ(-0.35);
    neck.translate(0.24, 0.86, 0);
    const head = new SphereGeometry(0.06, 8, 6);
    head.translate(0.32, 1.06, 0);
    const beak = new ConeGeometry(0.025, 0.12, 6);
    beak.rotateZ(Math.PI * 0.6);
    beak.translate(0.4, 1.02, 0);
    flamingoParts.push(bodyPart, neck, head, beak);
    for (const dz of [-0.04, 0.04]) {
      const leg = new CylinderGeometry(0.012, 0.012, 0.6, 4);
      leg.translate(0, 0.3, dz);
      flamingoParts.push(leg);
    }
    const flamingoGeometry = mergeGeometries(flamingoParts)!;
    flamingoParts.forEach((g) => g.dispose());
    this.disposables.push(flamingoGeometry);
    const flamingoPink = this.material({
      color: 0xff6ab0,
      roughness: 0.35,
      emissive: 0x401028,
      emissiveIntensity: 0.5,
    });
    const murals = [0, 1, 2].map((v) =>
      this.material({
        map: this.track(muralTexture(8571 + v)),
        roughness: 0.8,
        emissive: 0xffffff,
        emissiveMap: this.track(muralTexture(8571 + v)),
        emissiveIntensity: 0.25,
      }),
    );
    const planter = this.material({ color: 0xe8e0d8, roughness: 0.8 });
    const blossomBall = new SphereGeometry(0.7, 10, 8);
    this.disposables.push(blossomBall);
    const blossom = this.material({
      map: this.track(blossomTexture()),
      roughness: 0.9,
      emissive: 0x401030,
      emissiveIntensity: 0.4,
    });
    const foliage = this.material({ color: 0x2a5a30, roughness: 0.9 });
    const laserGeometry = new BoxGeometry(0.07, 260, 0.07);
    laserGeometry.translate(0, 130, 0);
    this.disposables.push(laserGeometry);
    const laser = new MeshBasicMaterial({
      color: 0x40ff70,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const laserGlow = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      color: 0x60ff90,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(laser, laserGlow);
    const brass = this.material({ color: 0xd8a848, roughness: 0.25, metalness: 0.9 });
    const velvet = this.material({ color: 0xa01030, roughness: 0.9 });
    const clubSign = this.material({
      map: this.track(clubTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(clubTexture()),
      emissiveIntensity: 2.4,
      transparent: true,
    });
    this.signs.push(clubSign);
    const trim = this.material({
      color: 0xf8f4f0,
      roughness: 0.6,
      emissive: 0x302838,
      emissiveIntensity: 0.5,
    });
    const slab = this.material({ color: 0xf4f0ec, roughness: 0.7 });
    const rail = this.material({ color: 0xf8f8f8, roughness: 0.3, metalness: 0.4 });
    const signBox = this.material({ color: 0x14121c, roughness: 0.5, metalness: 0.6 });
    const iron = this.material({ color: 0x202024, roughness: 0.6, metalness: 0.8 });
    const vacancies = ['VACANCY', 'NO VACANCY'].map((text) =>
      this.material({
        map: this.track(neonWordTexture(text, '#ff3048')),
        emissive: 0xffffff,
        emissiveMap: this.track(neonWordTexture(text, '#ff3048')),
        emissiveIntensity: 2.4,
        transparent: true,
      }),
    );
    const loops: BufferGeometry[] = [];
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      const swag = Math.abs(Math.sin(u * Math.PI * 6));
      const bulb = new SphereGeometry(0.06, 4, 3);
      bulb.scale(1, 1, 0.04);
      bulb.translate(0, 3.05 - (1 - swag) * 0.45, u - 0.5);
      loops.push(bulb);
    }
    const cafeString = mergeGeometries(loops)!;
    loops.forEach((g) => g.dispose());
    this.disposables.push(cafeString);
    const cafeBulb = new MeshBasicMaterial({ color: 0xffe8b0 });
    this.disposables.push(cafeBulb);
    let offset = 0;
    let k = 0;
    while (offset < LOOP - 10) {
      const width = 22 + random() * 14;
      const blocked = CROSSINGS.find(
        (c) => offset < c + STREET / 2 && offset + width > c - STREET / 2,
      );
      if (blocked !== undefined) {
        offset = blocked + STREET / 2 + 1;
        continue;
      }
      const storeys = 3 + Math.floor(random() * 4);
      const height = storeys * 3.6 + 1.6;
      const depth = 18;
      const glow = NEON[k % NEON.length]!;
      const hotel = new Group();
      const facade = this.material({
        map: this.track(facadeTexture(storeys, 8101 + k * 13, ACCENTS[k % ACCENTS.length]!)),
        color: PASTELS[k % PASTELS.length],
        roughness: 0.8,
        emissive: 0xffffff,
        emissiveMap: this.track(windowsTexture(storeys, 8101 + k * 13)),
        emissiveIntensity: 0.9,
      });
      const body = new Mesh(this.unit, facade);
      body.scale.set(depth, height, width);
      body.position.set(depth / 2, height / 2, 0);
      body.castShadow = true;
      hotel.add(body);
      // The deco crown at the centre of the roofline: a stepped ziggurat of three tiers, or a
      // tower of fins rising to a finial, each tier's edge traced in neon.
      const line0 = neon[k % neon.length]!;
      const tiers = k % 2 === 0 ? 3 : 2;
      let top = height;
      for (let t = 0; t < tiers; t++) {
        const w = width * (0.42 - t * 0.11);
        const h = 2 + (k % 2 === 0 ? 1.2 : 3.6);
        const tier = new Mesh(this.unit, facade);
        tier.scale.set(4.5 - t * 0.8, h, w);
        tier.position.set(2.25 + t * 0.4, top + h / 2, 0);
        tier.castShadow = true;
        hotel.add(tier);
        top += h;
        const edge = new Mesh(tube, line0);
        edge.rotation.x = Math.PI / 2;
        edge.scale.set(1, w, 1);
        edge.position.set(0.02 + t * 0.8, top, 0);
        hotel.add(edge);
        if (k % 2 === 1)
          for (const z of [-w / 2 + 0.3, 0, w / 2 - 0.3]) {
            const fin = new Mesh(this.unit, facade);
            fin.scale.set(0.5, h, 0.35);
            fin.position.set(0.05 + t * 0.4, top - h / 2, z);
            hotel.add(fin);
          }
      }
      const mast = new Mesh(tube, line0);
      mast.scale.set(1.4, 4.5, 1.4);
      mast.position.set(2.5, top + 2.25, 0);
      const finial = new Mesh(this.unit, line0);
      finial.scale.set(0.5, 0.5, 0.5);
      finial.rotation.set(0.6, 0.6, 0);
      finial.position.set(2.5, top + 4.7, 0);
      hotel.add(mast, finial);
      // Neon along the roofline, the crown and every eyebrow ledge, facing the street.
      const line = neon[k % neon.length]!;
      const run = (y: number, length: number, x = -0.05) => {
        const t = new Mesh(tube, line);
        t.rotation.x = Math.PI / 2;
        t.scale.set(1, length, 1);
        t.position.set(x, y, 0);
        hotel.add(t);
      };
      run(height, width);
      for (let f = 1; f < storeys; f++) {
        if (random() < 0.5) run(1.6 + f * 3.6, width * (0.6 + random() * 0.3));
        const ledge = new Mesh(this.unit, facade);
        ledge.scale.set(0.9, 0.18, width * 0.92);
        ledge.position.set(-0.4, 1.6 + f * 3.6, 0);
        hotel.add(ledge);
      }
      // The two upright tubes framing the entrance.
      for (const z of [-width * 0.18, width * 0.18]) {
        const t = new Mesh(tube, line);
        t.scale.set(1, height - 1, 1);
        t.position.set(-0.05, (height - 1) / 2 + 0.5, z);
        hotel.add(t);
      }
      // The blade sign standing out over the sidewalk, the hotel's name down it.
      const sign = this.material({
        map: this.track(signTexture(NAMES[k % NAMES.length]!, glow)),
        emissive: 0xffffff,
        emissiveMap: this.track(signTexture(NAMES[k % NAMES.length]!, glow)),
        emissiveIntensity: 2.6,
        roughness: 0.5,
      });
      this.signs.push(sign);
      // The blade is a dark sheet-metal box, its name on both faces, edged with a neon tube,
      // held off the wall on three iron brackets and crowned with a sunburst of neon rays.
      const tall = Math.min(height + 2, 15);
      const bladeZ = width * 0.3;
      const blade = new Mesh(this.unit, signBox);
      blade.scale.set(3.2, tall, 0.5);
      blade.position.set(-1.9, tall / 2 + 2.4, bladeZ);
      hotel.add(blade);
      for (const side of [-1, 1]) {
        const face = new Mesh(this.flat, sign);
        face.scale.set(3.1, tall - 0.1, 1);
        face.rotation.y = side > 0 ? 0 : Math.PI;
        face.position.set(-1.9, tall / 2 + 2.4, bladeZ + side * 0.26);
        hotel.add(face);
      }
      for (const [y, l] of [
        [2.4, 3.2],
        [2.4 + tall, 3.2],
      ] as const) {
        const t = new Mesh(tube, line);
        t.rotation.z = Math.PI / 2;
        t.scale.set(1.3, l, 1.3);
        t.position.set(-1.9, y, bladeZ);
        hotel.add(t);
      }
      // The neon's glow in the humid air: a soft halo of the sign's colour round both faces,
      // and a band of it along the roofline tube.
      const aura = auras[k % auras.length]!;
      for (const side of [-1, 1]) {
        const halo = new Mesh(this.flat, aura);
        halo.scale.set(7.5, tall + 5, 1);
        halo.rotation.y = side > 0 ? 0 : Math.PI;
        halo.position.set(-1.9, tall / 2 + 2.4, bladeZ + side * 0.3);
        hotel.add(halo);
      }
      const roofGlow = new Mesh(this.flat, aura);
      roofGlow.rotation.y = -Math.PI / 2;
      roofGlow.scale.set(width * 1.05, 3.2, 1);
      roofGlow.position.set(-0.2, height, 0);
      hotel.add(roofGlow);
      for (const y of [3.4, 2.4 + tall / 2, 1.4 + tall]) {
        const arm = new Mesh(this.unit, iron);
        arm.scale.set(0.5, 0.12, 0.12);
        arm.position.set(-0.25, y, bladeZ);
        hotel.add(arm);
      }
      for (let r = 0; r < 7; r++) {
        const a = -Math.PI / 2 + (r / 6) * Math.PI;
        const ray = new Mesh(tube, line);
        ray.scale.set(1.2, 1.6, 1.2);
        ray.rotation.z = -a;
        ray.position.set(-1.9 + Math.sin(a) * 1.1, 2.6 + tall + Math.cos(a) * 1.1, bladeZ);
        hotel.add(ray);
      }
      // A striped awning over the café terrace, and its tables' lamps.
      const awning = this.material({
        map: this.track(awningTexture(glow)),
        roughness: 0.8,
        emissive: glow,
        emissiveIntensity: 0.15,
      });
      const a = new Mesh(this.unit, awning);
      a.scale.set(3.6, 0.15, width * 0.5);
      a.rotation.z = -0.25;
      a.position.set(-1.6, 3.4, -width * 0.1);
      hotel.add(a);
      // The ground floor: a lit lobby behind plate glass, and a marquee canopy over the door,
      // its fascia ringed with bulbs and its underside glowing.
      const lobby = new Mesh(
        this.flat,
        k % 4 === 1 ? clubFloor : k % 3 === 2 ? barFloor : lobbies[k % lobbies.length]!,
      );
      lobby.rotation.y = -Math.PI / 2;
      lobby.scale.set(width * 0.86, 3.3, 1);
      lobby.position.set(-0.03, 1.75, 0);
      hotel.add(lobby);
      const canopy = new Mesh(this.unit, facade);
      canopy.scale.set(3, 0.35, width * 0.32);
      canopy.position.set(-1.5, 3.7, 0);
      canopy.castShadow = true;
      const fascia = new Mesh(this.flat, bulbs);
      fascia.rotation.y = -Math.PI / 2;
      fascia.scale.set(width * 0.32, 0.35, 1);
      fascia.position.set(-3.02, 3.7, 0);
      const under = new Mesh(this.flat, line);
      under.rotation.x = Math.PI / 2;
      under.scale.set(2.8, width * 0.3, 1);
      under.rotation.z = Math.PI / 2;
      under.position.set(-1.5, 3.51, 0);
      hotel.add(canopy, fascia, under);
      // Every other hotel turns its far corner with a streamline drum: a round tower the
      // height of the façade, ringed at each floor by a band of the hotel's neon, rising
      // above the roof to a lit cap.
      if (k % 2 === 0) {
        const drum = new Mesh(corner, facade);
        drum.scale.set(1, height + 3, 1);
        drum.position.set(1.2, (height + 3) / 2, -width / 2 + 2.6);
        drum.castShadow = true;
        hotel.add(drum);
        for (let f = 1; f <= storeys + 1; f++) {
          const band = new Mesh(ring, line);
          band.position.set(1.2, Math.min(1.6 + f * 3.6, height + 3), -width / 2 + 2.6);
          hotel.add(band);
        }
        const cap = new Mesh(capGeometry, line);
        cap.position.set(1.2, height + 3, -width / 2 + 2.6);
        hotel.add(cap);
      }
      // A deco eyebrow over every pair of upper windows: a thin slab of stucco standing 0.6 m
      // proud of the façade, lit along its edge, its shadow on the glass below.
      const brows = new BoxBuilder();
      const bays = windowBays(storeys);
      for (let i = 0; i < bays.length; i += 2) {
        const b = bays[i]!;
        const top = height * (1 - b.y / 512);
        if (top < 5.5) continue;
        const z = -width / 2 + ((b.x + 28) / 512) * width;
        brows.box(trim, [0.6, 0.1, (60 / 512) * width], [-0.3, top + 0.12, z]);
      }
      hotel.add(brows.build(this.disposables));
      // Streamline balconies on two hotels in three: a slab on each upper floor in front of
      // alternate bays, rounded off by its pipe railing of three white rails.
      if (k % 3 !== 2) {
        const decks = new BoxBuilder();
        const bayW = width / 6.56;
        for (let f = 1; f < storeys; f++)
          for (let b = 0; b < 6; b++) {
            if ((b + f + k) % 2) continue;
            const z = -width / 2 + (b + 0.6) * (width / 6) + bayW * 0.2;
            const y = 1.6 + f * 3.6 - 1.2;
            if (Math.abs(z - width * 0.3) < 2.5) continue;
            decks.box(slab, [1.2, 0.16, bayW * 1.25], [-0.6, y, z]);
            // A guest out on one balcony in three, leaning on the rail to watch the street.
            if ((b * 7 + f * 3 + k) % 2 === 0)
              this.balconyGuests.push({
                offset: offset + width / 2 - z,
                x: roadHalf + FRONT - 0.65,
                y: y + 0.08,
              });
            for (const h of [0.35, 0.65, 0.95])
              decks.box(rail, [0.05, 0.05, bayW * 1.25], [-1.18, y + h, z]);
            for (const dz of [-0.5, 0.5]) {
              decks.box(rail, [1.2, 0.05, 0.05], [-0.6, y + 0.95, z + dz * bayW * 1.25]);
              decks.box(rail, [0.05, 0.95, 0.05], [-1.18, y + 0.5, z + dz * bayW * 1.25]);
            }
          }
        hotel.add(decks.build(this.disposables));
      }
      // The roof's clutter behind the crown: air-conditioning units, a water tank on its legs,
      // a stair-and-lift house, a dish or two and a radio mast with its red lamp.
      const roof = new BoxBuilder();
      const rnd = seeded(8261 + k);
      roof.box(plant, [5, 3, 4.5], [11 + rnd() * 3, height + 1.5, -width * 0.25]);
      for (let i = 0; i < 3 + Math.floor(rnd() * 4); i++)
        roof.box(
          plant,
          [1.6, 1.1, 1.2],
          [5 + rnd() * 11, height + 0.55, (rnd() - 0.5) * width * 0.8],
        );
      roof.box(plant, [0.2, 0.6, width], [0.1, height + 0.3, 0]);
      if (rnd() < 0.6) {
        const tx = 12 + rnd() * 3;
        const tz = width * 0.28;
        for (const [dx, dz] of [
          [-0.9, -0.9],
          [0.9, -0.9],
          [-0.9, 0.9],
          [0.9, 0.9],
        ] as const)
          roof.box(iron, [0.15, 2.4, 0.15], [tx + dx, height + 1.2, tz + dz]);
        const tank = new Mesh(drum, timber);
        tank.position.set(tx, height + 3.6, tz);
        tank.castShadow = true;
        hotel.add(tank);
      }
      const aerial = new Mesh(this.unit, iron);
      aerial.scale.set(0.12, 7, 0.12);
      aerial.position.set(14, height + 3.5, -width * 0.38);
      const lamp = new Mesh(this.unit, warning);
      lamp.scale.set(0.35, 0.35, 0.35);
      lamp.position.set(14, height + 7.1, -width * 0.38);
      this.beacons.push(lamp);
      const dish = new Mesh(saucer, plantDish);
      dish.rotation.set(0, 0, -1.1);
      dish.position.set(7, height + 1.1, width * 0.1);
      hotel.add(roof.build(this.disposables), aerial, lamp, dish);
      // A stair tower of glass block over the entrance on every hotel but the clubs: a tall
      // panel of glowing blocks rising from the marquee to the roofline, framed by fins.
      if (k % 4 !== 1) {
        const glassBlock = new Mesh(this.unit, blocks);
        glassBlock.scale.set(1.6, height - 6, 2.4);
        glassBlock.position.set(-0.8, 4.6 + (height - 6) / 2, -width * 0.05);
        const capping = new Mesh(this.unit, facade);
        capping.scale.set(2, 0.5, 2.8);
        capping.position.set(-0.9, height - 1.1, -width * 0.05);
        capping.castShadow = true;
        const edge = new Mesh(tube, line);
        edge.scale.set(1, height - 6, 1);
        edge.position.set(-1.62, 4.6 + (height - 6) / 2, -width * 0.05 + 1.22);
        hotel.add(glassBlock, capping, edge);
      }
      // The hotel's name again in flowing neon script across the façade over the marquee, and
      // a small VACANCY sign glowing in a ground-floor corner window.
      const script = this.material({
        map: this.track(scriptTexture(NAMES[k % NAMES.length]!, glow)),
        emissive: 0xffffff,
        emissiveMap: this.track(scriptTexture(NAMES[k % NAMES.length]!, glow)),
        emissiveIntensity: 2.2,
        transparent: true,
        depthWrite: false,
      });
      this.signs.push(script);
      const word = new Mesh(this.flat, script);
      word.rotation.y = -Math.PI / 2;
      word.scale.set(width * 0.55, width * 0.55 * 0.25, 1);
      word.position.set(-0.08, 5.9, 0);
      const vacancy = new Mesh(this.flat, vacancies[k % 2]!);
      vacancy.rotation.y = -Math.PI / 2;
      vacancy.scale.set(2.2, 0.55, 1);
      vacancy.position.set(-0.06, 2.6, -width * 0.36);
      hotel.add(word, vacancy);
      // The sidewalk café: tables under umbrellas between the marquee and the palms, a
      // candle glowing on each, the chairs drawn up round them.
      const cafe = new BoxBuilder();
      for (let z = -width * 0.4; z < width * 0.4; z += 3.2) {
        if (Math.abs(z) < width * 0.17) continue;
        const x = -4.2 - (Math.round(z) % 2) * 1.3;
        // Diners at two tables in three, on facing chairs.
        if (Math.round(z * 7) % 3 !== 0)
          for (const [dx, dz, turn] of [
            [0.75, 0, -Math.PI / 2],
            [-0.75, 0, Math.PI / 2],
          ] as const)
            this.diners.push({ offset: offset + width / 2 - (z + dz), x: x + dx, heading: turn });
        cafe.box(tableTop, [0.8, 0.05, 0.8], [x, 0.9, z]);
        cafe.box(metal, [0.06, 0.88, 0.06], [x, 0.45, z]);
        cafe.box(metal, [0.5, 0.04, 0.5], [x, 0.02, z]);
        for (const [dx, dz] of [
          [0.7, 0],
          [-0.7, 0],
          [0, 0.7],
          [0, -0.7],
        ] as const) {
          cafe.box(chair, [0.42, 0.05, 0.42], [x + dx, 0.48, z + dz]);
          const bx = x + dx * 1.3;
          const bz = z + dz * 1.3;
          cafe.box(chair, [dx ? 0.05 : 0.42, 0.5, dz ? 0.05 : 0.42], [bx, 0.75, bz]);
          cafe.box(metal, [0.04, 0.46, 0.04], [x + dx, 0.23, z + dz]);
        }
        cafe.box(metal, [0.05, 2.4, 0.05], [x, 1.2, z]);
        const shade = new Mesh(umbrella, shades[(k + Math.round(z)) % shades.length]!);
        shade.position.set(x, 2.45, z);
        shade.castShadow = true;
        const flame = new Mesh(this.unit, candle);
        flame.scale.set(0.08, 0.12, 0.08);
        flame.position.set(x, 0.98, z);
        const glow = new Mesh(this.flat, candleGlow);
        glow.scale.set(0.9, 0.9, 1);
        glow.position.set(x, 1.0, z);
        hotel.add(shade, flame, glow);
      }
      // A string of café bulbs over the terrace, looping from umbrella to umbrella.
      const string = new Mesh(cafeString, cafeBulb);
      string.scale.set(1, 1, width * 0.8);
      string.position.set(-4.8, 0, 0);
      hotel.add(string);
      const tables = cafe.build(this.disposables);
      tables.position.y = 0.15;
      hotel.add(tables);
      // The sign and the hotel's neon mirrored in the wet street: long soft streaks of its
      // colour running towards the rider across the sidewalk and the near lane.
      const mirror = reflections[k % reflections.length]!;
      for (const [x, z, w, l] of [
        [-1.6, width * 0.3 + 5, 2.2, 10],
        [-FRONT - 1.4, width * 0.3 + 9, 2.6, 18],
        [-FRONT - 3.6, -width * 0.1 + 8, 1.6, 14],
      ] as const) {
        const streak = new Mesh(this.flat, mirror);
        streak.rotation.x = -Math.PI / 2;
        streak.scale.set(w, l, 1);
        streak.position.set(x, x > -FRONT ? 0.165 : 0.03, z);
        streak.renderOrder = 1;
        hotel.add(streak);
      }
      const holder = new Group();
      holder.add(hotel);
      this.group.add(holder);
      // The hotel's name in neon capitals on a frame on its roof, turned to face down the
      // drive so it reads from far off, both ways.
      for (const turn of [0, Math.PI]) {
        const roofName = new Mesh(this.flat, roofNames[k % roofNames.length]!);
        roofName.rotation.y = turn;
        roofName.scale.set(17, 3.6, 1);
        roofName.position.set(6, height + 4.2, -width * 0.36 + (turn ? -0.05 : 0.05));
        hotel.add(roofName);
      }
      const frame = new Mesh(this.unit, iron);
      frame.scale.set(17, 0.2, 0.2);
      frame.position.set(6, height + 2.3, -width * 0.36);
      hotel.add(frame);
      // A neon figure over the sidewalk at first-floor height: a flamingo, a palm, a
      // cocktail glass or a crescent moon, in tubes of light.
      // It hangs out from the wall on an iron bracket, side on to the street, so it faces
      // the riders coming down the drive.
      for (const turn of [0, Math.PI]) {
        const figure = new Mesh(this.flat, icons[k % icons.length]!);
        figure.rotation.y = turn;
        figure.scale.set(3.4, 3.4, 1);
        figure.position.set(-2.1, 8.2, -width * 0.32 + (turn ? -0.02 : 0.02));
        hotel.add(figure);
      }
      const bracket = new Mesh(this.unit, iron);
      bracket.scale.set(3.8, 0.1, 0.1);
      bracket.position.set(-1.9, 10, -width * 0.32);
      hotel.add(bracket);
      // A chalkboard A-frame out on the sidewalk by the door, chalked with the night's offer.
      for (const turn of [0.35, -0.35]) {
        const board = new Mesh(this.flat, chalkboards[k % chalkboards.length]!);
        board.scale.set(0.65, 1.0, 1);
        board.rotation.set(turn, 0, 0);
        board.position.set(-1.6, 0.62, -width * 0.3 + (turn > 0 ? 0.17 : -0.17));
        board.rotation.y = turn > 0 ? 0 : Math.PI;
        hotel.add(board);
      }
      // A mural on the end wall facing back up the drive, as the side streets show them:
      // bold colour across the whole gable, from the ground floor to the roof.
      const mural = new Mesh(this.flat, murals[k % murals.length]!);
      mural.scale.set(17, height - 0.5, 1);
      mural.position.set(9, (height - 0.5) / 2, width / 2 + 0.03);
      hotel.add(mural);
      // A planter at each end of the frontage, spilling bougainvillea in magenta flower.
      for (const z of [-width / 2 + 1.4, width / 2 - 1.4]) {
        const box = new Mesh(this.unit, planter);
        box.scale.set(1.4, 0.7, 2.2);
        box.position.set(-1.1, 0.5, z);
        box.castShadow = true;
        hotel.add(box);
        for (let i = 0; i < 3; i++) {
          const bush = new Mesh(blossomBall, i % 2 ? blossom : foliage);
          bush.scale.set(0.8, 0.75, 1);
          bush.position.set(-1.1 + (i - 1) * 0.15, 1.15 + (i % 2) * 0.2, z + (i - 1) * 0.6);
          hotel.add(bush);
        }
        // A pair of pink plastic flamingos standing in the planter's front edge.
        for (const dz of [-0.55, 0.45]) {
          const bird = new Mesh(flamingoGeometry, flamingoPink);
          bird.position.set(-1.75, 0.85, z + dz);
          bird.rotation.y = dz > 0 ? 0.6 : -2.4;
          hotel.add(bird);
        }
      }
      // Every fourth hotel keeps a nightclub on its ground floor: a red rope on brass posts
      // holds back the queue along the shopfront, and a neon arrow points at the door.
      if (k % 4 === 1) {
        const rope = new BoxBuilder();
        for (let z = 1.5; z <= 9.6; z += 1.35) {
          rope.box(brass, [0.07, 1, 0.07], [-2.1, 0.65, z]);
          rope.box(brass, [0.3, 0.05, 0.3], [-2.1, 0.17, z]);
          if (z + 1.35 <= 9.6) rope.box(velvet, [0.06, 0.06, 1.3], [-2.1, 1.0, z + 0.675]);
        }
        hotel.add(rope.build(this.disposables));
        const arrow = new Mesh(this.flat, clubSign);
        arrow.rotation.y = -Math.PI / 2;
        arrow.scale.set(4.4, 1.5, 1);
        arrow.position.set(-0.1, 4.9, 2.6);
        hotel.add(arrow);
        this.clubs.push(offset + width / 2);
        // The club's lasers on its roof: a fan of green beams fanning out over the street and
        // the sea, sweeping to the beat.
        const fan = new Group();
        for (let i = 0; i < 4; i++) {
          const beam = new Mesh(laserGeometry, laser);
          beam.rotation.z = Math.PI / 2 + 0.25 + i * 0.09;
          fan.add(beam);
        }
        const source = new Mesh(this.flat, laserGlow);
        source.scale.set(2.5, 2.5, 1);
        fan.add(source);
        fan.position.set(4, height + 4, 0);
        hotel.add(fan);
        this.lasers.push(fan);
      }
      this.props.push({ mesh: holder, offset: offset + width / 2, x: roadHalf + FRONT });
      offset += width + 3 + random() * 4;
      k++;
    }
  }

  /** Royal palms along both sidewalks, their trunks lit from below. */
  private addPalms(roadHalf: number): void {
    const random = seeded(8111);
    const palms = new Palms(this.disposables, this.track);
    const uplight = this.material({
      color: 0xfff0d0,
      emissive: 0xfff0d0,
      emissiveIntensity: 2,
      roughness: 0.5,
    });
    // Each trunk is washed with light from its uplight, warm white on most and pink, cyan or
    // violet on every third, fading as it climbs; a square iron grate rings the foot.
    const shell = new CylinderGeometry(0.29, 0.34, 7, 14, 1, true);
    shell.translate(0, 3.5, 0);
    this.disposables.push(shell);
    const wash = this.track(uplightTexture());
    const washes = [0xffe8c0, 0xff4fb8, 0x3fe0ff, 0xffe8c0, 0xb46bff].map((c) => {
      const m = new MeshBasicMaterial({
        map: wash,
        color: c,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      this.disposables.push(m);
      return m;
    });
    const crownGlows = [0xffe8c0, 0xff4fb8, 0x3fe0ff, 0xffe8c0, 0xb46bff].map((c) => {
      const m = new MeshBasicMaterial({
        map: this.track(haloTexture()),
        color: c,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: AdditiveBlending,
      });
      this.disposables.push(m);
      return m;
    });
    const grate = this.material({ color: 0x18181c, roughness: 0.7, metalness: 0.6 });
    const twinkles: BufferGeometry[] = [];
    for (let i = 0; i < 90; i++) {
      const t = i / 90;
      const y = 0.6 + t * 7.4;
      const a = t * Math.PI * 2 * 9;
      const r = 0.27 - t * 0.06;
      const bulb = new SphereGeometry(0.045, 4, 3);
      bulb.translate(Math.cos(a) * r + ((y - 0.8) / 1.55) ** 2 * 0.02, y, Math.sin(a) * r);
      twinkles.push(bulb);
    }
    const spiral = mergeGeometries(twinkles)!;
    twinkles.forEach((g) => g.dispose());
    this.disposables.push(spiral);
    const fairy = new MeshBasicMaterial({ color: 0xfff0c0 });
    this.disposables.push(fairy);
    const coconut = new SphereGeometry(0.15, 8, 6);
    this.disposables.push(coconut);
    const husk = this.material({ color: 0x5a3a20, roughness: 0.9 });
    const greenNut = this.material({ color: 0x4a5a20, roughness: 0.8 });
    let n = 0;
    for (let offset = 0; offset < LOOP; offset += 14 + random() * 4)
      for (const side of [-1, 1]) {
        const p = palms.make(random);
        p.scale.multiplyScalar(1.2);
        if (side > 0 && inCrossing(offset, 1.5)) continue;
        // A cluster of coconuts under the crown, and the whole palm swaying in the breeze.
        for (let c = 0; c < 4; c++) {
          const nut = new Mesh(coconut, c % 2 ? husk : greenNut);
          nut.position.set(
            0.5 + Math.cos(c * 1.7) * 0.22,
            8.95 - (c % 2) * 0.15,
            Math.sin(c * 1.7) * 0.22,
          );
          p.add(nut);
        }
        this.swaying.push({ palm: p, phase: random() * 6, lean: p.rotation.y });
        // Every other palm on the promenade side is wrapped in a spiral of fairy lights.
        if (side < 0 && n % 2 === 0) p.add(new Mesh(spiral, fairy));
        const lamp = new Mesh(this.unit, uplight);
        lamp.scale.set(0.3, 0.12, 0.3);
        lamp.position.set(0.5, 0.06, 0);
        const tint = n % 3 === 2 ? 1 + (((n / 3) % 3) | 0) : 0;
        const lit = new Mesh(shell, washes[tint]!);
        // The uplight reaches the crown: a soft glow of its colour under the fronds.
        const crownGlow = new Mesh(this.flat, crownGlows[tint]!);
        crownGlow.scale.set(5.5, 3.5, 1);
        crownGlow.position.set(0.5, 8.6, 0);
        p.add(crownGlow);
        const bed = new Mesh(this.unit, grate);
        bed.scale.set(1.5, 0.03, 1.5);
        bed.position.y = 0.01;
        const holder = new Group();
        holder.add(p, lamp, lit, bed);
        holder.position.y = 0.15;
        this.group.add(holder);
        const x = side > 0 ? roadHalf + 2 : -roadHalf - 2.6;
        this.props.push({ mesh: holder, offset: offset + (side > 0 ? 0 : 7), x });
        n++;
      }
  }

  /**
   * Deco lamp posts along the kerb and the promenade wall: a fluted white column, a ringed
   * collar and a frosted globe, a halo round it in the damp air and a warm pool on the ground.
   */
  private addLamps(roadHalf: number): void {
    const post = new CylinderGeometry(0.07, 0.11, 4.2, 10);
    post.translate(0, 2.1, 0);
    const collar = new CylinderGeometry(0.16, 0.12, 0.25, 12);
    collar.translate(0, 4.25, 0);
    const base = new CylinderGeometry(0.2, 0.24, 0.5, 10);
    base.translate(0, 0.25, 0);
    const globe = new SphereGeometry(0.28, 16, 12);
    globe.translate(0, 4.62, 0);
    this.disposables.push(post, collar, base, globe);
    const white = this.material({ color: 0xece8f0, roughness: 0.4, metalness: 0.3 });
    const lit = this.material({ color: 0xfff2d8, emissive: 0xffe8c0, emissiveIntensity: 3 });
    const halo = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const pool = new MeshBasicMaterial({
      map: this.track(poolTexture()),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(halo, pool);
    const banners = [
      ['ART DECO', '#ff4fb8'],
      ['OCEAN DR', '#2ab8b0'],
      ['MIAMI BEACH', '#7a6ad8'],
    ].map(([text, colour]) => {
      const m = this.material({
        map: this.track(lampBannerTexture(text!, colour!)),
        roughness: 0.8,
        side: DoubleSide,
      });
      return m;
    });
    const lampGlint = new MeshBasicMaterial({
      map: this.track(reflectionTexture()),
      color: 0xffd8a0,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(lampGlint);
    for (let offset = 6; offset < LOOP; offset += 24)
      for (const side of [-1, 1]) {
        if (side > 0 && inCrossing(offset + 12, 1)) continue;
        const lamp = new Group();
        lamp.add(new Mesh(post, white), new Mesh(collar, white), new Mesh(base, white));
        lamp.add(new Mesh(globe, lit));
        // A pair of district banners on arms either side of the post, facing along the street.
        const banner = banners[(Math.round(offset / 24) + (side > 0 ? 1 : 0)) % banners.length]!;
        for (const dz of [-0.45, 0.45]) {
          const flag = new Mesh(this.flat, banner);
          flag.scale.set(0.55, 1.5, 1);
          flag.position.set(0, 3.05, dz);
          flag.rotation.y = Math.PI / 2;
          const arm = new Mesh(this.unit, white);
          arm.scale.set(0.04, 0.04, 0.5);
          arm.position.set(0, 3.82, dz / 2);
          lamp.add(flag, arm);
        }
        const h = new Mesh(this.flat, halo);
        h.scale.set(2.6, 2.6, 1);
        h.position.y = 4.62;
        const p = new Mesh(this.flat, pool);
        p.rotation.x = -Math.PI / 2;
        p.scale.set(7, 7, 1);
        p.position.y = 0.02;
        p.renderOrder = 1;
        // The globe mirrored in the wet road: a warm broken streak running from below the lamp
        // across the near lane towards the rider.
        const mirror = new Mesh(this.flat, lampGlint);
        mirror.rotation.x = -Math.PI / 2;
        mirror.rotation.z = Math.PI;
        mirror.scale.set(1.1, 9, 1);
        mirror.position.set(side > 0 ? -1.6 : 5.6, -0.12, 5);
        mirror.renderOrder = 1;
        lamp.add(h, p, mirror);
        lamp.children.slice(0, 3).forEach((m) => (m.castShadow = true));
        lamp.position.y = 0.15;
        const holder = new Group();
        holder.add(lamp);
        this.group.add(holder);
        const x = side > 0 ? roadHalf + 0.7 : -roadHalf - 4.5;
        this.props.push({ mesh: holder, offset: offset + (side > 0 ? 12 : 0), x });
      }
  }

  /**
   * Classic convertibles parked at the kerb, nose to tail: a long candy-painted body with a
   * lower bonnet and boot, flared fenders and tail fins, a cream bench seat in an open tub,
   * a raked chrome-framed windscreen, white-wall tyres on chrome hubs, glowing tail lights and
   * a pool of neon underglow on the wet road.
   */
  private addCars(roadHalf: number): void {
    const random = seeded(8121);
    const colours = [0xff3f8a, 0x2fc8e6, 0xf4f0e8, 0x1d1f24, 0xffd23f, 0x8a5aff];
    const paints = colours.map((c) => this.material({ color: c, roughness: 0.2, metalness: 0.55 }));
    const chrome = this.material({ color: 0xd8dce4, roughness: 0.12, metalness: 1 });
    const seat = this.material({ color: 0xf4e8d8, roughness: 0.7 });
    const tyre = this.material({ color: 0x18181c, roughness: 0.85 });
    const wall = this.material({ color: 0xf4f0ec, roughness: 0.6 });
    const glass = this.material({
      color: 0x8aa0c8,
      roughness: 0.05,
      metalness: 0.6,
      transparent: true,
      opacity: 0.45,
    });
    const tail = this.material({ color: 0xff2030, emissive: 0xff2030, emissiveIntensity: 3 });
    const head = this.material({ color: 0xfff4d8, emissive: 0xfff4d8, emissiveIntensity: 2 });
    const glows = [0xff3fb4, 0x2fe6ff, 0xb46bff].map(
      (c) =>
        new MeshBasicMaterial({
          map: this.track(poolTexture()),
          color: c,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
    );
    this.disposables.push(...glows);
    const wheel = new CylinderGeometry(0.36, 0.36, 0.24, 18);
    wheel.rotateZ(Math.PI / 2);
    const whitewall = new CylinderGeometry(0.25, 0.25, 0.25, 18);
    whitewall.rotateZ(Math.PI / 2);
    const hub = new CylinderGeometry(0.13, 0.13, 0.26, 12);
    hub.rotateZ(Math.PI / 2);
    this.disposables.push(wheel, whitewall, hub);
    const beam = new MeshBasicMaterial({
      map: this.track(beamTexture()),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const flare = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(beam, flare);
    const tailGlint = new MeshBasicMaterial({
      map: this.track(reflectionTexture()),
      color: 0xff2030,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(tailGlint);
    const make = (k: number, parked: boolean): Group => {
      const paint = paints[k % paints.length]!;
      const b = new BoxBuilder();
      // The body: a waist-high hull, the bonnet and boot dropping lower, fenders and fins.
      b.box(paint, [1.9, 0.5, 5], [0, 0.62, 0]);
      b.box(paint, [1.84, 0.18, 1.7], [0, 0.94, -1.55]);
      b.box(paint, [1.84, 0.18, 1.3], [0, 0.94, 1.75]);
      b.box(paint, [1.86, 0.22, 1.5], [0, 0.95, 0.2]);
      for (const x of [-0.82, 0.82]) {
        b.box(paint, [0.24, 0.3, 0.9], [x, 1.1, 2.15], x > 0 ? -0.25 : 0.25);
        b.box(chrome, [0.04, 0.05, 4.6], [x * 1.17, 0.78, 0]);
      }
      b.box(seat, [1.6, 0.12, 1.5], [0, 0.98, 0.35]);
      b.box(seat, [1.6, 0.5, 0.18], [0, 1.2, 0.95]);
      b.box(seat, [1.6, 0.4, 0.14], [0, 1.15, -0.3]);
      b.box(chrome, [1.95, 0.14, 0.2], [0, 0.42, -2.55]);
      b.box(chrome, [1.95, 0.14, 0.2], [0, 0.42, 2.55]);
      b.box(chrome, [1.6, 0.06, 0.06], [0, 1.52, -0.7]);
      b.box(glass, [1.56, 0.5, 0.03], [0, 1.27, -0.72]);
      const car = b.build(this.disposables);
      for (const x of [-0.62, 0.62]) {
        const t = new Mesh(this.unit, tail);
        t.scale.set(0.28, 0.12, 0.05);
        t.position.set(x, 0.8, 2.52);
        const h = new Mesh(this.unit, head);
        h.scale.set(0.3, 0.16, 0.05);
        h.position.set(x, 0.74, -2.52);
        car.add(t, h);
        for (const z of [-1.6, 1.55]) {
          const w = new Mesh(wheel, tyre);
          const ww = new Mesh(whitewall, wall);
          const hc = new Mesh(hub, chrome);
          for (const m of [w, ww, hc]) {
            m.position.set(x * 1.38, 0.36, z);
            car.add(m);
          }
        }
      }
      const glow = new Mesh(this.flat, glows[k % glows.length]!);
      glow.rotation.x = -Math.PI / 2;
      glow.scale.set(3.4, 6.4, 1);
      glow.position.y = 0.03;
      glow.renderOrder = 1;
      car.add(glow);
      // The tail lights mirrored in the wet road behind the car, and for moving cars their
      // headlights mirrored ahead of them.
      for (const x of [-0.62, 0.62]) {
        const glint = new Mesh(this.flat, tailGlint);
        glint.rotation.x = -Math.PI / 2;
        glint.rotation.z = Math.PI;
        glint.scale.set(0.5, 3.2, 1);
        glint.position.set(x, 0.03, 4.1);
        glint.renderOrder = 1;
        car.add(glint);
      }
      if (!parked) {
        // Headlights on: a flare at each lamp and their beams thrown ahead on the wet road.
        for (const x of [-0.62, 0.62]) {
          const f = new Mesh(this.flat, flare);
          f.scale.set(1.4, 1.4, 1);
          f.rotation.y = Math.PI;
          f.position.set(x, 0.74, -2.6);
          car.add(f);
        }
        const b = new Mesh(this.flat, beam);
        b.rotation.x = -Math.PI / 2;
        b.scale.set(3.6, 16, 1);
        b.position.set(0, 0.04, -10.5);
        b.renderOrder = 1;
        car.add(b);
      }
      return car;
    };
    for (let k = 0; k < 8; k++) {
      const car = make(k, true);
      car.rotation.y = (random() - 0.5) * 0.05;
      const holder = new Group();
      holder.add(car);
      this.group.add(holder);
      let at = 40 + k * 46 + random() * 8;
      if (inCrossing(at, 4)) at += STREET + 8;
      this.props.push({ mesh: holder, offset: at, x: roadHalf - 1.1 });
    }
    // Two wedge-shaped Italian sports cars in white and black among them, low and wide, with
    // their side strakes, pop-up headlights and a full-width bar of tail lights.
    const strakes = this.material({
      map: this.track(strakeTexture()),
      roughness: 0.3,
      metalness: 0.5,
    });
    const glassTop = this.material({ color: 0x101820, roughness: 0.05, metalness: 0.8 });
    for (const [k, paintColour, at] of [
      [0, 0xf8f8f4, 33],
      [1, 0x14141a, 330],
    ] as const) {
      const b = new BoxBuilder();
      const paint = this.material({ color: paintColour, roughness: 0.15, metalness: 0.6 });
      b.box(paint, [2.0, 0.5, 4.5], [0, 0.55, 0]);
      b.box(paint, [1.96, 0.3, 1.6], [0, 0.78, -1.4], 0);
      b.box(glassTop, [1.5, 0.38, 1.7], [0, 0.98, 0.2]);
      b.box(paint, [1.6, 0.08, 1.4], [0, 1.18, 0.5]);
      b.box(strakes, [2.02, 0.32, 1.6], [0, 0.6, 0.9]);
      b.box(paint, [0.5, 0.18, 0.4], [-0.55, 0.92, -1.9]);
      b.box(paint, [0.5, 0.18, 0.4], [0.55, 0.92, -1.9]);
      const wedge = b.build(this.disposables);
      const bar = new Mesh(this.unit, tail);
      bar.scale.set(1.8, 0.1, 0.05);
      bar.position.set(0, 0.68, 2.27);
      wedge.add(bar);
      const glint = new Mesh(this.flat, tailGlint);
      glint.rotation.x = -Math.PI / 2;
      glint.rotation.z = Math.PI;
      glint.scale.set(1.8, 3.4, 1);
      glint.position.set(0, 0.03, 4);
      glint.renderOrder = 1;
      wedge.add(glint);
      for (const x of [-0.82, 0.82])
        for (const z of [-1.45, 1.4]) {
          const w = new Mesh(wheel, tyre);
          w.position.set(x * 1.2, 0.36, z);
          wedge.add(w);
        }
      wedge.rotation.y = (k - 0.5) * 0.03;
      const holder = new Group();
      holder.add(wedge);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: at, x: roadHalf - 1.1 });
    }
    // Cruising traffic in the far lane, headlights on, rolling towards the rider.
    for (let k = 0; k < 5; k++) {
      const car = make(k + 3, false);
      car.rotation.y = Math.PI;
      const holder = new Group();
      holder.add(car);
      this.group.add(holder);
      this.traffic.push({
        mesh: holder,
        offset: 45 + k * 75 + random() * 20,
        speed: 8 + random() * 3,
      });
    }
    this.trafficX = -roadHalf * 0.5;
    this.occupants = new Figures(this.group, this.disposables, 10, NIGHT_WEAR, 8581);
    // The trolley, coming the other way: a boxy bus in green and orange livery with a row of
    // lit windows, a glowing destination board and its headlights on.
    const trolley = new Group();
    const livery = this.material({
      map: this.track(trolleyTexture(false)),
      emissive: 0xffffff,
      emissiveMap: this.track(trolleyTexture(true)),
      emissiveIntensity: 1.2,
      roughness: 0.4,
      metalness: 0.2,
    });
    const roofPaint = this.material({ color: 0xf4f0e8, roughness: 0.5 });
    const shell = new Mesh(this.unit, livery);
    shell.scale.set(2.5, 2.7, 10);
    shell.position.y = 1.75;
    const roofTop = new Mesh(this.unit, roofPaint);
    roofTop.scale.set(2.4, 0.25, 9.6);
    roofTop.position.y = 3.2;
    trolley.add(shell, roofTop);
    for (const x of [-1.2, 1.2])
      for (const z of [-3.4, 3.4]) {
        const w = new Mesh(wheel, tyre);
        w.scale.setScalar(1.3);
        w.position.set(x, 0.47, z);
        trolley.add(w);
      }
    for (const x of [-0.8, 0.8]) {
      const f = new Mesh(this.flat, flare);
      f.scale.set(1.6, 1.6, 1);
      f.rotation.y = Math.PI;
      f.position.set(x, 0.9, -5.1);
      trolley.add(f);
    }
    const b = new Mesh(this.flat, beam);
    b.rotation.x = -Math.PI / 2;
    b.scale.set(4, 18, 1);
    b.position.set(0, 0.04, -14);
    b.renderOrder = 1;
    trolley.add(b);
    trolley.rotation.y = Math.PI;
    trolley.children.forEach((m) => (m.castShadow = true));
    const holder = new Group();
    holder.add(trolley);
    this.group.add(holder);
    this.traffic.push({ mesh: holder, offset: 85, speed: 7 });
  }

  /**
   * South Beach's painted lifeguard towers on the sand, closed for the night, their ramps
   * towards the promenade, each with a neon band round its deck and a lamp-lit hut.
   */
  private addLifeguards(roadHalf: number): void {
    const towers = new LifeguardTowers(this.disposables, this.track);
    const bands = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.4, roughness: 0.4 }),
    );
    for (let i = 0; i < 5; i++) {
      const tower = towers.make(i + 1);
      tower.rotation.y = Math.PI + (i % 2 ? 0.2 : -0.15);
      for (const [w, d, x, z] of [
        [3.3, 0.08, 0, 1.62],
        [3.3, 0.08, 0, -1.62],
        [0.08, 3.3, 1.62, 0],
        [0.08, 3.3, -1.62, 0],
      ] as const) {
        const band = new Mesh(this.unit, bands[(i * 2) % bands.length]!);
        band.scale.set(w, 0.08, d);
        band.position.set(x, 1.82, z);
        tower.add(band);
      }
      const glow = new Mesh(this.flat, this.halo);
      glow.scale.set(5, 5, 1);
      glow.position.set(0, 2.9, 1.4);
      tower.add(glow);
      const holder = new Group();
      const across = 12 + (i % 2) * 5;
      holder.add(tower);
      holder.position.y = -0.3 - ((across - 5.5) / (BEACH - 5.5)) * (SEA - 0.2);
      tower.position.y = 0;
      const outer = new Group();
      outer.add(holder);
      this.group.add(outer);
      this.props.push({ mesh: outer, offset: 20 + i * 80, x: -roadHalf - across });
    }
  }

  /**
   * The side streets: asphalt running off between the hotels, a zebra crossing over the
   * boulevard, a signal on a mast arm reaching over the road with its lights cycling, and a
   * green street-name sign.
   */
  private addCrossings(roadHalf: number): void {
    const r = roadHalf;
    const asphalt = this.material({
      map: this.repeat(roadTexture(), r * 2, 16),
      roughness: 0.25,
      metalness: 0.2,
    });
    const zebra = this.material({ color: 0xece8e0, roughness: 0.5 });
    const steel = this.material({ color: 0x3a3c44, roughness: 0.5, metalness: 0.7 });
    const housing = this.material({ color: 0x1a1a14, roughness: 0.6 });
    const nameplate = this.material({
      map: this.track(streetSignTexture()),
      roughness: 0.5,
      emissive: 0xffffff,
      emissiveMap: this.track(streetSignTexture()),
      emissiveIntensity: 0.25,
    });
    const lamps = [0xff2a2a, 0xffb020, 0x30ff80].map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 0 }),
    );
    this.lights.push(...lamps);
    CROSSINGS.forEach((c) => {
      const crossing = new Group();
      const side = new Mesh(this.unit, asphalt);
      side.scale.set(FRONT + 40, 0.1, STREET);
      side.position.set(r + (FRONT + 40) / 2, 0.02, 0);
      side.receiveShadow = true;
      crossing.add(side);
      for (let x = -r + 0.4; x < r; x += 1.1) {
        const bar = new Mesh(this.unit, zebra);
        bar.scale.set(0.55, 0.02, 3.2);
        bar.position.set(x, 0.025, STREET / 2 - 2);
        crossing.add(bar);
      }
      // The signal: a pole on the near corner, its mast arm out over the boulevard.
      const pole = new Mesh(this.unit, steel);
      pole.scale.set(0.22, 6.4, 0.22);
      pole.position.set(r + 0.8, 3.35, STREET / 2 + 0.6);
      const arm = new Mesh(this.unit, steel);
      arm.scale.set(r + 1.2, 0.14, 0.14);
      arm.position.set(r * 0.5 + 0.2, 6.2, STREET / 2 + 0.6);
      crossing.add(pole, arm);
      for (const x of [r * 0.5, -r * 0.1]) {
        const head = new Mesh(this.unit, housing);
        head.scale.set(0.42, 1.25, 0.32);
        head.position.set(x, 5.45, STREET / 2 + 0.6);
        crossing.add(head);
        lamps.forEach((m, i) => {
          const bulb = new Mesh(this.flat, m);
          bulb.scale.set(0.26, 0.26, 1);
          bulb.position.set(x, 5.85 - i * 0.4, STREET / 2 + 0.77);
          crossing.add(bulb);
        });
      }
      const name = new Mesh(this.unit, nameplate);
      name.scale.set(0.05, 0.3, 1.6);
      name.position.set(r + 0.8, 4.2, STREET / 2 + 0.6 - 0.9);
      crossing.add(name);
      const holder = new Group();
      holder.add(crossing);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: c, x: 0 });
    });
  }

  /**
   * The promenade's furniture along the sea wall: teak benches on curled iron ends facing the
   * sea, a lidded bin beside every other one, and a pair of bollards at the kerb.
   */
  private addPromenade(roadHalf: number): void {
    const teak = this.material({ color: 0x8a5a3a, roughness: 0.6 });
    const iron = this.material({ color: 0x1e2226, roughness: 0.5, metalness: 0.7 });
    const bin = this.material({ color: 0x2a6a6a, roughness: 0.5, metalness: 0.4 });
    for (let offset = 10, n = 0; offset < LOOP; offset += 21, n++) {
      const b = new BoxBuilder();
      // The bench, its back to the road: three seat slats, two back slats and iron ends.
      for (let i = 0; i < 3; i++) b.box(teak, [0.1, 0.05, 1.8], [-0.12 * i, 0.46, 0]);
      for (let i = 0; i < 2; i++) b.box(teak, [0.05, 0.1, 1.8], [0.14, 0.62 + i * 0.16, 0], -0.15);
      for (const z of [-0.85, 0.85]) {
        b.box(iron, [0.5, 0.06, 0.06], [-0.1, 0.42, z]);
        b.box(iron, [0.06, 0.44, 0.06], [-0.3, 0.22, z]);
        b.box(iron, [0.06, 0.8, 0.06], [0.12, 0.4, z], -0.15);
      }
      if (n % 2 === 0) {
        b.box(bin, [0.5, 0.85, 0.5], [0, 0.43, 1.6]);
        b.box(iron, [0.56, 0.08, 0.56], [0, 0.9, 1.6]);
      }
      for (const z of [-3, 3]) b.box(iron, [0.16, 0.9, 0.16], [3.6, 0.45, z]);
      const furniture = b.build(this.disposables);
      furniture.position.y = 0.15;
      const holder = new Group();
      holder.add(furniture);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 4.2 });
    }
  }

  /**
   * The hotel side's kerb: parking meters every 7 m beside the parked cars, a yellow fire
   * hydrant now and then, and a cluster of newspaper boxes in bright colours.
   */
  private addKerbside(roadHalf: number): void {
    const steel = this.material({ color: 0x3a3e46, roughness: 0.4, metalness: 0.8 });
    const glass = this.material({ color: 0xd8f0ff, emissive: 0x80c0ff, emissiveIntensity: 0.6 });
    const hydrant = this.material({ color: 0xf0c020, roughness: 0.5 });
    const boxes = [0xd02030, 0x2050c0, 0xf4f0e8, 0x20a060].map((c) =>
      this.material({ color: c, roughness: 0.5 }),
    );
    for (let stretch = 0; stretch < LOOP; stretch += 42) {
      if (inCrossing(stretch + 21, 14)) continue;
      const b = new BoxBuilder();
      for (let z = 0; z < 42; z += 7) {
        b.box(steel, [0.08, 1.1, 0.08], [0, 0.55, -z]);
        b.box(steel, [0.22, 0.3, 0.16], [0, 1.2, -z]);
        b.box(glass, [0.23, 0.1, 0.12], [0, 1.25, -z]);
      }
      b.box(hydrant, [0.28, 0.6, 0.28], [0.2, 0.3, -17]);
      b.box(hydrant, [0.36, 0.1, 0.36], [0.2, 0.62, -17]);
      b.box(hydrant, [0.5, 0.1, 0.12], [0.2, 0.42, -17]);
      boxes.forEach((m, i) => {
        b.box(m, [0.5, 1.0, 0.45], [0.6, 0.5, -30 - i * 0.55]);
        b.box(glass, [0.02, 0.25, 0.3], [0.34, 0.78, -30 - i * 0.55]);
      });
      const kerb = b.build(this.disposables);
      kerb.position.y = 0.15;
      const holder = new Group();
      holder.add(kerb);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: stretch, x: roadHalf + 0.55 });
    }
  }

  /**
   * The dune between the sea wall and the sand: mounds of sea grape whose round leaves peek
   * over the wall, and rows of beach umbrellas furled for the night with stacked loungers.
   */
  private addDunes(roadHalf: number): void {
    const random = seeded(8321);
    const leaf = new SphereGeometry(1, 8, 6);
    const pole = new CylinderGeometry(0.035, 0.035, 2.6, 6);
    pole.translate(0, 1.3, 0);
    const furled = new ConeGeometry(0.22, 1.6, 8);
    furled.translate(0, 2.2, 0);
    this.disposables.push(leaf, pole, furled);
    const greens = [0x1e3a22, 0x2a4a26, 0x243e2a].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    const wood = this.material({ color: 0xd8c8b0, roughness: 0.8 });
    const canvases = [0xff6fb4, 0x3fd8d0, 0xf4f0e8, 0xffd060].map((c) =>
      this.material({ color: c, roughness: 0.9 }),
    );
    for (let offset = 0; offset < LOOP; offset += 9 + random() * 6) {
      const shrub = new Group();
      for (let i = 0; i < 4; i++) {
        const m = new Mesh(leaf, greens[i % greens.length]!);
        const r = 0.8 + random() * 0.9;
        m.scale.set(r * 1.3, r, r);
        m.position.set((random() - 0.5) * 2.2, -0.6 + r * 0.7, (random() - 0.5) * 3);
        m.castShadow = true;
        shrub.add(m);
      }
      const holder = new Group();
      holder.add(shrub);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 7.2 - random() * 1.5 });
    }
    // Coconut palms on the dune, leaning out over the sand towards the sea as beach palms do.
    const palms = new Palms(this.disposables, this.track);
    for (let offset = 8; offset < LOOP; offset += 22 + random() * 18) {
      const palm = palms.make(random);
      palm.scale.multiplyScalar(1.25);
      palm.rotation.z = 0.18 + random() * 0.2;
      const holder = new Group();
      holder.add(palm);
      holder.position.y = -0.45;
      const outer = new Group();
      outer.add(holder);
      this.group.add(outer);
      this.props.push({ mesh: outer, offset, x: -roadHalf - 9 - random() * 3 });
    }
    for (let row = 0; row < 4; row++) {
      const stand = new Group();
      for (let i = 0; i < 6; i++) {
        const p = new Mesh(pole, wood);
        const f = new Mesh(furled, canvases[(row + i) % canvases.length]!);
        for (const m of [p, f]) {
          m.position.set(0, 0, i * 3.2);
          stand.add(m);
        }
        const lounger = new Mesh(this.unit, wood);
        lounger.scale.set(0.7, 0.5, 1.9);
        lounger.position.set(1.2, 0.25, i * 3.2);
        stand.add(lounger);
      }
      stand.position.y = -0.95;
      const holder = new Group();
      holder.add(stand);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: 55 + row * 100, x: -roadHalf - 19 });
    }
  }

  /**
   * Festoons of party bulbs strung across the boulevard every 36 m from the promenade palms to
   * the hotel side, sagging over the road, warm white with pink and cyan between.
   */
  private addFestoons(roadHalf: number): void {
    const span = roadHalf * 2 + 4.6;
    const parts: BufferGeometry[] = [];
    const wire: BufferGeometry[] = [];
    const colour = new Color();
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      const x = -span / 2 + u * span;
      const y = 7 - 1.4 * (1 - (2 * u - 1) ** 2);
      const bulb = new SphereGeometry(0.09, 6, 4);
      bulb.translate(x, y - 0.12, 0);
      colour.set(i % 3 === 0 ? 0xff5fc0 : i % 3 === 1 ? 0xffe0a0 : 0x5fe8ff);
      const tint = new Float32Array(bulb.getAttribute('position').count * 3);
      for (let v = 0; v < tint.length; v += 3) colour.toArray(tint, v);
      bulb.setAttribute('color', new BufferAttribute(tint, 3));
      parts.push(bulb);
      if (i < 30) {
        const nx = -span / 2 + ((i + 1) / 30) * span;
        const ny = 7 - 1.4 * (1 - (2 * ((i + 1) / 30) - 1) ** 2);
        const seg = new BoxGeometry(Math.hypot(nx - x, ny - y), 0.02, 0.02);
        seg.rotateZ(Math.atan2(ny - y, nx - x));
        seg.translate((x + nx) / 2, (y + ny) / 2, 0);
        wire.push(seg);
      }
    }
    const bulbs = mergeGeometries(parts)!;
    const line = mergeGeometries(wire)!;
    [...parts, ...wire].forEach((g) => g.dispose());
    this.disposables.push(bulbs, line);
    const lit = new MeshBasicMaterial({ vertexColors: true });
    const dark = this.material({ color: 0x18181c, roughness: 0.8 });
    this.disposables.push(lit);
    for (let offset = 20; offset < LOOP; offset += 36) {
      if (inCrossing(offset, 3)) continue;
      const festoon = new Group();
      festoon.add(new Mesh(bulbs, lit), new Mesh(line, dark));
      const glow = new Mesh(this.flat, this.halo);
      glow.scale.set(span * 1.05, 2.4, 1);
      glow.position.y = 6.2;
      (glow.material as MeshBasicMaterial).opacity = 1;
      festoon.add(glow);
      festoon.position.x = (roadHalf + 2 - (roadHalf + 2.6)) / 2;
      const holder = new Group();
      holder.add(festoon);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: 0 });
    }
  }

  /**
   * Trolley stops on the hotel side: a shelter of glass under a curved roof, a bench, a lit
   * advertising panel at its end showing a sunset poster, and the stop's sign on a post.
   */
  private addShelters(roadHalf: number): void {
    const frame = this.material({ color: 0xe8e8ec, roughness: 0.3, metalness: 0.6 });
    const pane = this.material({
      color: 0x9ab0d0,
      roughness: 0.05,
      metalness: 0.3,
      transparent: true,
      opacity: 0.25,
    });
    const poster = this.material({
      map: this.track(posterTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(posterTexture()),
      emissiveIntensity: 1.6,
    });
    const stop = this.material({
      map: this.track(neonWordTexture('TROLLEY', '#ffd23f')),
      emissive: 0xffffff,
      emissiveMap: this.track(neonWordTexture('TROLLEY', '#ffd23f')),
      emissiveIntensity: 1.2,
    });
    for (const offset of [34, 175, 330]) {
      const b = new BoxBuilder();
      b.box(frame, [1.9, 0.12, 4.2], [0.5, 2.6, 0]);
      for (const z of [-2, 2]) b.box(frame, [0.08, 2.6, 0.08], [1.35, 1.3, z]);
      b.box(frame, [0.4, 0.05, 3.4], [1.1, 0.48, 0]);
      b.box(pane, [0.03, 2.2, 4], [1.42, 1.3, 0]);
      b.box(pane, [1.5, 2.2, 0.03], [0.7, 1.3, -2.02]);
      b.box(frame, [0.06, 2.6, 0.06], [-0.8, 1.3, 3.2]);
      const shelter = b.build(this.disposables);
      const ad = new Mesh(this.unit, poster);
      ad.scale.set(1.3, 1.9, 0.12);
      ad.position.set(0.7, 1.3, 2.05);
      const sign = new Mesh(this.flat, stop);
      sign.scale.set(1.2, 0.3, 1);
      sign.position.set(-0.8, 2.75, 3.2);
      shelter.add(ad, sign);
      shelter.position.y = 0.15;
      const holder = new Group();
      holder.add(shelter);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 0.9 });
    }
  }

  /**
   * The Ocean Drive gateway spanning the boulevard once a loop: two stepped deco pylons on the
   * sidewalks, ringed with neon, carrying a sign beam that spells OCEAN DRIVE in pink and cyan
   * neon, a sunburst crest above it.
   */
  private addGateway(roadHalf: number): void {
    const span = roadHalf * 2 + 7;
    const stucco = this.material({ color: 0xf4e8e0, roughness: 0.7 });
    const pink = this.material({ color: 0xff3fb4, emissive: 0xff3fb4, emissiveIntensity: 2.6 });
    const cyan = this.material({ color: 0x2fe6ff, emissive: 0x2fe6ff, emissiveIntensity: 2.6 });
    const board = this.material({
      map: this.track(gatewayTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(gatewayTexture()),
      emissiveIntensity: 2.2,
    });
    this.signs.push(board);
    const gate = new Group();
    const b = new BoxBuilder();
    for (const side of [-1, 1]) {
      const x = (side * span) / 2;
      b.box(stucco, [1.6, 9, 1.6], [x, 4.5, 0]);
      b.box(stucco, [1.2, 1.6, 1.2], [x, 9.8, 0]);
      b.box(stucco, [0.7, 1.4, 0.7], [x, 11.3, 0]);
      for (const y of [3, 5, 7]) b.box(side < 0 ? pink : cyan, [1.7, 0.12, 1.7], [x, y, 0]);
      b.box(side < 0 ? cyan : pink, [0.2, 2, 0.2], [x, 13, 0]);
    }
    b.box(stucco, [span, 0.35, 0.8], [0, 7.4, 0]);
    b.box(stucco, [span, 0.35, 0.8], [0, 9.6, 0]);
    b.box(pink, [span, 0.08, 0.86], [0, 7.2, 0]);
    b.box(cyan, [span, 0.08, 0.86], [0, 9.8, 0]);
    gate.add(b.build(this.disposables));
    for (const turn of [0, Math.PI]) {
      const face = new Mesh(this.flat, board);
      face.rotation.y = turn;
      face.scale.set(span * 0.82, 1.9, 1);
      face.position.set(0, 8.5, turn ? -0.25 : 0.25);
      gate.add(face);
    }
    for (let r = 0; r < 9; r++) {
      const a = -Math.PI / 2 + (r / 8) * Math.PI;
      const ray = new Mesh(this.unit, r % 2 ? pink : cyan);
      ray.scale.set(0.12, 2.2, 0.12);
      ray.rotation.z = -a;
      ray.position.set(Math.sin(a) * 1.6, 10.2 + Math.cos(a) * 1.6, 0);
      gate.add(ray);
    }
    // Rows of marquee bulbs along both beams and up the pylons' faces, chasing in threes.
    const bulbOn = this.material({ color: 0xfff0c8, emissive: 0xffe0a0, emissiveIntensity: 4 });
    const chasers: Mesh[][] = [[], [], []];
    let n = 0;
    for (const y of [7.62, 9.38])
      for (let x = -span / 2 + 0.8; x <= span / 2 - 0.8; x += 0.45, n++) {
        const bulb = new Mesh(this.unit, bulbOn);
        bulb.scale.setScalar(0.26);
        bulb.position.set(x, y, 0.42);
        gate.add(bulb);
        chasers[n % 3]!.push(bulb);
      }
    for (const side of [-1, 1])
      for (let y = 0.6; y < 9; y += 0.45, n++) {
        const bulb = new Mesh(this.unit, bulbOn);
        bulb.scale.setScalar(0.26);
        bulb.position.set((side * span) / 2 - side * 0.5, y, 0.82);
        gate.add(bulb);
        chasers[n % 3]!.push(bulb);
      }
    this.gateBulbs = chasers;
    const glow = new Mesh(this.flat, this.halo);
    glow.scale.set(span * 1.1, 6, 1);
    glow.position.set(0, 8.5, 0.4);
    gate.add(glow);
    // Ahead of the gateway the boulevard's rainbow crossing, as Ocean Drive paints them: bars in
    // the six colours across the road, worn by the traffic.
    const rainbow = this.material({
      map: this.track(rainbowTexture()),
      transparent: true,
      roughness: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const crossing = new Mesh(this.flat, rainbow);
    crossing.rotation.x = -Math.PI / 2;
    crossing.scale.set(roadHalf * 2 - 0.4, 4, 1);
    crossing.position.y = 0.025;
    crossing.renderOrder = 1;
    const crossingHolder = new Group();
    crossingHolder.add(crossing);
    this.group.add(crossingHolder);
    this.props.push({ mesh: crossingHolder, offset: 47, x: 0 });
    gate.position.x = 0.4;
    const holder = new Group();
    holder.add(gate);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 62, x: 0 });
  }

  /**
   * Collins Avenue's towers behind the deco row: taller hotels and condos a block back,
   * their floors lit in rows, a coloured crown light on each, rising over the deco roofs.
   */
  private addCollins(roadHalf: number): void {
    const random = seeded(8351);
    const glass = [0, 1, 2].map((v) =>
      this.material({
        map: this.track(towerTexture(8351 + v)),
        emissive: 0xffffff,
        emissiveMap: this.track(towerTexture(8351 + v)),
        emissiveIntensity: 1,
        roughness: 0.5,
        metalness: 0.3,
      }),
    );
    const tops = NEON.map((c) => this.material({ color: c, emissive: c, emissiveIntensity: 2.2 }));
    for (let offset = 0; offset < LOOP; offset += 34 + random() * 16) {
      const h = 50 + random() * 45;
      const w = 18 + random() * 16;
      const d = 16 + random() * 10;
      const tower = new Group();
      const body = new Mesh(this.unit, glass[Math.floor(random() * 3)]!);
      body.scale.set(d, h, w);
      body.position.y = h / 2;
      const crown = new Mesh(this.unit, tops[Math.floor(random() * tops.length)]!);
      crown.scale.set(d * 1.02, 1.2, w * 1.02);
      crown.position.y = h - 1.5;
      tower.add(body, crown);
      const holder = new Group();
      holder.add(tower);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + FRONT + 34 + random() * 12 });
    }
  }

  /**
   * Steam rising from manholes in the warm wet night: at three covers on the road, soft puffs
   * well up, drift with the breeze, swell and fade, lit pink and blue by the neon.
   */
  private addSteam(): void {
    const puff = new MeshBasicMaterial({
      map: this.track(steamTexture()),
      color: 0xe8d8f0,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.disposables.push(puff);
    for (const [offset, x] of [
      [60, -1.9],
      [150, -1.6],
      [262, 0.8],
    ] as const) {
      const vent = new Group();
      const puffs: Mesh[] = [];
      for (let i = 0; i < 7; i++) {
        const m = new Mesh(this.flat, puff);
        m.renderOrder = 3;
        vent.add(m);
        puffs.push(m);
      }
      const holder = new Group();
      holder.add(vent);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
      this.vents.push(puffs);
    }
  }

  /**
   * Yachts riding at anchor offshore, lengthwise to the beach, their decks lit and a
   * white anchor light at each masthead, slowly passed as the rider rolls along.
   */
  private addYachts(roadHalf: number): void {
    const random = seeded(8371);
    const yachts = new Yachts(this.disposables, [0xf8f8f4, 0x1a1e2a, 0xe8e4dc, 0x2a3a5a]);
    const deckLight = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      color: 0xffe0b0,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.disposables.push(deckLight);
    for (let k = 0; k < 6; k++) {
      const length = 22 + random() * 26;
      const yacht = yachts.make(k, length, random);
      yacht.rotation.y = (random() - 0.5) * 0.4;
      const holder = new Group();
      holder.add(yacht);
      for (let i = 0; i < 4; i++) {
        const lamp = new Mesh(this.flat, deckLight);
        lamp.scale.set(3, 3, 1);
        lamp.position.set(0, 3 + (i % 2) * 2.4, (i - 1.5) * length * 0.22);
        holder.add(lamp);
      }
      const anchor = new Mesh(this.flat, this.halo);
      anchor.scale.set(2, 2, 1);
      anchor.position.y = 9 + length * 0.1;
      holder.add(anchor);
      holder.position.y = -SEA - 0.1;
      const outer = new Group();
      outer.add(holder);
      this.group.add(outer);
      this.props.push({
        mesh: outer,
        offset: 30 + k * 66 + random() * 20,
        x: -roadHalf - 70 - random() * 90,
      });
    }
  }

  /**
   * Bike-share docks on the promenade: a lit payment kiosk and a row of blue bikes nose-in to
   * a docking rail, each bike two spoked wheels, a step-through frame, a basket and a saddle.
   */
  private addBikeDocks(roadHalf: number): void {
    const bike = this.bikeGeometry();
    const blue = this.material({ color: 0x2a6ad8, roughness: 0.4, metalness: 0.3 });
    const steel = this.material({ color: 0x8a8e98, roughness: 0.4, metalness: 0.8 });
    const screen = this.material({ color: 0x80d0ff, emissive: 0x60c0ff, emissiveIntensity: 1.6 });
    for (const offset of [46, 190, 318]) {
      const dock = new Group();
      const rail = new Mesh(this.unit, steel);
      rail.scale.set(0.12, 0.6, 9);
      rail.position.set(0.9, 0.3, 0);
      const kiosk = new Mesh(this.unit, blue);
      kiosk.scale.set(0.5, 1.9, 0.6);
      kiosk.position.set(0.9, 0.95, 5.2);
      const panel = new Mesh(this.unit, screen);
      panel.scale.set(0.52, 0.5, 0.4);
      panel.position.set(0.9, 1.4, 5.2);
      dock.add(rail, kiosk, panel);
      for (let i = 0; i < 9; i++) {
        if (i === 3 || i === 7) continue;
        const b = new Mesh(bike, blue);
        b.rotation.y = Math.PI / 2;
        b.position.set(0.1, 0, -4 + i * 1);
        b.castShadow = true;
        dock.add(b);
      }
      dock.position.y = 0.15;
      const holder = new Group();
      holder.add(dock);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 1.6 });
    }
  }

  /**
   * A fishing pier running out to sea from the beach once a loop: a concrete deck on piles
   * 160 m long, railed both sides, lamps every 12 m throwing pools on it and their glow on the
   * water, and a lit shelter at its head.
   */
  private addPier(roadHalf: number): void {
    const length = 160;
    const concrete = this.material({ color: 0xb8b0b8, roughness: 0.8 });
    const rail = this.material({ color: 0xe8e8ec, roughness: 0.4, metalness: 0.5 });
    const b = new BoxBuilder();
    b.box(concrete, [length, 0.5, 6], [-length / 2, 1.2, 0]);
    for (let x = -4; x > -length; x -= 8) {
      for (const z of [-2.6, 2.6]) b.box(concrete, [0.6, 4, 0.6], [x, -0.8, z]);
    }
    for (const z of [-2.95, 2.95]) {
      b.box(rail, [length, 0.08, 0.08], [-length / 2, 2.45, z]);
      b.box(rail, [length, 0.06, 0.06], [-length / 2, 1.95, z]);
      for (let x = 0; x > -length; x -= 3) b.box(rail, [0.06, 1.0, 0.06], [x, 1.95, z]);
    }
    b.box(concrete, [8, 0.3, 9], [-length - 2, 4.8, 0]);
    for (const [x, z] of [
      [-length + 1, -4],
      [-length + 1, 4],
      [-length - 5, -4],
      [-length - 5, 4],
    ] as const)
      b.box(rail, [0.2, 3.4, 0.2], [x, 3.1, z]);
    b.box(concrete, [8, 0.5, 9], [-length - 2, 1.2, 0]);
    const pier = b.build(this.disposables);
    const globe = this.material({ color: 0xfff0d0, emissive: 0xffe0b0, emissiveIntensity: 3.2 });
    for (let x = -6; x > -length; x -= 12)
      for (const z of [-2.9, 2.9]) {
        const lamp = new Mesh(this.unit, globe);
        lamp.scale.set(0.3, 0.3, 0.3);
        lamp.position.set(x, 4.2, z);
        const post = new Mesh(this.unit, rail);
        post.scale.set(0.1, 2.8, 0.1);
        post.position.set(x, 2.8, z);
        const halo = new Mesh(this.flat, this.halo);
        halo.scale.set(3.5, 3.5, 1);
        halo.position.set(x, 4.2, z);
        const shine = new Mesh(this.flat, this.halo);
        shine.rotation.x = -Math.PI / 2;
        shine.scale.set(2.5, 9, 1);
        shine.position.set(x, -0.15, z * 2.4);
        pier.add(lamp, post, halo, shine);
      }
    pier.position.set(-BEACH + 4, -SEA - 0.3, 0);
    const holder = new Group();
    holder.add(pier);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 175, x: -roadHalf - 6 });
  }

  /**
   * Street vendors on the promenade: a cart with a striped umbrella, a lit menu board, a
   * cool-box of drinks and a string of bulbs round its canopy, a vendor behind it and two
   * customers waiting.
   */
  private addCarts(roadHalf: number): void {
    const body = this.material({ color: 0xf4f0e8, roughness: 0.5, metalness: 0.2 });
    const steel = this.material({ color: 0xa8acb4, roughness: 0.3, metalness: 0.9 });
    const menu = this.material({
      map: this.track(menuTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(menuTexture()),
      emissiveIntensity: 1.4,
    });
    const canopy = this.material({
      map: this.track(awningTexture(0xff6a3f)),
      roughness: 0.8,
      side: DoubleSide,
    });
    const shade = new ConeGeometry(1.7, 0.7, 12, 1, true);
    shade.translate(0, 2.7, 0);
    this.disposables.push(shade);
    const bulb = this.material({ color: 0xffe8b0, emissive: 0xffd890, emissiveIntensity: 3 });
    for (const offset of [42, 232]) {
      const cart = new Group();
      const b = new BoxBuilder();
      b.box(body, [1, 0.9, 1.9], [0, 0.85, 0]);
      b.box(steel, [1.05, 0.06, 1.95], [0, 1.32, 0]);
      b.box(steel, [0.05, 2.1, 0.05], [0, 1.35, 0]);
      for (const z of [-0.7, 0.7]) b.box(steel, [0.5, 0.5, 0.06], [0, 0.25, z]);
      b.box(body, [0.6, 0.5, 0.5], [0.85, 0.25, 0.4]);
      cart.add(b.build(this.disposables));
      const board = new Mesh(this.flat, menu);
      board.scale.set(1.6, 0.75, 1);
      board.position.set(0, 1.85, 0.97);
      const umbrella = new Mesh(shade, canopy);
      cart.add(board, umbrella);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const light = new Mesh(this.unit, bulb);
        light.scale.setScalar(0.08);
        light.position.set(Math.cos(a) * 1.65, 2.37, Math.sin(a) * 1.65);
        cart.add(light);
      }
      const glow = new Mesh(this.flat, this.halo);
      glow.scale.set(4, 3, 1);
      glow.position.set(0, 2, 1.2);
      cart.add(glow);
      cart.position.y = 0.15;
      const holder = new Group();
      holder.add(cart);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 3.3 });
      this.carts.push(offset);
    }
  }

  /**
   * Yellow cabs waiting at the clubs' doors: a closed sedan with a dark glasshouse, a lit TAXI
   * sign on its roof, a chequered band along its flank and hazard lights blinking, and a valet
   * podium with its lamp by the kerb.
   */
  private addTaxis(roadHalf: number): void {
    const yellow = this.material({ color: 0xf4c020, roughness: 0.3, metalness: 0.4 });
    const glass = this.material({ color: 0x141a24, roughness: 0.05, metalness: 0.8 });
    const tyre = this.material({ color: 0x18181c, roughness: 0.85 });
    const checks = this.material({ map: this.track(checkerTexture()), roughness: 0.4 });
    const roofSign = this.material({
      map: this.track(neonWordTexture('TAXI', '#ffe060')),
      emissive: 0xffffff,
      emissiveMap: this.track(neonWordTexture('TAXI', '#ffe060')),
      emissiveIntensity: 1.6,
    });
    const hazard = this.material({ color: 0xffa020, emissive: 0xffa020, emissiveIntensity: 3 });
    const podium = this.material({ color: 0x2a1a20, roughness: 0.5 });
    const wheel = new CylinderGeometry(0.34, 0.34, 0.24, 14);
    wheel.rotateZ(Math.PI / 2);
    this.disposables.push(wheel);
    for (const club of this.clubs) {
      const taxi = new Group();
      const b = new BoxBuilder();
      b.box(yellow, [1.85, 0.6, 4.7], [0, 0.65, 0]);
      b.box(glass, [1.6, 0.5, 2.3], [0, 1.2, 0.2]);
      b.box(yellow, [1.62, 0.08, 2.1], [0, 1.48, 0.2]);
      b.box(checks, [1.87, 0.14, 2.8], [0, 0.72, 0.1]);
      taxi.add(b.build(this.disposables));
      const sign = new Mesh(this.unit, roofSign);
      sign.scale.set(0.9, 0.28, 0.3);
      sign.position.set(0, 1.66, 0.2);
      taxi.add(sign);
      for (const x of [-0.75, 0.75])
        for (const z of [-2.36, 2.36]) {
          const light = new Mesh(this.unit, hazard);
          light.scale.set(0.25, 0.1, 0.04);
          light.position.set(x, 0.78, z);
          taxi.add(light);
          this.hazards.push(light);
          const w = new Mesh(wheel, tyre);
          w.position.set(x * 1.27, 0.34, z * 0.62);
          taxi.add(w);
        }
      const stand = new Mesh(this.unit, podium);
      stand.scale.set(0.6, 1.15, 0.5);
      stand.position.set(3.2, 0.72, -2);
      const lamp = new Mesh(this.flat, this.halo);
      lamp.scale.set(1.4, 1.4, 1);
      lamp.position.set(3.2, 1.45, -1.7);
      taxi.add(stand, lamp);
      const holder = new Group();
      holder.add(taxi);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset: club + 7, x: roadHalf - 1.1 });
      this.standers.push({
        offset: club + 5,
        x: roadHalf + 2.4,
        heading: -Math.PI / 2,
        phase: 4,
        scale: 1,
      });
    }
  }

  /**
   * Words painted on the road, stretched along it so they read from a rider's low eye: OCEAN
   * DR at the start of each block, SLOW before the crossings and the bike lane's own word.
   */
  private addRoadPaint(): void {
    const plane = new PlaneGeometry(2.6, 7);
    this.disposables.push(plane);
    for (const [text, colour, offset, x] of [
      ['OCEAN DR', '#f4f0e4', 52, 1.6],
      ['SLOW', '#f4f0e4', CROSSINGS[0] - 18, 1.6],
      ['BIKE', '#f4f0e4', 44, -2.55],
      ['OCEAN DR', '#f4f0e4', 210, 1.6],
      ['SLOW', '#f4f0e4', CROSSINGS[1] - 18, 1.6],
    ] as const) {
      const material = new MeshStandardMaterial({
        map: this.track(paintTexture(text, colour)),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        roughness: 0.4,
      });
      this.disposables.push(material);
      const mesh = new Mesh(plane, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02;
      mesh.receiveShadow = true;
      if (text === 'BIKE') mesh.scale.set(0.45, 0.7, 1);
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    }
  }

  /**
   * Beach bars on the sand: a thatched hut on poles over a lit bar, a ring of tiki torches
   * whose flames flicker, and a few drinkers at the counter.
   */
  private addTikiBars(roadHalf: number): void {
    const thatch = this.material({ map: this.track(thatchTexture()), roughness: 1 });
    const bamboo = this.material({ color: 0x8a6a3a, roughness: 0.8 });
    const bar = this.material({
      color: 0x6a4a2a,
      roughness: 0.7,
      emissive: 0x402010,
      emissiveIntensity: 0.6,
    });
    const flameMaterial = this.material({
      color: 0xffa030,
      emissive: 0xff7a10,
      emissiveIntensity: 4,
    });
    const roof = new ConeGeometry(4.2, 2.2, 10);
    const flameGeometry = new ConeGeometry(0.12, 0.45, 6);
    this.disposables.push(roof, flameGeometry);
    for (const offset of [64, 268]) {
      const hut = new Group();
      const b = new BoxBuilder();
      for (const [x, z] of [
        [-2.2, -2.2],
        [2.2, -2.2],
        [-2.2, 2.2],
        [2.2, 2.2],
      ] as const)
        b.box(bamboo, [0.18, 3, 0.18], [x, 1.5, z]);
      b.box(bar, [1, 1.1, 4], [1.8, 0.55, 0]);
      b.box(bar, [1.3, 0.1, 4.2], [1.8, 1.15, 0]);
      hut.add(b.build(this.disposables));
      const top = new Mesh(roof, thatch);
      top.position.y = 4;
      top.castShadow = true;
      hut.add(top);
      const glow = new Mesh(this.flat, this.halo);
      glow.scale.set(6, 3, 1);
      glow.position.set(2, 2, 0);
      hut.add(glow);
      for (let t = 0; t < 6; t++) {
        const a = (t / 6) * Math.PI * 2;
        const x = Math.cos(a) * 6;
        const z = Math.sin(a) * 6;
        const pole = new Mesh(this.unit, bamboo);
        pole.scale.set(0.08, 2.6, 0.08);
        pole.position.set(x, 1.3, z);
        const flame = new Mesh(flameGeometry, flameMaterial);
        flame.position.set(x, 2.85, z);
        const halo = new Mesh(this.flat, this.halo);
        halo.scale.set(1.6, 1.6, 1);
        halo.position.set(x, 2.85, z);
        hut.add(pole, flame, halo);
        this.flames.push(flame);
      }
      hut.position.y = -0.95;
      const holder = new Group();
      holder.add(hut);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 15 });
      for (let i = 0; i < 3; i++)
        this.standers.push({
          offset: offset - 1.2 + i * 1.2,
          x: -roadHalf - 15 + 3.0,
          heading: -Math.PI / 2,
          phase: i,
          scale: 0.95,
          seat: 0.95,
        });
    }
  }

  /**
   * Puddles left by the shower on the promenade and the sidewalk: dark mirror-smooth pools
   * with ragged edges, the sky's violet and the neon's colours caught in them.
   */
  private addPuddles(roadHalf: number): void {
    const random = seeded(8451);
    const maps = [0, 1, 2].map((v) => this.track(puddleTexture(8451 + v)));
    const materials = maps.map(
      (map) =>
        new MeshStandardMaterial({
          map,
          transparent: true,
          roughness: 0.02,
          metalness: 0.6,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          emissive: 0xffffff,
          emissiveMap: map,
          emissiveIntensity: 0.35,
        }),
    );
    this.disposables.push(...materials);
    const spots: [number, number, number][] = [
      [31, -roadHalf - 2.4, 3.4],
      [36, roadHalf + 3.6, 3],
    ];
    for (const [offset, x, size] of spots) {
      const mesh = new Mesh(this.flat, materials[0]!);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.set(size * 0.7, size, 1);
      mesh.position.y = 0.155;
      mesh.renderOrder = 1;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x });
    }
    for (let offset = 2; offset < LOOP; offset += 5 + random() * 7) {
      const left = random() < 0.55;
      const mesh = new Mesh(this.flat, materials[Math.floor(random() * 3)]!);
      mesh.rotation.x = -Math.PI / 2;
      const size = 1.2 + random() * 2.4;
      mesh.scale.set(size * (0.5 + random() * 0.5), size, 1);
      mesh.position.y = 0.155;
      mesh.renderOrder = 1;
      const holder = new Group();
      holder.add(mesh);
      this.group.add(holder);
      const x = left ? -roadHalf - 0.8 - random() * 3.4 : roadHalf + 1 + random() * 6.5;
      this.props.push({ mesh: holder, offset, x });
    }
  }

  /**
   * Rows of retro scooters parked at an angle on the promenade by the kerb, in mint,
   * cream, coral and sky blue, chrome mirrors up and a red rear lamp each.
   */
  private addScooters(roadHalf: number): void {
    const parts: BufferGeometry[] = [];
    const add = (g: BufferGeometry, x: number, y: number, z: number) => {
      g.translate(x, y, z);
      parts.push(g);
    };
    for (const z of [-0.6, 0.6]) {
      const w = new TorusGeometry(0.2, 0.06, 6, 14);
      w.rotateY(Math.PI / 2);
      add(w, 0, 0.26, z);
    }
    add(new BoxGeometry(0.4, 0.42, 0.75), 0, 0.5, 0.35);
    add(new BoxGeometry(0.28, 0.12, 0.6), 0, 0.78, 0.35);
    add(new BoxGeometry(0.3, 0.7, 0.12), 0, 0.62, -0.5);
    add(new BoxGeometry(0.12, 0.1, 0.5), 0, 0.3, -0.05);
    add(new BoxGeometry(0.62, 0.05, 0.05), 0, 1.05, -0.55);
    const body = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    this.disposables.push(body);
    const paints = [0x9ae8c8, 0xf4ecd8, 0xff8a7a, 0x8ac8f0].map((c) =>
      this.material({ color: c, roughness: 0.25, metalness: 0.3 }),
    );
    const lamp = this.material({ color: 0xff2030, emissive: 0xff2030, emissiveIntensity: 2.5 });
    for (const offset of [38, 166, 304]) {
      const row = new Group();
      for (let i = 0; i < 5; i++) {
        const scooter = new Mesh(body, paints[(i + offset) % paints.length]!);
        scooter.castShadow = true;
        scooter.rotation.y = 0.6;
        scooter.position.set(0, 0, i * 1.1);
        const rear = new Mesh(this.unit, lamp);
        rear.scale.set(0.12, 0.06, 0.04);
        rear.position.set(0, 0.6, 0.74);
        scooter.add(rear);
        row.add(scooter);
      }
      row.position.y = 0.15;
      const holder = new Group();
      holder.add(row);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 1.2 });
    }
  }

  /**
   * A police cruiser nosed out of the first side street to the boulevard, its light bar going: black and white, POLICE on
   * its doors, red and blue lamps flashing in turn and washing the wet road and the sidewalk
   * round it in their colours.
   */
  private addPatrol(roadHalf: number): void {
    const black = this.material({ color: 0x101014, roughness: 0.25, metalness: 0.5 });
    const white = this.material({
      map: this.track(policeDoorTexture()),
      roughness: 0.3,
      metalness: 0.3,
    });
    const glass = this.material({ color: 0x141a24, roughness: 0.05, metalness: 0.8 });
    const tyre = this.material({ color: 0x18181c, roughness: 0.85 });
    const red = this.material({ color: 0xff1020, emissive: 0xff1020, emissiveIntensity: 5 });
    const blue = this.material({ color: 0x2040ff, emissive: 0x2040ff, emissiveIntensity: 5 });
    const car = new Group();
    const b = new BoxBuilder();
    b.box(black, [1.9, 0.55, 1.4], [0, 0.65, -1.7]);
    b.box(black, [1.9, 0.55, 1.2], [0, 0.65, 1.85]);
    b.box(white, [1.92, 0.6, 2.3], [0, 0.66, 0.1]);
    b.box(glass, [1.65, 0.5, 2.3], [0, 1.2, 0.2]);
    b.box(white, [1.66, 0.08, 2.1], [0, 1.48, 0.2]);
    car.add(b.build(this.disposables));
    const wheel = new CylinderGeometry(0.34, 0.34, 0.24, 14);
    wheel.rotateZ(Math.PI / 2);
    this.disposables.push(wheel);
    for (const x of [-0.95, 0.95])
      for (const z of [-1.45, 1.45]) {
        const w = new Mesh(wheel, tyre);
        w.position.set(x, 0.34, z);
        car.add(w);
      }
    const washes: Mesh[] = [];
    for (const [x, m, c] of [
      [-0.4, red, 0xff1030],
      [0.4, blue, 0x2050ff],
    ] as const) {
      const lamp = new Mesh(this.unit, m);
      lamp.scale.set(0.7, 0.14, 0.3);
      lamp.position.set(x, 1.6, 0.2);
      const glow = new Mesh(
        this.flat,
        new MeshBasicMaterial({
          map: this.track(poolTexture()),
          color: c,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.scale.set(14, 14, 1);
      glow.position.set(x * 6, 0.05, 0);
      glow.renderOrder = 1;
      const flare = new Mesh(this.flat, this.halo);
      flare.scale.set(2.4, 2.4, 1);
      flare.position.set(x, 1.6, 0.6);
      car.add(lamp, glow, flare);
      washes.push(lamp, glow, flare);
      this.disposables.push(glow.material as MeshBasicMaterial);
    }
    this.patrol = washes;
    const holder = new Group();
    holder.add(car);
    this.group.add(holder);
    car.rotation.y = Math.PI / 2 + 0.15;
    this.props.push({ mesh: holder, offset: CROSSINGS[0] + 2, x: roadHalf + 5 });
  }

  /** A step-through town bike, its wheels in the y-z plane and its front towards -z. */
  private bikeGeometry(): BufferGeometry {
    const parts: BufferGeometry[] = [];
    for (const z of [-0.55, 0.55]) {
      const w = new TorusGeometry(0.33, 0.03, 6, 18);
      w.rotateY(Math.PI / 2);
      w.translate(0, 0.36, z);
      parts.push(w);
    }
    const bar = (l: number, x: number, y: number, z: number, tilt: number) => {
      const b = new BoxGeometry(0.05, l, 0.05);
      b.rotateX(tilt);
      b.translate(x, y, z);
      parts.push(b);
    };
    bar(0.9, 0, 0.55, 0.05, 0.9);
    bar(0.6, 0, 0.62, 0.45, -0.25);
    bar(0.55, 0, 0.85, -0.45, 0.3);
    const basket = new BoxGeometry(0.4, 0.25, 0.3);
    basket.translate(0, 0.95, -0.7);
    const saddle = new BoxGeometry(0.16, 0.06, 0.26);
    saddle.translate(0, 0.98, 0.42);
    const bars = new BoxGeometry(0.55, 0.04, 0.04);
    bars.translate(0, 1.12, -0.5);
    parts.push(basket, saddle, bars);
    const bike = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    this.disposables.push(bike);
    return bike;
  }

  /**
   * Cyclists out for the evening, riding the bike lane towards the rider on town bikes, an
   * upright posture and a lamp glowing on each handlebar.
   */
  private addCyclists(roadHalf: number): void {
    const bike = this.bikeGeometry();
    const paints = [0xf4f0e8, 0x2fc8b0, 0xff8fb0, 0x1d1f24].map((c) =>
      this.material({ color: c, roughness: 0.4, metalness: 0.3 }),
    );
    const lamp = this.material({ color: 0xfff4d8, emissive: 0xfff4d8, emissiveIntensity: 3 });
    const random = seeded(8481);
    for (let k = 0; k < 4; k++) {
      const ride = new Group();
      const frame = new Mesh(bike, paints[k]!);
      frame.castShadow = true;
      const light = new Mesh(this.unit, lamp);
      light.scale.set(0.12, 0.12, 0.08);
      light.position.set(0, 1.02, -0.72);
      const flare = new Mesh(this.flat, this.halo);
      flare.scale.set(1.2, 1.2, 1);
      flare.position.set(0, 1.02, -0.8);
      flare.rotation.y = Math.PI;
      ride.add(frame, light, flare);
      ride.rotation.y = Math.PI;
      this.group.add(ride);
      this.cyclists.push({
        mesh: ride,
        offset: 30 + k * 95 + random() * 30,
        speed: 4.5 + random() * 1.5,
        x: -roadHalf + 0.95,
      });
    }
    this.riders = new Figures(this.group, this.disposables, this.cyclists.length, NIGHT_WEAR, 8483);
  }

  /**
   * A DJ on the promenade: a booth under a light truss, speaker stacks either side, a ring of
   * coloured par lamps, and a knot of dancers in front of it with their arms up.
   */
  private addBeachParty(roadHalf: number): void {
    const black = this.material({ color: 0x141418, roughness: 0.6 });
    const steel = this.material({ color: 0xa8acb4, roughness: 0.3, metalness: 0.9 });
    const front = this.material({
      map: this.track(neonWordTexture('MIAMI NIGHTS', '#2fe6ff')),
      emissive: 0xffffff,
      emissiveMap: this.track(neonWordTexture('MIAMI NIGHTS', '#2fe6ff')),
      emissiveIntensity: 1.6,
    });
    const booth = new Group();
    const b = new BoxBuilder();
    b.box(black, [1.6, 1.1, 2.6], [0, 0.55, 0]);
    for (const z of [-2.2, 2.2]) {
      b.box(black, [0.9, 1.6, 0.9], [0, 0.8, z]);
      b.box(steel, [0.12, 3.4, 0.12], [0.6, 1.7, z * 1.15]);
    }
    b.box(steel, [0.12, 0.12, 5.2], [0.6, 3.4, 0]);
    booth.add(b.build(this.disposables));
    const sign = new Mesh(this.unit, front);
    sign.scale.set(0.05, 0.6, 2.4);
    sign.position.set(0.82, 0.7, 0);
    booth.add(sign);
    for (let i = 0; i < 6; i++) {
      const c = NEON[i % NEON.length]!;
      const par = new Mesh(
        this.unit,
        this.material({ color: c, emissive: c, emissiveIntensity: 4 }),
      );
      par.scale.setScalar(0.25);
      par.position.set(0.6, 3.25, -2.2 + i * 0.88);
      const glow = new Mesh(
        this.flat,
        new MeshBasicMaterial({
          map: this.track(haloTexture()),
          color: c,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      );
      this.disposables.push(glow.material as MeshBasicMaterial);
      glow.scale.set(2.2, 2.2, 1);
      glow.position.set(0.7, 3.25, -2.2 + i * 0.88);
      booth.add(par, glow);
    }
    booth.position.y = 0.15;
    const holder = new Group();
    holder.add(booth);
    this.group.add(holder);
    const at = 58;
    this.props.push({ mesh: holder, offset: at, x: -roadHalf - 4.2 });
    const random = seeded(8521);
    for (let i = 0; i < 14; i++)
      this.standers.push({
        offset: at + (random() - 0.5) * 5,
        x: -roadHalf - 1.2 - random() * 2,
        heading: Math.PI / 2 + (random() - 0.5) * 0.8,
        phase: random() * 6,
        scale: 0.9 + random() * 0.14,
        dance: true,
      });
  }

  /**
   * Giant letters on the dune spelling MIAMI BEACH across the view, each a 2.4 m block letter in its own
   * bright colour standing on a low plinth facing the riders coming down the drive, lit from below.
   */
  private addLetters(roadHalf: number): void {
    const word = 'MIAMI BEACH';
    const colours = ['#ff4fb8', '#ffd23f', '#2fe6ff', '#5aff8a', '#b46bff', '#ff6a3f'];
    const plinth = this.material({ color: 0xe8e2dc, roughness: 0.7 });
    const sign = new Group();
    let z = 0;
    // Laid from the right-hand end leftwards, so the word reads left to right from the road.
    [...word].reverse().forEach((ch, i) => {
      if (ch === ' ') {
        z += 0.6;
        return;
      }
      const m = this.material({
        map: this.track(letterTexture(ch, colours[i % colours.length]!)),
        transparent: true,
        alphaTest: 0.4,
        side: DoubleSide,
        emissive: 0xffffff,
        emissiveMap: this.track(letterTexture(ch, colours[i % colours.length]!)),
        emissiveIntensity: 0.6,
      });
      for (const dz of [0, -0.08, -0.16, -0.24]) {
        const letter = new Mesh(this.flat, m);
        letter.scale.set(1.9, 2.4, 1);
        letter.position.set(-z, 1.7, dz);
        sign.add(letter);
      }
      z += 1.9;
    });
    const base = new Mesh(this.unit, plinth);
    base.scale.set(z + 0.4, 0.5, 1);
    base.position.set(-z / 2 + 0.9, 0.25, -0.12);
    const wash = new Mesh(this.flat, this.halo);
    wash.scale.set(z + 3, 4, 1);
    wash.position.set(-z / 2 + 0.9, 1.7, 0.3);
    sign.add(base, wash);
    sign.position.y = -0.2;
    const holder = new Group();
    holder.add(sign);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 62, x: -roadHalf - 7 });
  }

  /**
   * A deco street clock on the promenade: a fluted pillar rising to a stepped head with a lit
   * face on each side, its hands turning with the night, ten past eleven at the start.
   */
  private addClock(roadHalf: number): void {
    const stone = this.material({ color: 0xece4dc, roughness: 0.6 });
    const face = this.material({
      map: this.track(clockFaceTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(clockFaceTexture()),
      emissiveIntensity: 1.1,
    });
    const hand = this.material({ color: 0x141018, roughness: 0.5 });
    const clock = new Group();
    const b = new BoxBuilder();
    b.box(stone, [0.9, 0.4, 0.9], [0, 0.2, 0]);
    b.box(stone, [0.45, 4, 0.45], [0, 2.4, 0]);
    for (const [dx, dz] of [
      [0.24, 0],
      [-0.24, 0],
      [0, 0.24],
      [0, -0.24],
    ] as const)
      b.box(stone, [0.06, 3.6, 0.06], [dx, 2.4, dz]);
    b.box(stone, [1.3, 1.3, 1.3], [0, 4.95, 0]);
    b.box(stone, [1.0, 0.3, 1.0], [0, 5.75, 0]);
    b.box(stone, [0.6, 0.3, 0.6], [0, 6.05, 0]);
    clock.add(b.build(this.disposables));
    const glow = new Mesh(this.flat, this.halo);
    glow.scale.set(3, 3, 1);
    glow.position.set(0, 4.95, 0.9);
    clock.add(glow);
    for (const turn of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const side = new Group();
      side.rotation.y = turn;
      const dial = new Mesh(this.flat, face);
      dial.scale.set(1.1, 1.1, 1);
      dial.position.set(0, 4.95, 0.66);
      const hour = new Mesh(this.unit, hand);
      hour.scale.set(0.05, 0.3, 0.02);
      const minute = new Mesh(this.unit, hand);
      minute.scale.set(0.035, 0.44, 0.02);
      for (const [m, len] of [
        [hour, 0.3],
        [minute, 0.44],
      ] as const) {
        const pivot = new Group();
        pivot.position.set(0, 4.95, 0.68);
        m.position.y = len / 2;
        pivot.add(m);
        side.add(pivot);
        this.clockHands.push({ pivot, minute: m === minute });
      }
      side.add(dial);
      clock.add(side);
    }
    clock.position.y = 0.15;
    const holder = new Group();
    holder.add(clock);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 49, x: -roadHalf - 3.6 });
  }

  /** People out for the night on both sidewalks. */
  private addPeople(roadHalf: number): void {
    const random = seeded(8131);
    // Strollers keep to the clear lanes: the kerb side and the shopfronts on the right, between
    // the palms and the café tables, and the promenade on the left.
    for (let k = 0; k < 44; k++) {
      const lane = k % 3;
      const x =
        lane === 0
          ? -roadHalf - 1 - random() * 2.6
          : lane === 1
            ? roadHalf + 1.1 + random() * 1.2
            : roadHalf + FRONT - 1.6 + random() * 1.1;
      this.people.push({
        offset: random() * LOOP,
        x,
        speed: (random() < 0.5 ? -1 : 1) * (0.7 + random() * 0.6),
        phase: random() * 6,
      });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, NIGHT_WEAR, 8137);
    // Knots of two to four people standing and talking: outside the lobbies and against the
    // promenade wall looking out to sea, each swaying a little as they chat.
    // Skaters on the promenade in neon, gliding past at a skater's pace with a side-to-side
    // stride.
    const glide = seeded(8301);
    for (let k = 0; k < 10; k++)
      this.skaters.push({
        offset: 16 + k * 39 + glide() * 8,
        x: -roadHalf - 1.4 - glide() * 2.2,
        speed: (glide() < 0.5 ? -1 : 1) * (3.5 + glide() * 2.5),
        phase: glide() * 6,
      });
    this.skating = new Figures(this.group, this.disposables, this.skaters.length, SKATE_WEAR, 8303);
    // The vendor behind each cart and the customers at its counter.
    for (const cart of this.carts) {
      this.standers.push({
        offset: cart,
        x: -roadHalf - 4.3,
        heading: -Math.PI / 2,
        phase: 1,
        scale: 0.95,
      });
      this.standers.push({
        offset: cart - 0.4,
        x: -roadHalf - 2.2,
        heading: Math.PI / 2,
        phase: 2,
        scale: 0.97,
      });
      this.standers.push({
        offset: cart + 0.6,
        x: -roadHalf - 2.0,
        heading: Math.PI / 2 + 0.3,
        phase: 3,
        scale: 0.86,
      });
    }
    // People sitting along the sea wall's coping, facing the sea in ones and twos, and a
    // couple just ahead at the start.
    const perch = seeded(8441);
    for (let k = 0; k < 16; k++) {
      const offset = k === 0 ? 39 : perch() * LOOP;
      const pair = k === 0 || perch() < 0.5;
      for (let i = 0; i < (pair ? 2 : 1); i++)
        this.standers.push({
          offset: offset + i * 0.6,
          x: -roadHalf - 5.15,
          heading: Math.PI / 2 + (perch() - 0.5) * 0.4,
          phase: perch() * 6,
          scale: 0.92 + perch() * 0.1,
          seat: -0.27,
        });
    }
    // A crowd gathered under the gateway on both sidewalks, facing the road, some with their
    // arms up cheering the riders through.
    const cheer = seeded(8551);
    for (let i = 0; i < 26; i++) {
      const right = i % 2 === 0;
      this.standers.push({
        offset: 58 + cheer() * 10,
        x: right ? roadHalf + 0.9 + cheer() * 2.2 : -roadHalf - 0.9 - cheer() * 2.4,
        heading: right ? Math.PI / 2 + (cheer() - 0.5) * 0.5 : -Math.PI / 2 + (cheer() - 0.5) * 0.5,
        phase: cheer() * 6,
        scale: 0.88 + cheer() * 0.16,
        dance: cheer() < 0.45,
      });
    }
    // The guests out on the balconies, facing the street.
    const guest = seeded(8541);
    for (const g of this.balconyGuests)
      this.standers.push({
        offset: g.offset,
        x: g.x,
        heading: Math.PI / 2 + (guest() - 0.5) * 0.6,
        phase: guest() * 6,
        scale: 0.92 + guest() * 0.1,
        seat: 0.15 - g.y,
      });
    // The diners seated at the café tables, chatting over their candles.
    const lean = seeded(8401);
    for (const d of this.diners)
      this.standers.push({
        offset: d.offset,
        x: roadHalf + FRONT + d.x,
        heading: d.heading,
        phase: lean() * 6,
        scale: 0.92 + lean() * 0.1,
        seat: 0.5,
      });
    // The queue for each club, waiting in a line along its rope, and the doorman by the door.
    const queue = seeded(8147);
    for (const club of this.clubs) {
      for (let i = 0; i < 9; i++)
        this.standers.push({
          offset: club - 2 - i * 0.85 - queue() * 0.2,
          x: roadHalf + FRONT - 1.35 + (queue() - 0.5) * 0.25,
          heading: queue() * 0.6 - 0.3,
          phase: queue() * 6,
          scale: 0.92 + queue() * 0.12,
        });
      this.standers.push({
        offset: club - 0.6,
        x: roadHalf + FRONT - 2.6,
        heading: Math.PI / 2,
        phase: 0,
        scale: 1.12,
      });
    }
    const chat = seeded(8139);
    for (let g = 0; g < 18; g++) {
      const wall = g % 3 === 0;
      const offset = chat() * LOOP;
      const cx = wall ? -roadHalf - 4.3 : roadHalf + FRONT - 2.2 - chat() * 1.5;
      const size = 2 + Math.floor(chat() * 3);
      for (let i = 0; i < size; i++) {
        const angle = (i / size) * Math.PI * 2 + chat();
        const x = wall ? cx + 0.2 : cx + Math.cos(angle) * 0.55;
        const z = wall ? i * 0.65 : Math.sin(angle) * 0.55;
        this.standers.push({
          offset: offset + z,
          x,
          heading: wall ? Math.PI / 2 : Math.atan2(cx - x, -z) + Math.PI,
          phase: chat() * 6,
          scale: 0.92 + chat() * 0.14,
        });
      }
    }
    this.chatting = new Figures(
      this.group,
      this.disposables,
      this.standers.length,
      NIGHT_WEAR,
      8143,
    );
    // Every fourth stroller walks a small dog on a lead a pace ahead of them.
    const dogParts: BufferGeometry[] = [];
    const piece = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const g = new BoxGeometry(w, h, d);
      g.translate(x, y, z);
      dogParts.push(g);
    };
    piece(0.2, 0.18, 0.45, 0, 0.3, 0);
    piece(0.16, 0.16, 0.18, 0, 0.42, -0.28);
    piece(0.08, 0.06, 0.1, 0, 0.38, -0.4);
    piece(0.04, 0.04, 0.18, 0, 0.42, 0.28);
    for (const [x, z] of [
      [-0.07, -0.16],
      [0.07, -0.16],
      [-0.07, 0.16],
      [0.07, 0.16],
    ] as const)
      piece(0.05, 0.22, 0.05, x, 0.11, z);
    const dogGeometry = mergeGeometries(dogParts)!;
    dogParts.forEach((g) => g.dispose());
    const dogMaterial = new MeshStandardMaterial({ roughness: 0.9 });
    const walkers = this.people.map((_, i) => i).filter((i) => i % 4 === 0);
    this.dogs = new InstancedMesh(dogGeometry, dogMaterial, walkers.length);
    this.dogWalkers = walkers;
    const coat = seeded(8501);
    walkers.forEach((_, i) =>
      this.dogs!.setColorAt(
        i,
        new Color(['#f4ecd8', '#3a2a1a', '#c8a070', '#1a1a1a', '#e8e0e0'][Math.floor(coat() * 5)]!),
      ),
    );
    this.dogs.frustumCulled = false;
    this.dogs.castShadow = true;
    this.group.add(this.dogs);
    this.disposables.push(dogGeometry, dogMaterial, this.dogs);
    // Everyone gets arms that swing as they walk, and hair or a hat.
    const count = this.people.length + this.skaters.length + this.standers.length;
    const arm = new CylinderGeometry(0.045, 0.04, 0.68, 6);
    arm.translate(0, -0.34, 0);
    const scalp = new SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const armMaterial = new MeshStandardMaterial({ roughness: 0.8 });
    const hairMaterial = new MeshStandardMaterial({ roughness: 0.9 });
    this.arms = new InstancedMesh(arm, armMaterial, count * 2);
    this.hair = new InstancedMesh(scalp, hairMaterial, count);
    const tint = seeded(8381);
    const colour = new Color();
    for (let i = 0; i < count; i++) {
      const skin = NIGHT_WEAR.skins[Math.floor(tint() * NIGHT_WEAR.skins.length)]!;
      this.arms.setColorAt(i * 2, colour.set(skin));
      this.arms.setColorAt(i * 2 + 1, colour.set(skin));
      this.hair.setColorAt(
        i,
        colour.set(
          ['#1a120c', '#3a2416', '#6a4a2a', '#c8a060', '#101010', '#f4f0e8'][
            Math.floor(tint() * 6)
          ]!,
        ),
      );
    }
    for (const m of [this.arms, this.hair]) {
      m.frustumCulled = false;
      m.castShadow = true;
      this.group.add(m);
    }
    this.disposables.push(arm, scalp, armMaterial, hairMaterial, this.arms, this.hair);
  }

  /** Sets figure `i`'s arms, swung `swing` radians, and its hair, to follow its body. */
  private dress(
    i: number,
    x: number,
    y: number,
    z: number,
    heading: number,
    scale: number,
    swing: number,
  ): void {
    const arms = this.arms;
    const hair = this.hair;
    if (!arms || !hair) return;
    for (const side of [-1, 1]) {
      this.limb.makeRotationY(heading);
      this.limbTurn.makeRotationX(side * swing);
      this.limb.multiply(this.limbTurn);
      this.limbTurn.makeRotationZ(side * 0.1);
      this.limb.multiply(this.limbTurn);
      this.limb.scale(this.limbScale.setScalar(scale));
      this.limbSpot.set(side * 0.24 * scale, 0, 0).applyAxisAngle(this.up, heading);
      this.limb.setPosition(x + this.limbSpot.x, y + 1.38 * scale, z + this.limbSpot.z);
      arms.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), this.limb);
    }
    this.limb.makeRotationY(heading);
    this.limb.scale(this.limbScale.setScalar(scale));
    this.limb.setPosition(x, y + 1.63 * scale, z);
    hair.setMatrixAt(i, this.limb);
  }

  /**
   * The tail of the shower: a light drizzle of streaks falling round the rider, slanting a
   * little in the sea breeze and catching the neon, held still for reduced motion.
   */
  private addDrizzle(): void {
    const random = seeded(8281);
    const streak = new PlaneGeometry(0.018, 0.55);
    const material = new MeshBasicMaterial({
      color: 0xc8d8ff,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const count = 700;
    const rain = new InstancedMesh(streak, material, count);
    rain.frustumCulled = false;
    this.disposables.push(streak, material, rain);
    for (let i = 0; i < count; i++)
      this.drops.push({
        x: (random() - 0.5) * 34,
        y: random() * 14,
        z: 6 - random() * 50,
        speed: 7 + random() * 3,
      });
    this.rain = rain;
    this.horizon.add(rain);
    // Where drops land on the road, rings spread and fade on the puddles.
    const ring = new PlaneGeometry(1, 1);
    ring.rotateX(-Math.PI / 2);
    const ripple = new MeshBasicMaterial({
      map: this.track(rippleTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const ripples = new InstancedMesh(ring, ripple, RIPPLES);
    ripples.frustumCulled = false;
    ripples.renderOrder = 2;
    this.disposables.push(ring, ripple, ripples);
    this.ripples = ripples;
    this.group.add(ripples);
  }

  /** Across the bay, the towers lit floor by floor, the moon path and the night sea. */
  private addBay(): void {
    const random = seeded(8141);
    const towers = [0, 1, 2].map((v) =>
      this.material({
        map: this.track(towerTexture(8141 + v)),
        emissive: 0xffffff,
        emissiveMap: this.track(towerTexture(8141 + v)),
        emissiveIntensity: 1.2,
        roughness: 0.4,
        metalness: 0.4,
        fog: false,
      }),
    );
    const crowns = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 3, fog: false }),
    );
    const beacon = this.material({
      color: 0xff2020,
      emissive: 0xff2020,
      emissiveIntensity: 4,
      fog: false,
    });
    const edge = NEON.map((c) =>
      this.material({ color: c, emissive: c, emissiveIntensity: 2.4, fog: false }),
    );
    // Two ranks of towers: the nearer, taller ones with setbacks, crowns and spires, and a
    // lower rank behind them filling the gaps.
    for (let rank = 0; rank < 2; rank++)
      for (let k = 0; k < (rank ? 30 : 24); k++) {
        const h = rank ? 40 + random() * 90 : 70 + random() * 190;
        const w = 26 + random() * 30;
        const d = 26 + random() * 20;
        const x = -1000 + k * (rank ? 64 : 82) + random() * 30;
        const z = rank ? -1950 - random() * 200 : -1500 - random() * 300;
        const shaft = towers[(k + rank) % towers.length]!;
        let top = -SEA;
        let width = w;
        let depth = d;
        const tiers = rank ? 1 : 1 + Math.floor(random() * 3);
        for (let t = 0; t < tiers; t++) {
          const th = (t === 0 ? 0.7 : 0.18) * h;
          const m = new Mesh(this.unit, shaft);
          m.scale.set(width, th, depth);
          m.position.set(x, top + th / 2, z);
          this.horizon.add(m);
          top += th;
          if (!rank && random() < 0.6) {
            // Lit edges up the tower's corners.
            for (const side of [-1, 1]) {
              const e = new Mesh(this.unit, edge[(k + t) % edge.length]!);
              e.scale.set(1.2, th, 1.2);
              e.position.set(x + (side * width) / 2, top - th / 2, z + depth / 2);
              this.horizon.add(e);
            }
          }
          width *= 0.72;
          depth *= 0.72;
        }
        if (!rank && random() < 0.55) {
          const c = new Mesh(this.unit, crowns[k % crowns.length]!);
          c.scale.set(width * 1.4, 3, depth * 1.4);
          c.position.set(x, top + 1.5, z);
          this.horizon.add(c);
        }
        if (!rank && random() < 0.5) {
          const spire = 18 + random() * 40;
          const m = new Mesh(this.unit, shaft);
          m.scale.set(2, spire, 2);
          m.position.set(x, top + spire / 2, z);
          const b = new Mesh(this.unit, beacon);
          b.scale.set(3.5, 3.5, 3.5);
          b.position.set(x, top + spire + 1, z);
          this.horizon.add(m, b);
          this.beacons.push(b);
        }
      }
    // The open sea to the horizon on the left, the moon's path laid across it.
    const water = this.material({
      color: 0x1a2048,
      roughness: 0.05,
      metalness: 0.5,
      emissive: 0x0a1030,
      emissiveIntensity: 0.6,
    });
    const sea = new Mesh(new PlaneGeometry(5000, 4000), water);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-2500, -SEA - 0.1, -1000);
    this.disposables.push(sea.geometry);
    this.horizon.add(sea);
    // The moon's path: a road of glitter laid on the sea from near the shore out to the
    // horizon under the moon, narrow near and fading at its edges, its sparkles drifting.
    const glitter = this.track(glitterTexture());
    glitter.wrapS = RepeatWrapping;
    glitter.wrapT = RepeatWrapping;
    glitter.repeat.set(1, 1.5);
    this.glitter = glitter;
    const path = new PlaneGeometry(70, 1850);
    path.rotateX(-Math.PI / 2);
    this.disposables.push(path);
    const shimmer = new MeshBasicMaterial({
      map: glitter,
      color: 0xd8e0ff,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    this.disposables.push(shimmer);
    const moonward = Math.atan2(900, 1900);
    const road = new Mesh(path, shimmer);
    road.rotation.y = moonward;
    road.position.set(-Math.sin(moonward) * 980, -SEA + 0.05, -Math.cos(moonward) * 980);
    this.horizon.add(road);
    // A cruise ship lying offshore, broadside on: a white hull and four decks of
    // superstructure lit cabin by cabin, a raked funnel with the line's neon band, and its
    // masthead and deck lights.
    const ship = new Group();
    const decks = this.material({
      map: this.track(cabinTexture(false)),
      emissive: 0xffffff,
      emissiveMap: this.track(cabinTexture(true)),
      emissiveIntensity: 1.3,
      roughness: 0.5,
      fog: false,
    });
    const hullPaint = this.material({ color: 0x3a3e58, roughness: 0.5, fog: false });
    const hull = new Mesh(this.unit, hullPaint);
    hull.scale.set(260, 14, 34);
    hull.position.set(0, 3, 0);
    ship.add(hull);
    for (let d = 0; d < 4; d++) {
      const deck = new Mesh(this.unit, decks);
      deck.scale.set(230 - d * 26, 6, 30 - d * 2);
      deck.position.set(-10 + d * 4, 13 + d * 6, 0);
      ship.add(deck);
    }
    const funnel = new Mesh(this.unit, hullPaint);
    funnel.scale.set(16, 18, 10);
    funnel.rotation.z = 0.18;
    funnel.position.set(50, 44, 0);
    const livery = new Mesh(this.unit, crowns[0]!);
    livery.scale.set(16.5, 3, 10.5);
    livery.rotation.z = 0.18;
    livery.position.set(51.5, 50, 0);
    ship.add(funnel, livery);
    for (const x of [-110, 110]) {
      const light = new Mesh(this.unit, beacon);
      light.scale.set(3, 3, 3);
      light.position.set(x, 40, 0);
      ship.add(light);
    }
    ship.position.set(-760, -SEA, -1250);
    ship.rotation.y = 0.35;
    this.horizon.add(ship);
    // The causeway across the bay in front of the towers: a long low deck on piers, a lamp
    // every 30 m along its rail, and the head and tail lights of its traffic streaming both
    // ways.
    const causeway = new Group();
    const concrete = this.material({ color: 0x2a2838, roughness: 0.8, fog: false });
    const deck = new Mesh(this.unit, concrete);
    deck.scale.set(1400, 2.4, 14);
    deck.position.y = 14;
    causeway.add(deck);
    for (let x = -680; x <= 680; x += 40) {
      const pier = new Mesh(this.unit, concrete);
      pier.scale.set(2.4, 14, 7);
      pier.position.set(x, 6.5, 0);
      causeway.add(pier);
    }
    const lampLight = this.material({
      color: 0xffe0a0,
      emissive: 0xffd890,
      emissiveIntensity: 3,
      fog: false,
    });
    for (let x = -690; x <= 690; x += 25) {
      const lamp = new Mesh(this.unit, lampLight);
      lamp.scale.set(1.2, 1.2, 1.2);
      lamp.position.set(x, 21.5, 6.5);
      const post = new Mesh(this.unit, concrete);
      post.scale.set(0.4, 6, 0.4);
      post.position.set(x, 18.3, 6.5);
      causeway.add(lamp, post);
    }
    const stream = this.track(trafficStreamTexture());
    stream.wrapS = RepeatWrapping;
    stream.repeat.set(8, 1);
    this.stream = stream;
    const flow = new MeshBasicMaterial({
      map: stream,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    this.disposables.push(flow);
    const lanes = new Mesh(new PlaneGeometry(1400, 1.6), flow);
    lanes.position.set(0, 16.1, 7.1);
    this.disposables.push(lanes.geometry);
    causeway.add(lanes);
    causeway.position.set(-820, -SEA, -820);
    causeway.rotation.y = 0.12;
    this.horizon.add(causeway);
    // A small plane trawling the beach with an LED banner behind it, flying slowly along the
    // shore, its nav lights blinking.
    const plane = new Group();
    const planeShell = this.material({ color: 0xd8d8e0, roughness: 0.5, fog: false });
    const fuselage = new Mesh(this.unit, planeShell);
    fuselage.scale.set(7, 1.2, 1.2);
    const wing = new Mesh(this.unit, planeShell);
    wing.scale.set(1.6, 0.15, 10);
    wing.position.x = 0.8;
    const tail = new Mesh(this.unit, planeShell);
    tail.scale.set(1, 1.4, 0.15);
    tail.position.set(-3.2, 0.8, 0);
    plane.add(fuselage, wing, tail);
    for (const [z, c] of [
      [-5, 0xff2020],
      [5, 0x20ff60],
    ] as const) {
      const nav = new Mesh(
        this.unit,
        this.material({ color: c, emissive: c, emissiveIntensity: 4, fog: false }),
      );
      nav.scale.setScalar(0.5);
      nav.position.set(0.8, 0, z);
      plane.add(nav);
      this.planeLights.push(nav);
    }
    const banner = this.material({
      map: this.track(ledBannerTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(ledBannerTexture()),
      emissiveIntensity: 2,
      side: DoubleSide,
      fog: false,
    });
    const sign = new Mesh(new PlaneGeometry(36, 5), banner);
    sign.position.set(-28, -1.5, 0);
    const tow = new Mesh(this.unit, planeShell);
    tow.scale.set(8, 0.05, 0.05);
    tow.position.set(-7.5, -0.6, 0);
    this.disposables.push(sign.geometry);
    plane.add(sign, tow);
    this.plane = plane;
    this.horizon.add(plane);
    // Fireworks over the bay: three bursts in turn, each a sphere of sparks blooming in its
    // colour, falling and fading, a new one somewhere over the towers every few seconds.
    const spark = new PlaneGeometry(11, 11);
    const sparkMaterial = new MeshBasicMaterial({
      map: this.track(haloTexture()),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    const sparks = new InstancedMesh(spark, sparkMaterial, BURSTS * SPARKS);
    sparks.frustumCulled = false;
    this.disposables.push(spark, sparkMaterial, sparks);
    const fan = seeded(8391);
    for (let i = 0; i < SPARKS; i++) {
      const u = fan() * 2 - 1;
      const a = fan() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      this.sparkDirs.push(
        new Vector3(r * Math.cos(a), u, r * Math.sin(a) * 0.4).multiplyScalar(0.8 + fan() * 0.4),
      );
    }
    this.sparks = sparks;
    this.horizon.add(sparks);
    // The shower's storm moving off over the sea: now and then its clouds light from within,
    // a flicker or two, and once in a while a fork of lightning stabs down to the horizon.
    const flash = new Mesh(
      new PlaneGeometry(900, 360),
      new MeshBasicMaterial({
        map: this.track(stormCloudTexture()),
        color: 0xc8b8ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    flash.position.set(-1000, 330, -1900);
    flash.rotation.y = 0.6;
    const bolt = new Mesh(
      new PlaneGeometry(60, 300),
      new MeshBasicMaterial({
        map: this.track(boltTexture()),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    bolt.position.set(-960, 150, -1890);
    bolt.rotation.y = 0.6;
    this.disposables.push(
      flash.geometry,
      flash.material as MeshBasicMaterial,
      bolt.geometry,
      bolt.material as MeshBasicMaterial,
    );
    this.storm = {
      flash: flash.material as MeshBasicMaterial,
      bolt: bolt.material as MeshBasicMaterial,
    };
    this.horizon.add(flash, bolt);
    // Sea mist lying low over the water after the rain: long soft banks drifting slowly in
    // front of the causeway and the ships, lit pale violet by the moon and the city.
    const mistMap = this.track(seaMistTexture());
    mistMap.wrapS = RepeatWrapping;
    this.mist = mistMap;
    const mist = new MeshBasicMaterial({
      map: mistMap,
      color: 0xb8a8e0,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      fog: false,
    });
    this.disposables.push(mist);
    for (const [x, y, z, w, h] of [
      [-700, 6, -500, 1400, 18],
      [-900, 9, -900, 2000, 26],
      [-600, 12, -1350, 2400, 34],
    ] as const) {
      const bank = new Mesh(new PlaneGeometry(w, h), mist);
      bank.position.set(x, y - SEA, z);
      this.disposables.push(bank.geometry);
      this.horizon.add(bank);
    }
    // A blimp drifting high over the beach, its envelope lit faintly by the city and an LED
    // screen along its flank cycling MIAMI NIGHTS, nav lights at nose and tail.
    const blimp = new Group();
    const envelope = new Mesh(
      new SphereGeometry(1, 24, 16),
      this.material({
        color: 0x9a98a8,
        roughness: 0.6,
        metalness: 0.2,
        emissive: 0x2a2040,
        emissiveIntensity: 0.6,
        fog: false,
      }),
    );
    envelope.scale.set(28, 8, 8);
    this.disposables.push(envelope.geometry);
    const screenMaterial = this.material({
      map: this.track(ledBannerTexture()),
      emissive: 0xffffff,
      emissiveMap: this.track(ledBannerTexture()),
      emissiveIntensity: 1.8,
      fog: false,
    });
    const screen = new Mesh(new PlaneGeometry(30, 4.2), screenMaterial);
    screen.position.set(0, 0, 7.6);
    const gondola = new Mesh(
      this.unit,
      this.material({ color: 0x20222a, roughness: 0.5, fog: false }),
    );
    gondola.scale.set(7, 1.8, 2.4);
    gondola.position.y = -8.4;
    const rudder = new Mesh(
      this.unit,
      this.material({ color: 0x8a889a, roughness: 0.6, fog: false }),
    );
    rudder.scale.set(5, 7, 0.4);
    rudder.position.set(-25, 0, 0);
    this.disposables.push(screen.geometry);
    blimp.add(envelope, screen, gondola, rudder);
    for (const [x, c] of [
      [28, 0xffffff],
      [-27, 0xff2020],
    ] as const) {
      const nav = new Mesh(
        this.unit,
        this.material({ color: c, emissive: c, emissiveIntensity: 4, fog: false }),
      );
      nav.scale.setScalar(0.9);
      nav.position.set(x, 0, 0);
      blimp.add(nav);
      this.planeLights.push(nav);
    }
    this.blimp = blimp;
    this.horizon.add(blimp);
    // Wisps of cloud passing over the moon, their edges silvered by it, drifting slowly.
    const silver = new Mesh(
      new PlaneGeometry(260, 90),
      new MeshBasicMaterial({
        map: this.track(silverCloudTexture()),
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    silver.position.set(-880, 500, -1880);
    this.disposables.push(silver.geometry, silver.material as MeshBasicMaterial);
    this.moonCloud = silver;
    this.horizon.add(silver);
    // A shooting star now and then, a bright streak falling across the stars and fading.
    const meteor = new Mesh(
      new PlaneGeometry(240, 5),
      new MeshBasicMaterial({
        map: this.track(meteorTexture()),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    meteor.rotation.z = -0.35;
    this.disposables.push(meteor.geometry, meteor.material as MeshBasicMaterial);
    this.meteor = meteor;
    this.horizon.add(meteor);
    // Searchlights from the clubs down the drive, their beams sweeping the clouds.
    const cone = new CylinderGeometry(46, 0.8, 700, 24, 1, true);
    cone.translate(0, 350, 0);
    this.disposables.push(cone);
    const beamLight = new MeshBasicMaterial({
      map: this.track(searchlightTexture()),
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      fog: false,
    });
    this.disposables.push(beamLight);
    for (const [x, z] of [
      [70, -520],
      [150, -880],
      [40, -1200],
    ] as const) {
      const sweep = new Mesh(cone, beamLight);
      sweep.position.set(x, 30, z);
      this.horizon.add(sweep);
      this.searchlights.push(sweep);
    }
    // A police helicopter circling over the beach, its nav lights blinking, rotor turning and
    // its spotlight sweeping the sand.
    const heli = new Group();
    const shell = this.material({ color: 0x20242c, roughness: 0.4, metalness: 0.6, fog: false });
    const body = new Mesh(new SphereGeometry(2.2, 12, 8), shell);
    body.scale.set(1.6, 1, 1);
    const boom = new Mesh(this.unit, shell);
    boom.scale.set(7, 0.5, 0.5);
    boom.position.set(-5.5, 0.4, 0);
    const fin = new Mesh(this.unit, shell);
    fin.scale.set(1.2, 1.8, 0.2);
    fin.position.set(-8.8, 1.2, 0);
    const rotor = new Mesh(
      new CylinderGeometry(6, 6, 0.05, 24),
      new MeshBasicMaterial({
        color: 0x8890a0,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        fog: false,
      }),
    );
    rotor.position.y = 2.3;
    this.disposables.push(body.geometry, rotor.geometry, rotor.material as MeshBasicMaterial);
    const red = this.material({
      color: 0xff2020,
      emissive: 0xff2020,
      emissiveIntensity: 4,
      fog: false,
    });
    const green = this.material({
      color: 0x20ff60,
      emissive: 0x20ff60,
      emissiveIntensity: 4,
      fog: false,
    });
    const port = new Mesh(this.unit, red);
    port.scale.setScalar(0.5);
    port.position.set(0, 0, -2.4);
    const starboard = new Mesh(this.unit, green);
    starboard.scale.setScalar(0.5);
    starboard.position.set(0, 0, 2.4);
    const spot = new CylinderGeometry(0.4, 14, 90, 18, 1, true);
    spot.translate(0, -45, 0);
    this.disposables.push(spot);
    const spotBeam = new Mesh(spot, beamLight);
    spotBeam.rotation.z = 0.35;
    heli.add(body, boom, fin, rotor, port, starboard, spotBeam);
    this.heli = { craft: heli, rotor, lights: [port, starboard] };
    this.horizon.add(heli);

    // The city's violet glow rising behind the towers, and the moon over the sea.
    const glow = new MeshBasicMaterial({
      map: this.track(glowTexture()),
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    const band = new Mesh(new PlaneGeometry(4200, 700), glow);
    band.position.set(0, 300, -1950);
    // The full moon, its seas and craters, wrapped in a pale halo in the humid air.
    const moon = new Mesh(
      new SphereGeometry(28, 32, 20),
      new MeshBasicMaterial({ map: this.track(moonTexture()), fog: false }),
    );
    moon.rotation.y = -Math.PI / 2;
    moon.position.set(-900, 520, -1900);
    const halo = new Mesh(
      new PlaneGeometry(420, 420),
      new MeshBasicMaterial({
        map: this.track(moonHaloTexture()),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    halo.position.set(-900, 520, -1930);
    this.disposables.push(glow, band.geometry, moon.geometry, moon.material);
    this.disposables.push(halo.geometry, halo.material);
    // A sprinkling of stars above the glow, the brighter ones twinkling blue-white, and wisps
    // of cloud lit from below by the city.
    const stars = new Mesh(
      new PlaneGeometry(6400, 1600),
      new MeshBasicMaterial({
        map: this.track(starsTexture()),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        fog: false,
      }),
    );
    stars.position.set(0, 1100, -2100);
    this.starMaterial = stars.material as MeshBasicMaterial;
    const clouds = new Mesh(
      new PlaneGeometry(5200, 500),
      new MeshBasicMaterial({
        map: this.track(cloudTexture()),
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    clouds.position.set(400, 620, -2000);
    this.disposables.push(stars.geometry, stars.material, clouds.geometry, clouds.material);
    this.horizon.add(stars, band, clouds, halo, moon);
    this.group.add(this.horizon);
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

/**
 * The wet black asphalt across the whole road, 16 m of it: aggregate and tar seams, darker
 * glossy puddles smeared with neon, a solid white edge line inside each gutter, the double
 * yellow centre line and, once in the tile, a cast-iron manhole cover.
 */
function roadTexture(): CanvasTexture {
  return canvasTexture(512, 1024, (g) => {
    speckle(g, 512, 1024, '#26262c', 8151);
    const random = seeded(8153);
    // Aggregate: pale stones catching the light.
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(200,200,220,${(0.05 + random() * 0.12).toFixed(2)})`;
      g.fillRect(random() * 512, random() * 1024, 1.5, 1.5);
    }
    // Puddles: darker, smoother patches.
    for (let i = 0; i < 9; i++) {
      const x = random() * 512;
      const y = random() * 1024;
      const r = 20 + random() * 50;
      const puddle = g.createRadialGradient(x, y, 0, x, y, r);
      puddle.addColorStop(0, 'rgba(8,8,16,0.6)');
      puddle.addColorStop(1, 'rgba(8,8,16,0)');
      g.fillStyle = puddle;
      g.fillRect(x - r, y - r * 2, r * 2, r * 4);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = ['rgba(255,63,180,0.14)', 'rgba(47,230,255,0.12)', 'rgba(180,107,255,0.12)'][
        i % 3
      ]!;
      g.fillRect(random() * 512, random() * 1024, 2 + random() * 8, 30 + random() * 80);
    }
    // Tar seams and a crack or two.
    g.strokeStyle = 'rgba(10,10,14,0.8)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 300);
    g.lineTo(512, 310);
    for (let i = 0; i < 4; i++) {
      let x = random() * 512;
      let y = random() * 1024;
      g.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += (random() - 0.5) * 30;
        y += random() * 30;
        g.lineTo(x, y);
      }
    }
    g.stroke();
    // Edge lines and the double yellow centre line, slightly worn.
    g.fillStyle = 'rgba(236,232,220,0.85)';
    g.fillRect(14, 0, 8, 1024);
    g.fillRect(490, 0, 8, 1024);
    g.fillStyle = 'rgba(240,196,40,0.9)';
    g.fillRect(244, 0, 8, 1024);
    g.fillRect(260, 0, 8, 1024);
    g.fillStyle = 'rgba(38,38,44,0.5)';
    for (let i = 0; i < 60; i++) g.fillRect(240 + random() * 30, random() * 1024, 4, 3);
    // A manhole cover in the right lane.
    g.fillStyle = '#1a1a1e';
    g.beginPath();
    g.arc(380, 700, 26, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(120,120,140,0.6)';
    g.lineWidth = 2;
    for (let r = 8; r < 26; r += 6) {
      g.beginPath();
      g.arc(380, 700, r, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

/**
 * Ocean Drive's sidewalk: hexagonal pavers in rose and grey, each its own shade, with dark
 * sand joints and a wet sheen, 2.4 m to the tile.
 */
function pavingTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#3a3440';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(8161);
    const r = 16;
    const w = Math.sqrt(3) * r;
    for (let row = -1; row < 256 / (r * 1.5) + 1; row++)
      for (let col = -1; col < 256 / w + 1; col++) {
        const cx = col * w + (row % 2 ? w / 2 : 0);
        const cy = row * r * 1.5;
        const rose = random() < 0.35;
        const v = 140 + Math.floor(random() * 30);
        g.fillStyle = rose ? `rgb(${v + 20},${v - 20},${v - 10})` : `rgb(${v},${v - 4},${v + 6})`;
        g.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (i * Math.PI) / 3;
          const x = cx + Math.cos(a) * (r - 1.5);
          const y = cy + Math.sin(a) * (r - 1.5);
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.closePath();
        g.fill();
      }
    // A wet sheen in patches.
    for (let i = 0; i < 6; i++) {
      const x = random() * 256;
      const y = random() * 256;
      const sheen = g.createRadialGradient(x, y, 0, x, y, 50);
      sheen.addColorStop(0, 'rgba(20,16,30,0.35)');
      sheen.addColorStop(1, 'rgba(20,16,30,0)');
      g.fillStyle = sheen;
      g.fillRect(x - 50, y - 50, 100, 100);
    }
  });
}

/** The promenade: deco waves of pale and dusk-pink stone running along the sea wall. */
function promenadeTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#a8a0b0', 8163);
    g.lineWidth = 18;
    for (let band = 0; band < 6; band++) {
      g.strokeStyle = band % 2 ? 'rgba(200,140,160,0.55)' : 'rgba(240,236,244,0.35)';
      g.beginPath();
      for (let y = 0; y <= 256; y += 4) {
        const x = band * 51 + 20 + Math.sin((y / 256) * Math.PI * 4) * 16;
        if (y) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
    }
  });
}

/** The beach at night, pale sand gone grey-blue. */
function sandTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#8a8a9a', 8171));
}

/**
 * The night sea: long low swells running in to the shore, dark in their troughs and catching
 * the moon and the city's violet glow along their crests, broken by small chop.
 */
function seaTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#1e2452';
    g.fillRect(0, 0, 256, 256);
    const random = seeded(8181);
    for (let y = 0; y < 256; y += 16) {
      const phase = random() * 6;
      // The trough, darker, then the crest catching the light.
      g.fillStyle = 'rgba(8,10,30,0.45)';
      for (let x = 0; x < 256; x += 2) g.fillRect(x, y + 6 + Math.sin(x / 20 + phase) * 3, 2, 6);
      for (let x = 0; x < 256; x += 2) {
        const glint = Math.max(0, Math.sin(x / 9 + phase * 3));
        g.fillStyle = `rgba(${170 + glint * 60},${160 + glint * 60},255,${(0.15 + glint * 0.35).toFixed(2)})`;
        g.fillRect(x, y + 3 + Math.sin(x / 20 + phase) * 3, 2, 1.5);
      }
    }
    for (let i = 0; i < 160; i++) {
      g.fillStyle = 'rgba(200,210,255,0.3)';
      g.fillRect(random() * 256, random() * 256, 3 + random() * 6, 1);
    }
  });
}

/** Where a façade's windows fall: per storey, paired windows between deco pilasters. */
function windowBays(storeys: number): { x: number; y: number; w: number; h: number }[] {
  const bays: { x: number; y: number; w: number; h: number }[] = [];
  const band = 512 / storeys;
  for (let f = 0; f < storeys; f++)
    for (let x = 22; x < 490; x += 78)
      for (const dx of [0, 30])
        bays.push({ x: x + dx, y: f * band + band * 0.3, w: 26, h: band * 0.48 });
  return bays;
}

/**
 * A hotel's stucco front: storey bands, fluted pilasters between the bays, a shadowed eyebrow
 * over each pair of windows, racing stripes at the corners and the window openings with
 * their mullions.
 */
function facadeTexture(storeys: number, seed: number, accent: string): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#f4f0ec', seed);
    const band = 512 / storeys;
    // The hotel's accent colour: a band under each window row, the corner piers and a wide
    // frieze under the roof, painted as Ocean Drive paints its trim.
    g.fillStyle = accent;
    g.fillRect(0, 0, 512, 16);
    g.fillRect(0, 0, 18, 512);
    g.fillRect(494, 0, 18, 512);
    for (let f = 0; f < storeys; f++) g.fillRect(0, f * band + band * 0.82, 512, band * 0.08);
    // Fluted pilasters: pale ribs with a shadow line, rising the full height between bays.
    for (let x = 8; x < 512; x += 78) {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(x, 0, 10, 512);
      g.fillStyle = 'rgba(70,60,80,0.28)';
      g.fillRect(x + 10, 0, 3, 512);
      g.fillRect(x + 4, 0, 1, 512);
    }
    for (let f = 0; f < storeys; f++) {
      const top = f * band;
      // The string course between storeys, lit from above.
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.fillRect(0, top, 512, 3);
      g.fillStyle = 'rgba(70,60,90,0.35)';
      g.fillRect(0, top + 3, 512, 4);
      // Three racing stripes at each corner, the deco speed lines.
      g.fillStyle = 'rgba(60,50,80,0.3)';
      for (let i = 0; i < 3; i++) {
        g.fillRect(0, top + band * 0.18 + i * 6, 14, 2);
        g.fillRect(498, top + band * 0.18 + i * 6, 14, 2);
      }
    }
    const shutters = seeded(seed + 5);
    for (const b of windowBays(storeys)) {
      // Louvred storm shutters folded back beside some of the windows, in the trim colour.
      if (shutters() < 0.3) {
        g.fillStyle = accent;
        g.fillRect(b.x - 9, b.y, 7, b.h);
        g.fillRect(b.x + b.w + 2, b.y, 7, b.h);
        g.fillStyle = 'rgba(20,16,30,0.35)';
        for (let y = b.y + 2; y < b.y + b.h; y += 4) {
          g.fillRect(b.x - 9, y, 7, 1);
          g.fillRect(b.x + b.w + 2, y, 7, 1);
        }
      }
      g.fillStyle = '#20202e';
      g.fillRect(b.x, b.y, b.w, b.h);
      // The mullion and transom, and a pale reveal down one side.
      g.fillStyle = 'rgba(230,230,240,0.85)';
      g.fillRect(b.x + b.w / 2 - 1, b.y, 2, b.h);
      g.fillRect(b.x, b.y + b.h * 0.3, b.w, 2);
      g.fillStyle = 'rgba(255,255,255,0.4)';
      g.fillRect(b.x - 2, b.y, 2, b.h);
      // The eyebrow's shadow falling across the window head.
      g.fillStyle = 'rgba(30,25,45,0.45)';
      g.fillRect(b.x - 3, b.y - 2, b.w + 6, 6);
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(b.x - 4, b.y - 5, b.w + 8, 3);
    }
  });
}

/**
 * The same windows at night: rooms lit warm, pink or blue, brighter under the ceiling lamp,
 * some with drapes drawn to the sides, some with someone standing at the glass or the blue
 * flicker of a television, some dark behind half-lowered blinds.
 */
function windowsTexture(storeys: number, seed: number): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(seed + 1);
    for (const b of windowBays(storeys)) {
      if (random() < 0.4) continue;
      const lit = ['#ffd8a0', '#ffe8c8', '#ff9ec9', '#a8e8ff', '#ffc890'][
        Math.floor(random() * 5)
      ]!;
      const room = g.createLinearGradient(0, b.y, 0, b.y + b.h);
      room.addColorStop(0, lit);
      room.addColorStop(1, 'rgba(90,60,50,1)');
      g.fillStyle = room;
      g.fillRect(b.x, b.y, b.w, b.h);
      const roll = random();
      if (roll < 0.15) {
        // A television's blue glow.
        g.fillStyle = 'rgba(110,160,255,0.85)';
        g.fillRect(b.x, b.y + b.h * 0.4, b.w, b.h * 0.6);
      } else if (roll < 0.3) {
        // Someone at the window.
        g.fillStyle = 'rgba(20,14,20,0.9)';
        const cx = b.x + b.w * (0.3 + random() * 0.4);
        g.beginPath();
        g.arc(cx, b.y + b.h * 0.42, b.w * 0.14, 0, Math.PI * 2);
        g.fill();
        g.fillRect(cx - b.w * 0.2, b.y + b.h * 0.55, b.w * 0.4, b.h * 0.45);
      }
      if (random() < 0.45) {
        // Drapes drawn to the sides.
        g.fillStyle = ['rgba(200,40,80,0.85)', 'rgba(240,200,140,0.85)', 'rgba(40,120,120,0.85)'][
          Math.floor(random() * 3)
        ]!;
        g.fillRect(b.x, b.y, b.w * 0.22, b.h);
        g.fillRect(b.x + b.w * 0.78, b.y, b.w * 0.22, b.h);
      } else if (random() < 0.4) {
        g.fillStyle = 'rgba(0,0,0,0.55)';
        const down = b.h * (0.3 + random() * 0.4);
        for (let y = 0; y < down; y += 3) g.fillRect(b.x, b.y + y, b.w, 2);
      }
      g.fillStyle = '#000';
      g.fillRect(b.x + b.w / 2 - 1, b.y, 2, b.h);
      g.fillRect(b.x, b.y + b.h * 0.3, b.w, 2);
    }
  });
}

/** A blade sign's face: the hotel's name in glowing neon capitals inside a border of bulbs. */
function signTexture(name: string, glow: number): CanvasTexture {
  const colour = `#${glow.toString(16).padStart(6, '0')}`;
  return canvasTexture(128, 1024, (g) => {
    g.fillStyle = '#100c18';
    g.fillRect(0, 0, 128, 1024);
    for (let y = 10; y < 1024; y += 20)
      for (const x of [10, 118]) {
        g.fillStyle = (y / 20) % 2 < 1 ? '#fff4d0' : '#ffc860';
        g.beginPath();
        g.arc(x, y, 4, 0, Math.PI * 2);
        g.fill();
      }
    g.strokeStyle = colour;
    g.lineWidth = 3;
    g.strokeRect(22, 22, 84, 980);
    g.font = 'bold 92px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const letters = name.replace(/ /g, '').split('');
    const step = 940 / letters.length;
    letters.forEach((c, i) => {
      const y = 46 + step * (i + 0.5);
      g.shadowColor = colour;
      g.shadowBlur = 16;
      g.fillStyle = colour;
      g.fillText(c, 64, y);
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.font = 'bold 86px sans-serif';
      g.fillText(c, 64, y);
      g.font = 'bold 92px sans-serif';
    });
  });
}

/** An awning striped white and the hotel's neon colour. */
function awningTexture(glow: number): CanvasTexture {
  const colour = `#${glow.toString(16).padStart(6, '0')}`;
  return canvasTexture(64, 64, (g) => {
    for (let x = 0; x < 64; x += 16) {
      g.fillStyle = colour;
      g.fillRect(x, 0, 8, 64);
      g.fillStyle = '#f4f0e8';
      g.fillRect(x + 8, 0, 8, 64);
    }
  });
}

/** A far tower's glass, its floors lit in rows. */
function towerTexture(seed: number): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    g.fillStyle = '#0a0c18';
    g.fillRect(0, 0, 64, 256);
    const random = seeded(seed);
    for (let y = 2; y < 256; y += 6)
      for (let x = 2; x < 64; x += 6) {
        if (random() < 0.5) continue;
        g.fillStyle = random() < 0.8 ? '#ffe0a8' : '#a8e8ff';
        g.fillRect(x, y, 3, 3);
      }
  });
}

/** The city glow: violet and magenta fading up from the horizon into the night. */
function glowTexture(): CanvasTexture {
  return canvasTexture(16, 256, (g) => {
    const glow = g.createLinearGradient(0, 256, 0, 0);
    glow.addColorStop(0, 'rgba(255,80,180,0.75)');
    glow.addColorStop(0.3, 'rgba(150,70,220,0.45)');
    glow.addColorStop(1, 'rgba(40,20,90,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 16, 256);
  });
}

/** The moon's face: pale grey-white with its darker seas and a scatter of bright craters. */
function moonTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    g.fillStyle = '#f2f0f8';
    g.fillRect(0, 0, 256, 128);
    const random = seeded(8191);
    const seas: [number, number, number][] = [
      [150, 40, 18],
      [170, 62, 14],
      [132, 70, 20],
      [112, 46, 12],
      [160, 88, 10],
      [190, 48, 9],
    ];
    for (const [x, y, r] of seas) {
      const sea = g.createRadialGradient(x, y, 0, x, y, r);
      sea.addColorStop(0, 'rgba(120,120,140,0.6)');
      sea.addColorStop(1, 'rgba(120,120,140,0)');
      g.fillStyle = sea;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 60; i++) {
      const x = random() * 256;
      const y = random() * 128;
      g.fillStyle = 'rgba(140,140,160,0.35)';
      g.beginPath();
      g.arc(x, y, 1 + random() * 2.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(x - 0.5, y - 1.5, 1, 1);
    }
  });
}

/** A soft cool halo round the moon, brightest at its rim and fading out into the night. */
function moonHaloTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const halo = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    halo.addColorStop(0, 'rgba(220,228,255,0.9)');
    halo.addColorStop(0.14, 'rgba(200,210,255,0.55)');
    halo.addColorStop(0.35, 'rgba(160,160,240,0.18)');
    halo.addColorStop(1, 'rgba(120,100,220,0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, 128, 128);
  });
}

/** The stars of a hazy city night: few, faint, a handful bright enough to show a cross. */
function starsTexture(): CanvasTexture {
  return canvasTexture(2048, 512, (g) => {
    const random = seeded(8201);
    for (let i = 0; i < 900; i++) {
      const x = random() * 2048;
      const y = random() * 512;
      const fade = 0.25 + (1 - y / 512) * 0.6;
      const bright = random();
      g.fillStyle = `rgba(${bright < 0.2 ? '200,220,255' : '255,250,240'},${(fade * (0.3 + bright * 0.7)).toFixed(2)})`;
      const r = bright > 0.97 ? 2 : 1;
      g.fillRect(x, y, r, r);
      if (bright > 0.985) {
        g.fillRect(x - 3, y + 0.5, 7, 1);
        g.fillRect(x + 0.5, y - 3, 1, 7);
      }
    }
  });
}

/** Thin bands of cloud, violet underneath where the city lights them, dark above. */
function cloudTexture(): CanvasTexture {
  return canvasTexture(1024, 128, (g) => {
    const random = seeded(8211);
    for (let i = 0; i < 70; i++) {
      const x = random() * 1024;
      const y = 30 + random() * 70;
      const w = 40 + random() * 160;
      const h = 6 + random() * 14;
      const puff = g.createRadialGradient(x, y, 0, x, y, w / 2);
      puff.addColorStop(0, 'rgba(190,100,180,0.5)');
      puff.addColorStop(0.6, 'rgba(100,55,140,0.28)');
      puff.addColorStop(1, 'rgba(40,20,80,0)');
      g.fillStyle = puff;
      g.save();
      g.translate(x, y);
      g.scale(1, h / w);
      g.translate(-x, -y);
      g.fillRect(x - w / 2, y - w / 2, w, w);
      g.restore();
    }
  });
}

/** A light's reflection in a wet street: broken vertical streaks, brightest near the light. */
function reflectionTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    const random = seeded(8221);
    for (let i = 0; i < 40; i++) {
      const x = 8 + random() * 48;
      const w = 1 + random() * 4;
      const fall = g.createLinearGradient(0, 0, 0, 256);
      const a = 0.2 + random() * 0.5;
      fall.addColorStop(0, `rgba(255,255,255,${a})`);
      fall.addColorStop(0.5, `rgba(255,255,255,${a * 0.4})`);
      fall.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = fall;
      const y = random() * 40;
      g.fillRect(x, y, w, 256 - y - random() * 80);
    }
    // Fade the sides so a streak has no hard edge.
    const sides = g.createLinearGradient(0, 0, 64, 0);
    sides.addColorStop(0, 'rgba(0,0,0,1)');
    sides.addColorStop(0.25, 'rgba(0,0,0,0)');
    sides.addColorStop(0.75, 'rgba(0,0,0,0)');
    sides.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = sides;
    g.fillRect(0, 0, 64, 256);
  });
}

/** The warm pool a lamp throws on the wet ground. */
function poolTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    const pool = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    pool.addColorStop(0, 'rgba(255,220,170,0.7)');
    pool.addColorStop(0.5, 'rgba(255,200,140,0.22)');
    pool.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = pool;
    g.fillRect(0, 0, 64, 64);
  });
}

/**
 * A hotel lobby through its plate glass: warm light on a terrazzo floor, a reception desk,
 * potted palms, a chandelier's glow and the glazing bars of the shopfront.
 */
function lobbyTexture(seed: number): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    const random = seeded(seed);
    const wall = g.createLinearGradient(0, 0, 0, 128);
    wall.addColorStop(0, ['#ffd9a8', '#ffc8d8', '#c8f0ff', '#ffe8b8'][seed % 4]!);
    wall.addColorStop(0.7, '#e0a878');
    wall.addColorStop(1, '#6a4a48');
    g.fillStyle = wall;
    g.fillRect(0, 0, 512, 128);
    // Chandeliers' glow along the ceiling.
    for (let x = 60; x < 512; x += 130) {
      const lamp = g.createRadialGradient(x, 10, 0, x, 10, 40);
      lamp.addColorStop(0, 'rgba(255,255,240,0.95)');
      lamp.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = lamp;
      g.fillRect(x - 40, 0, 80, 50);
    }
    // The reception desk and some guests or potted palms.
    g.fillStyle = '#3a2a2a';
    g.fillRect(200, 78, 110, 34);
    g.fillStyle = '#f4e0c0';
    g.fillRect(200, 76, 110, 4);
    for (let i = 0; i < 6; i++) {
      const x = 20 + random() * 470;
      if (random() < 0.5) {
        g.fillStyle = '#2a4a2a';
        g.beginPath();
        g.arc(x, 74, 14, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#5a3a2a';
        g.fillRect(x - 6, 86, 12, 26);
      } else {
        g.fillStyle = ['#2a2a3a', '#7a2a4a', '#1a3a4a'][i % 3]!;
        g.fillRect(x - 5, 66, 10, 46);
        g.beginPath();
        g.arc(x, 60, 6, 0, Math.PI * 2);
        g.fill();
      }
    }
    // The terrazzo floor and the glazing bars.
    g.fillStyle = 'rgba(240,220,200,0.6)';
    g.fillRect(0, 112, 512, 16);
    g.fillStyle = '#1a1a22';
    for (let x = 0; x <= 512; x += 64) g.fillRect(x - 3, 0, 6, 128);
    g.fillRect(0, 0, 512, 5);
    g.fillRect(0, 122, 512, 6);
  });
}

/** A marquee's fascia: two rows of chase-light bulbs on a dark band. */
function bulbTexture(): CanvasTexture {
  return canvasTexture(256, 16, (g) => {
    g.fillStyle = '#1a1420';
    g.fillRect(0, 0, 256, 16);
    for (let x = 4; x < 256; x += 8)
      for (const y of [4, 12]) {
        g.fillStyle = Math.floor(x / 8) % 3 === 0 ? '#fffbe8' : '#7a5020';
        g.beginPath();
        g.arc(x, y, 2.4, 0, Math.PI * 2);
        g.fill();
      }
  });
}

/** Headlight beams on a wet road: two warm cones spreading and fading ahead of the car. */
function beamTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    for (const cx of [22, 42]) {
      const fall = g.createLinearGradient(0, 256, 0, 0);
      fall.addColorStop(0, 'rgba(255,240,210,0.7)');
      fall.addColorStop(1, 'rgba(255,240,210,0)');
      g.fillStyle = fall;
      g.beginPath();
      g.moveTo(cx - 3, 256);
      g.lineTo(cx + 3, 256);
      g.lineTo(cx + 14, 0);
      g.lineTo(cx - 14, 0);
      g.closePath();
      g.fill();
    }
  });
}

/** Broken lines of foam, bright where the wave curls and lacy behind it. */
function foamTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    const random = seeded(8241);
    for (let i = 0; i < 260; i++) {
      const x = Math.abs(random() - random()) * 64;
      const a = 0.25 + (1 - x / 64) * 0.6 * random();
      g.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
      g.fillRect(x, random() * 256, 1 + random() * 3, 4 + random() * 20);
    }
  });
}

/** A hotel's name in looping neon script, a tube of light with its glow, on clear glass. */
function scriptTexture(name: string, glow: number): CanvasTexture {
  const colour = `#${glow.toString(16).padStart(6, '0')}`;
  const title = name.charAt(0) + name.slice(1).toLowerCase();
  return canvasTexture(512, 128, (g) => {
    g.font = 'italic bold 84px "Brush Script MT", "Segoe Script", cursive, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = colour;
    g.shadowBlur = 18;
    g.lineWidth = 7;
    g.strokeStyle = colour;
    g.strokeText(title, 256, 66);
    g.shadowBlur = 0;
    g.lineWidth = 2.5;
    g.strokeStyle = '#ffffff';
    g.strokeText(title, 256, 66);
    // The underline swash.
    g.lineWidth = 5;
    g.strokeStyle = colour;
    g.beginPath();
    g.moveTo(90, 112);
    g.quadraticCurveTo(256, 96, 430, 110);
    g.stroke();
  });
}

/** Block capitals in neon tube on a dark sign box: VACANCY, OPEN and the like. */
function neonWordTexture(text: string, colour: string): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = 'rgba(16,10,20,0.85)';
    g.fillRect(0, 0, 256, 64);
    g.font = 'bold 36px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = colour;
    g.shadowBlur = 12;
    g.fillStyle = colour;
    g.fillText(text, 128, 34, 240);
    g.shadowBlur = 0;
    g.fillStyle = '#ffd8dc';
    g.fillText(text, 128, 34, 240);
  });
}

/** Uplight on a trunk: bright at the foot, fading as it climbs, streaked by the bark rings. */
function uplightTexture(): CanvasTexture {
  return canvasTexture(16, 128, (g) => {
    const fade = g.createLinearGradient(0, 128, 0, 0);
    fade.addColorStop(0, 'rgba(255,255,255,0.9)');
    fade.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 16, 128);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let y = 0; y < 128; y += 9) g.fillRect(0, y, 16, 2);
  });
}

/** A green street-name sign with a white border: OCEAN DR one side, a numbered street the other. */
function streetSignTexture(): CanvasTexture {
  return canvasTexture(256, 48, (g) => {
    g.fillStyle = '#0f6a3a';
    g.fillRect(0, 0, 256, 48);
    g.strokeStyle = '#f4f4f0';
    g.lineWidth = 3;
    g.strokeRect(4, 4, 248, 40);
    g.fillStyle = '#f4f4f0';
    g.font = 'bold 28px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('OCEAN DR', 128, 26);
  });
}

/**
 * The glitter of a moon path: short bright dashes across the swell, thick down the middle and
 * thinning to nothing at the sides.
 */
function glitterTexture(): CanvasTexture {
  return canvasTexture(128, 512, (g) => {
    const random = seeded(8251);
    for (let i = 0; i < 1400; i++) {
      const spread = (random() + random() + random()) / 3;
      const x = spread * 128;
      const edge = 1 - Math.abs(spread - 0.5) * 2;
      g.fillStyle = `rgba(255,255,255,${(edge * (0.3 + random() * 0.7)).toFixed(2)})`;
      g.fillRect(x - 4, random() * 512, 3 + random() * 10 * edge, 1 + random() * 3);
    }
  });
}

/** The sea wall's face: pastel stucco panels framed by pilasters every 4 m. */
function seaWallTexture(): CanvasTexture {
  return canvasTexture(32, 128, (g) => {
    speckle(g, 32, 128, '#c8b0c8', 8271);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(0, 0, 32, 10);
    g.fillStyle = 'rgba(60,40,70,0.35)';
    g.fillRect(0, 10, 32, 2);
    g.fillRect(4, 18, 24, 2);
    g.fillRect(4, 118, 24, 2);
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.fillRect(4, 20, 2, 98);
  });
}

/** A soft rectangular glow: bright across its middle, falling away to nothing at its edges. */
function auraTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    const across = g.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, 'rgba(255,255,255,0)');
    across.addColorStop(0.5, 'rgba(255,255,255,1)');
    across.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = across;
    g.fillRect(0, 0, 64, 64);
    g.globalCompositeOperation = 'destination-in';
    const down = g.createLinearGradient(0, 0, 0, 64);
    down.addColorStop(0, 'rgba(0,0,0,0)');
    down.addColorStop(0.25, 'rgba(0,0,0,1)');
    down.addColorStop(0.75, 'rgba(0,0,0,1)');
    down.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = down;
    g.fillRect(0, 0, 64, 64);
  });
}

/** A raindrop's ring on a puddle: a thin bright circle with a fainter one inside it. */
function rippleTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.strokeStyle = 'rgba(220,230,255,0.9)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(32, 32, 28, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = 'rgba(220,230,255,0.4)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(32, 32, 18, 0, Math.PI * 2);
    g.stroke();
  });
}

/** A cruise ship's decks at night: rows of cabin windows and balconies, most of them lit. */
function cabinTexture(lit: boolean): CanvasTexture {
  return canvasTexture(512, 32, (g) => {
    g.fillStyle = lit ? '#000' : '#9a9aa8';
    g.fillRect(0, 0, 512, 32);
    const random = seeded(8291);
    for (let x = 2; x < 512; x += 5) {
      g.fillStyle = random() < 0.7 ? (random() < 0.8 ? '#ffe0a8' : '#a8d8ff') : '#2a2a3a';
      g.fillRect(x, 8, 3, 14);
    }
    g.fillStyle = lit ? '#000' : '#3a3a4a';
    g.fillRect(0, 26, 512, 2);
  });
}

/** A searchlight's beam: brightest at the lamp and fading up into the haze. */
function searchlightTexture(): CanvasTexture {
  return canvasTexture(16, 256, (g) => {
    const fade = g.createLinearGradient(0, 256, 0, 0);
    fade.addColorStop(0, 'rgba(240,235,255,1)');
    fade.addColorStop(0.15, 'rgba(220,200,255,0.55)');
    fade.addColorStop(0.6, 'rgba(200,170,255,0.15)');
    fade.addColorStop(1, 'rgba(190,160,255,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 16, 256);
  });
}

/** A nightclub's sign: CLUB in pink neon over an arrow of chasing bulbs pointing at the door. */
function clubTexture(): CanvasTexture {
  return canvasTexture(256, 96, (g) => {
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = '#ff3fb4';
    g.shadowBlur = 14;
    g.fillStyle = '#ff3fb4';
    g.fillText('CLUB', 112, 34);
    g.shadowBlur = 0;
    g.fillStyle = '#ffe0f0';
    g.fillText('CLUB', 112, 34);
    g.fillStyle = '#ffd060';
    for (let x = 16; x < 220; x += 12) {
      g.beginPath();
      g.arc(x, 76, 3.5, 0, Math.PI * 2);
      g.fill();
    }
    g.beginPath();
    g.moveTo(222, 62);
    g.lineTo(246, 76);
    g.lineTo(222, 90);
    g.closePath();
    g.fill();
  });
}

/** Glass blocks lit from the stair behind: a grid of squares, each glowing at its heart. */
function glassBlockTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    g.fillStyle = '#d8d0c8';
    g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 16)
      for (let x = 0; x < 64; x += 16) {
        const glow = g.createRadialGradient(x + 8, y + 8, 0, x + 8, y + 8, 9);
        glow.addColorStop(0, '#fff4dc');
        glow.addColorStop(0.6, '#e8c8a0');
        glow.addColorStop(1, '#8a7a7a');
        g.fillStyle = glow;
        g.fillRect(x + 1, y + 1, 14, 14);
      }
  });
}

/** A causeway's traffic far off: white headlights in one lane, red tail lights in the other. */
function trafficStreamTexture(): CanvasTexture {
  return canvasTexture(256, 16, (g) => {
    const random = seeded(8311);
    for (let i = 0; i < 14; i++) {
      g.fillStyle = '#fff4d8';
      const x = random() * 256;
      g.fillRect(x, 2, 3, 4);
      g.fillRect(x + 5, 2, 3, 4);
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = '#ff3030';
      const x = random() * 256;
      g.fillRect(x, 10, 3, 4);
      g.fillRect(x + 5, 10, 3, 4);
    }
  });
}

/** The bike lane: worn green paint with a white bicycle and arrow, and a white line inside. */
function bikeLaneTexture(): CanvasTexture {
  return canvasTexture(64, 1024, (g) => {
    g.fillStyle = 'rgba(40,150,90,0.75)';
    g.fillRect(0, 0, 64, 1024);
    const random = seeded(8331);
    g.fillStyle = 'rgba(20,20,26,0.5)';
    for (let i = 0; i < 400; i++) g.fillRect(random() * 64, random() * 1024, 2, 2);
    g.fillStyle = 'rgba(240,240,236,0.9)';
    g.fillRect(0, 0, 4, 1024);
    // The bicycle, drawn long down the lane so it reads from a rider's low eye.
    g.strokeStyle = 'rgba(240,240,236,0.9)';
    g.lineWidth = 3;
    for (const cy of [420, 560]) {
      g.save();
      g.translate(32, cy);
      g.scale(1, 3);
      g.beginPath();
      g.arc(0, 0, 11, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    g.beginPath();
    g.moveTo(32, 420);
    g.lineTo(32, 560);
    g.moveTo(22, 470);
    g.lineTo(42, 470);
    g.stroke();
    // The arrow ahead of it.
    g.beginPath();
    g.moveTo(32, 330);
    g.lineTo(32, 230);
    g.moveTo(20, 270);
    g.lineTo(32, 230);
    g.lineTo(44, 270);
    g.stroke();
  });
}

/** A backlit poster: a striped retro sunset over the sea, a palm and the words MIAMI NIGHTS. */
function posterTexture(): CanvasTexture {
  return canvasTexture(128, 192, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 120);
    sky.addColorStop(0, '#2a0a4a');
    sky.addColorStop(1, '#ff4f8a');
    g.fillStyle = sky;
    g.fillRect(0, 0, 128, 192);
    g.fillStyle = '#ffd040';
    g.beginPath();
    g.arc(64, 100, 34, Math.PI, 0);
    g.fill();
    g.fillStyle = '#ff4f8a';
    for (let y = 76; y < 100; y += 7) g.fillRect(28, y, 72, 2);
    g.fillStyle = '#1a1040';
    g.fillRect(0, 100, 128, 92);
    g.fillStyle = '#2fe6ff';
    for (let y = 106; y < 140; y += 6) g.fillRect(64 - (y - 100), y, (y - 100) * 2, 1);
    g.fillStyle = '#100820';
    g.fillRect(96, 40, 4, 62);
    g.beginPath();
    g.ellipse(98, 40, 18, 5, 0.3, 0, Math.PI * 2);
    g.fill();
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'center';
    g.fillStyle = '#ffffff';
    g.fillText('MIAMI', 64, 165);
    g.fillStyle = '#2fe6ff';
    g.font = 'bold 14px sans-serif';
    g.fillText('NIGHTS', 64, 182);
  });
}

/**
 * The trolley's sides: green below and orange above with a cream stripe, a row of windows
 * along the top half (lit inside, for the emissive map) and TROLLEY lettered on its flank.
 */
function trolleyTexture(lit: boolean): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = lit ? '#000' : '#2a8a4a';
    g.fillRect(0, 0, 256, 64);
    if (!lit) {
      g.fillStyle = '#f08a20';
      g.fillRect(0, 0, 256, 30);
      g.fillStyle = '#f4f0e0';
      g.fillRect(0, 30, 256, 4);
    }
    for (let x = 8; x < 248; x += 20) {
      g.fillStyle = lit ? '#ffe8b8' : '#3a3a40';
      g.fillRect(x, 6, 16, 20);
    }
    g.fillStyle = lit ? '#000' : '#f4f0e0';
    g.font = 'bold 16px sans-serif';
    g.textAlign = 'center';
    g.fillText('TROLLEY', 128, 54);
  });
}

/** Bougainvillea: dark leaves under a scatter of magenta bracts. */
function blossomTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#2a4a2a';
    g.fillRect(0, 0, 64, 64);
    const random = seeded(8341);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = random() < 0.8 ? '#e0208a' : '#ff6ab8';
      g.beginPath();
      g.arc(random() * 64, random() * 64, 1.5 + random() * 2, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** A neon figure in tubes of light with their glow: a flamingo, palm, cocktail or moon. */
function iconTexture(kind: 'flamingo' | 'palm' | 'cocktail' | 'moon'): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const tube = (colour: string, draw: () => void) => {
      for (const [w, c, blur] of [
        [10, colour, 22],
        [3.5, '#ffffff', 0],
      ] as const) {
        g.lineWidth = w;
        g.strokeStyle = c;
        g.shadowColor = colour;
        g.shadowBlur = blur;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.beginPath();
        draw();
        g.stroke();
      }
    };
    if (kind === 'flamingo')
      tube('#ff4fb8', () => {
        g.moveTo(150, 60);
        g.bezierCurveTo(120, 40, 100, 70, 130, 100);
        g.bezierCurveTo(160, 130, 90, 150, 90, 170);
        g.bezierCurveTo(90, 200, 170, 200, 180, 170);
        g.bezierCurveTo(185, 150, 150, 150, 130, 165);
        g.moveTo(140, 195);
        g.lineTo(140, 245);
        g.moveTo(150, 60);
        g.lineTo(172, 72);
      });
    if (kind === 'palm')
      tube('#5aff8a', () => {
        g.moveTo(128, 245);
        g.quadraticCurveTo(120, 160, 140, 90);
        for (const [x, y] of [
          [60, 110],
          [80, 60],
          [140, 40],
          [200, 70],
          [215, 120],
        ]) {
          g.moveTo(140, 90);
          g.quadraticCurveTo((140 + x) / 2, y - 25, x, y);
        }
      });
    if (kind === 'cocktail')
      tube('#2fe6ff', () => {
        g.moveTo(60, 70);
        g.lineTo(196, 70);
        g.lineTo(128, 150);
        g.closePath();
        g.moveTo(128, 150);
        g.lineTo(128, 220);
        g.moveTo(88, 225);
        g.lineTo(168, 225);
        g.moveTo(150, 90);
        g.lineTo(190, 30);
      });
    if (kind === 'moon')
      tube('#ffd23f', () => {
        g.arc(128, 128, 90, Math.PI * 0.35, Math.PI * 1.65);
        g.bezierCurveTo(
          120,
          230,
          120,
          30,
          128 + 90 * Math.cos(Math.PI * 0.35),
          128 + 90 * Math.sin(Math.PI * 0.35),
        );
      });
  });
}

/** The gateway's board: OCEAN in pink neon and DRIVE in cyan, glowing on dark enamel. */
function gatewayTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = '#140c1c';
    g.fillRect(0, 0, 512, 64);
    g.font = 'bold 46px sans-serif';
    g.textBaseline = 'middle';
    for (const [text, x, colour] of [
      ['OCEAN', 70, '#ff3fb4'],
      ['DRIVE', 280, '#2fe6ff'],
    ] as const) {
      g.shadowColor = colour;
      g.shadowBlur = 16;
      g.fillStyle = colour;
      g.fillText(text, x, 34);
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.fillText(text, x, 34);
    }
  });
}

/** A soft puff of steam, densest at its heart and wisping out to nothing. */
function steamTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    const random = seeded(8361);
    for (let i = 0; i < 9; i++) {
      const x = 22 + random() * 20;
      const y = 22 + random() * 20;
      const r = 10 + random() * 14;
      const puff = g.createRadialGradient(x, y, 0, x, y, r);
      puff.addColorStop(0, 'rgba(255,255,255,0.35)');
      puff.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = puff;
      g.fillRect(0, 0, 64, 64);
    }
  });
}

/** An LED banner towed behind a plane: MIAMI NIGHTS in bright pink and cyan dots. */
function ledBannerTexture(): CanvasTexture {
  return canvasTexture(512, 72, (g) => {
    g.fillStyle = '#0a0612';
    g.fillRect(0, 0, 512, 72);
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ff4fb8';
    g.fillText('MIAMI', 150, 38);
    g.fillStyle = '#2fe6ff';
    g.fillText('NIGHTS', 360, 38);
    // The LED grid over the letters.
    g.fillStyle = 'rgba(10,6,18,0.55)';
    for (let x = 0; x < 512; x += 4) g.fillRect(x, 0, 1, 72);
    for (let y = 0; y < 72; y += 4) g.fillRect(0, y, 512, 1);
  });
}

/** A cart's lit menu board: HELADOS and TACOS in bright lettering with prices. */
function menuTexture(): CanvasTexture {
  return canvasTexture(256, 120, (g) => {
    g.fillStyle = '#1a1028';
    g.fillRect(0, 0, 256, 120);
    g.strokeStyle = '#ffd23f';
    g.lineWidth = 4;
    g.strokeRect(4, 4, 248, 112);
    g.font = 'bold 36px sans-serif';
    g.textAlign = 'center';
    g.fillStyle = '#ff4fb8';
    g.fillText('HELADOS', 128, 46);
    g.font = 'bold 26px sans-serif';
    g.fillStyle = '#2fe6ff';
    g.fillText('TACOS · AGUA', 128, 82);
    g.font = '18px sans-serif';
    g.fillStyle = '#f4f0e8';
    g.fillText('$3 · $5 · $2', 128, 106);
  });
}

/** A cab's chequered band: two rows of black and white squares. */
function checkerTexture(): CanvasTexture {
  return canvasTexture(128, 16, (g) => {
    for (let x = 0; x < 128; x += 8)
      for (let y = 0; y < 16; y += 8) {
        g.fillStyle = (x + y) % 16 === 0 ? '#111' : '#f4f4f0';
        g.fillRect(x, y, 8, 8);
      }
  });
}

/** A wedge sports car's side strakes: horizontal black slats over its intakes. */
function strakeTexture(): CanvasTexture {
  return canvasTexture(64, 32, (g) => {
    g.fillStyle = '#d8d8d4';
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#101014';
    for (let y = 3; y < 32; y += 6) g.fillRect(0, y, 64, 3);
  });
}

/** Palm thatch: layered straw in browns and golds, hanging in ragged fringes. */
function thatchTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#8a6a3a';
    g.fillRect(0, 0, 64, 64);
    const random = seeded(8411);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = ['#b08a4a', '#6a4a2a', '#c8a060', '#5a3a1a'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 64, random() * 64, 1, 4 + random() * 10);
    }
  });
}

/**
 * A nightclub through its glass: a dark room cut by magenta and cyan laser beams, a mirror
 * ball's spots, dancers' silhouettes against a lit DJ booth.
 */
function clubFloorTexture(): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    g.fillStyle = '#12061e';
    g.fillRect(0, 0, 512, 128);
    const random = seeded(8421);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = i % 2 ? 'rgba(255,60,190,0.8)' : 'rgba(60,230,255,0.8)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(256 + (random() - 0.5) * 60, 4);
      g.lineTo(random() * 512, 128);
      g.stroke();
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = ['#ffffff', '#ff7ad0', '#7af0ff'][i % 3]!;
      g.fillRect(random() * 512, random() * 90, 2, 2);
    }
    g.fillStyle = '#3a1a5a';
    g.fillRect(200, 70, 112, 40);
    g.fillStyle = '#ff3fb4';
    g.fillRect(200, 70, 112, 4);
    for (let i = 0; i < 16; i++) {
      const x = 10 + random() * 490;
      g.fillStyle = '#05020a';
      g.beginPath();
      g.arc(x, 74, 7, 0, Math.PI * 2);
      g.fill();
      g.fillRect(x - 8, 80, 16, 48);
      if (random() < 0.5) g.fillRect(x - 12, 52, 4, 26);
    }
    g.fillStyle = '#1a1a22';
    for (let x = 0; x <= 512; x += 64) g.fillRect(x - 3, 0, 6, 128);
  });
}

/** A cocktail bar through its glass: a backlit wall of bottles, a bar and its stools. */
function cocktailBarTexture(): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    const wall = g.createLinearGradient(0, 0, 0, 128);
    wall.addColorStop(0, '#ff9ad8');
    wall.addColorStop(1, '#5a2a5a');
    g.fillStyle = wall;
    g.fillRect(0, 0, 512, 128);
    const random = seeded(8431);
    for (const y of [16, 40]) {
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.fillRect(20, y + 16, 472, 2);
      for (let x = 24; x < 488; x += 7) {
        g.fillStyle = ['#ffd060', '#60e0a0', '#a060ff', '#ff6060', '#f0f0f0'][
          Math.floor(random() * 5)
        ]!;
        g.fillRect(x, y + 2, 4, 14);
      }
    }
    g.fillStyle = '#2a1020';
    g.fillRect(0, 76, 512, 22);
    g.fillStyle = '#ffd0a0';
    g.fillRect(0, 74, 512, 3);
    for (let x = 30; x < 500; x += 44) {
      g.fillStyle = '#c8a050';
      g.fillRect(x - 8, 100, 16, 4);
      g.fillRect(x - 1, 104, 2, 24);
    }
    g.fillStyle = '#1a1a22';
    for (let x = 0; x <= 512; x += 64) g.fillRect(x - 3, 0, 6, 128);
  });
}

/** A puddle: a ragged dark pool, glossy, with the violet sky and a smear of neon in it. */
function puddleTexture(seed: number): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const random = seeded(seed);
    g.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 40 + random() * 20;
      const x = 64 + Math.cos(a) * r;
      const y = 64 + Math.sin(a) * r;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
    const pool = g.createLinearGradient(0, 0, 0, 128);
    pool.addColorStop(0, 'rgba(60,40,110,0.85)');
    pool.addColorStop(1, 'rgba(14,10,30,0.85)');
    g.fillStyle = pool;
    g.fill();
    g.save();
    g.clip();
    for (let i = 0; i < 3; i++) {
      g.fillStyle = ['rgba(255,63,180,0.45)', 'rgba(47,230,255,0.4)', 'rgba(255,220,160,0.4)'][
        Math.floor(random() * 3)
      ]!;
      const x = random() * 100;
      const w = 6 + random() * 12;
      for (let y = 0; y < 128; y += 3)
        g.fillRect(x + Math.sin(y * 0.4) * 2, y, w * (1 - y / 200), 2);
    }
    g.restore();
  });
}

/** A roof sign: the hotel's name in tall neon capitals on clear air, with their glow. */
function roofNameTexture(name: string, colour: string): CanvasTexture {
  return canvasTexture(512, 96, (g) => {
    g.font = 'bold 76px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = colour;
    g.shadowBlur = 20;
    g.fillStyle = colour;
    g.fillText(name, 256, 50, 500);
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.fillText(name, 256, 50, 500);
  });
}

/** A lamp-post banner: a coloured pennant with white words down it and a palm at its foot. */
function lampBannerTexture(text: string, colour: string): CanvasTexture {
  return canvasTexture(64, 176, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 64, 176);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(0, 0, 64, 6);
    g.save();
    g.translate(36, 88);
    g.rotate(-Math.PI / 2);
    g.font = 'bold 22px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 0, 160);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(14, 172);
    g.quadraticCurveTo(12, 150, 18, 140);
    for (const a of [-0.8, -0.2, 0.4, 1]) {
      g.moveTo(18, 140);
      g.lineTo(18 + Math.cos(a) * 12 * Math.sign(a + 0.01), 140 + Math.sin(a) * 6);
    }
    g.stroke();
  });
}

/** A storm cloud's underside lit from within: a soft lumpy glow, brightest at its heart. */
function stormCloudTexture(): CanvasTexture {
  return canvasTexture(256, 128, (g) => {
    const random = seeded(8461);
    for (let i = 0; i < 24; i++) {
      const x = 40 + random() * 176;
      const y = 30 + random() * 70;
      const r = 20 + random() * 40;
      const puff = g.createRadialGradient(x, y, 0, x, y, r);
      puff.addColorStop(0, 'rgba(255,255,255,0.35)');
      puff.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = puff;
      g.fillRect(0, 0, 256, 128);
    }
  });
}

/** A fork of lightning: a jagged white-hot stroke with a branch, in a violet glow. */
function boltTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    const random = seeded(8471);
    const stroke = (width: number, colour: string, blur: number) => {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.shadowColor = '#b8a0ff';
      g.shadowBlur = blur;
      g.beginPath();
      let x = 32;
      g.moveTo(x, 0);
      const rand = seeded(8473);
      for (let y = 0; y < 256; y += 18) {
        x += (rand() - 0.5) * 18;
        g.lineTo(x, y);
      }
      g.moveTo(30, 90);
      g.lineTo(14, 130);
      g.lineTo(18, 170);
      g.stroke();
    };
    stroke(6, 'rgba(200,180,255,0.6)', 12);
    stroke(2, '#ffffff', 0);
    void random;
  });
}

/** A cruiser's white doors: POLICE in blue capitals with a thin blue stripe under it. */
function policeDoorTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = '#1a3a9a';
    g.fillRect(0, 48, 256, 5);
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    g.fillText('POLICE', 128, 38);
  });
}

/** A bank of sea mist: soft lumpy bands, thickest along their middle, wisping out above. */
function seaMistTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    const random = seeded(8491);
    for (let i = 0; i < 70; i++) {
      const x = random() * 512;
      const y = 28 + (random() - 0.5) * 24;
      const r = 14 + random() * 30;
      const puff = g.createRadialGradient(x, y, 0, x, y, r);
      puff.addColorStop(0, 'rgba(255,255,255,0.32)');
      puff.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = puff;
      g.fillRect(x - r, 0, r * 2, 64);
    }
  });
}

/** A rainbow crossing: bars of red, orange, yellow, green, blue and violet, worn in the wheel tracks. */
function rainbowTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    const colours = ['#e8303a', '#f08a30', '#f4d040', '#3ab060', '#3060d0', '#8040b0'];
    for (let x = 0, i = 0; x < 512; x += 40, i++) {
      g.fillStyle = colours[i % colours.length]!;
      g.fillRect(x + 4, 0, 30, 64);
    }
    g.globalCompositeOperation = 'destination-out';
    const random = seeded(8511);
    for (let i = 0; i < 900; i++) {
      const track = [120, 170, 340, 390][i % 4]!;
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(track + (random() - 0.5) * 50, random() * 64, 2 + random() * 4, 2 + random() * 4);
    }
  });
}

/** A chalkboard A-frame: three lines chalked in white and pink inside a timber frame. */
function chalkboardTexture(lines: readonly string[]): CanvasTexture {
  return canvasTexture(96, 144, (g) => {
    g.fillStyle = '#6a4a2a';
    g.fillRect(0, 0, 96, 144);
    g.fillStyle = '#1e2420';
    g.fillRect(6, 6, 84, 132);
    g.textAlign = 'center';
    lines.forEach((line, i) => {
      g.fillStyle = i === 2 ? '#ff9ad0' : '#f4f0e8';
      g.font = `bold ${i === 2 ? 20 : 18}px sans-serif`;
      g.fillText(line, 48, 40 + i * 36, 80);
    });
  });
}

/** One giant block letter in a bright colour with a darker outline, on clear ground. */
function letterTexture(ch: string, colour: string): CanvasTexture {
  return canvasTexture(128, 160, (g) => {
    g.font = 'bold 170px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 8;
    g.strokeStyle = 'rgba(20,10,30,0.8)';
    g.strokeText(ch, 64, 88, 124);
    g.fillStyle = colour;
    g.fillText(ch, 64, 88, 124);
  });
}

/**
 * Thin cloud across the moon, backlit: soft dark violet bodies, and round their outer edge a
 * bright silver rim where the moonlight catches them (the rim drawn first, larger, and the
 * bodies laid over it so only the outline shows).
 */
function silverCloudTexture(): CanvasTexture {
  return canvasTexture(256, 96, (g) => {
    const puffs: [number, number, number][] = [];
    const random = seeded(8561);
    for (let i = 0; i < 18; i++)
      puffs.push([30 + random() * 196, 44 + (random() - 0.5) * 26, 12 + random() * 18]);
    for (const [x, y, r] of puffs) {
      const rim = g.createRadialGradient(x, y, r * 0.6, x, y, r + 5);
      rim.addColorStop(0, 'rgba(230,232,255,0.7)');
      rim.addColorStop(1, 'rgba(230,232,255,0)');
      g.fillStyle = rim;
      g.beginPath();
      g.arc(x, y, r + 5, 0, Math.PI * 2);
      g.fill();
    }
    for (const [x, y, r] of puffs) {
      const body = g.createRadialGradient(x, y, 0, x, y, r);
      body.addColorStop(0, 'rgba(46,34,76,0.9)');
      body.addColorStop(0.8, 'rgba(56,42,90,0.75)');
      body.addColorStop(1, 'rgba(70,56,110,0.35)');
      g.fillStyle = body;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/**
 * A street mural: a sunset of bold stripes behind palms and a giant flamingo, or waves and a
 * sun, painted edge to edge in saturated colour with a black outline, signed in the corner.
 */
function muralTexture(seed: number): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const random = seeded(seed);
    const palette = ['#ff3f8a', '#ffd23f', '#2fc8e6', '#5aff8a', '#9a5aff', '#ff7a3f'];
    for (let y = 0, i = seed; y < 256; y += 24, i++) {
      g.fillStyle = palette[i % palette.length]!;
      g.fillRect(0, y, 256, 24);
    }
    g.fillStyle = palette[(seed + 1) % palette.length]!;
    g.beginPath();
    g.arc(128, 140, 70, Math.PI, 0);
    g.fill();
    g.strokeStyle = '#141018';
    g.lineWidth = 6;
    g.stroke();
    // Waves along the bottom.
    g.fillStyle = '#1a3a8a';
    g.beginPath();
    g.moveTo(0, 256);
    for (let x = 0; x <= 256; x += 8) g.lineTo(x, 200 + Math.sin(x / 18 + seed) * 10);
    g.lineTo(256, 256);
    g.fill();
    g.stroke();
    // A palm silhouette and a big eye or flamingo shape.
    g.fillStyle = '#141018';
    const px = 30 + random() * 40;
    g.fillRect(px, 90, 8, 120);
    for (let a = 0; a < 6; a++) {
      g.beginPath();
      g.ellipse(px + 4, 90, 40, 8, -Math.PI / 2 + (a - 2.5) * 0.45, 0, Math.PI * 2);
      g.fill();
    }
    g.lineWidth = 10;
    g.strokeStyle = '#ff6ab0';
    g.beginPath();
    g.moveTo(200, 210);
    g.lineTo(200, 160);
    g.bezierCurveTo(170, 140, 230, 90, 200, 70);
    g.stroke();
    g.fillStyle = '#ff6ab0';
    g.beginPath();
    g.ellipse(190, 150, 24, 14, 0.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f4f0e8';
    g.font = 'italic 14px sans-serif';
    g.fillText('wz', 226, 248);
  });
}

/** A shooting star's streak: a white-hot head trailing a fading tail. */
function meteorTexture(): CanvasTexture {
  return canvasTexture(256, 8, (g) => {
    const tail = g.createLinearGradient(0, 0, 256, 0);
    tail.addColorStop(0, 'rgba(200,210,255,0)');
    tail.addColorStop(0.85, 'rgba(230,235,255,0.7)');
    tail.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = tail;
    g.fillRect(0, 2, 256, 4);
  });
}

/** A clock face: cream enamel, bold deco numerals at the quarters and ticks between, a ring. */
function clockFaceTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    g.fillStyle = 'rgba(0,0,0,0)';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#f4ecd8';
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#2a2030';
    g.lineWidth = 5;
    g.stroke();
    g.fillStyle = '#2a2030';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.save();
      g.translate(64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48);
      g.rotate(a);
      g.fillRect(-2, -6, 4, 12);
      g.restore();
    }
    g.font = 'bold 18px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('XII', 64, 30);
    g.fillText('VI', 64, 100);
    g.fillText('III', 98, 64);
    g.fillText('IX', 30, 64);
  });
}
