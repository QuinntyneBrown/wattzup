// Westminster Rush Hour's street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1):
// Westminster Bridge at dusk. The rider keeps left on the bridge with a red bus lane beside them;
// red double-deckers and black cabs race them in it and stream the other way on the right.
// Green triple-lantern standards line the parapets, commuters walk the pavements, the Thames runs
// below, and the Palace of Westminster glows gold ahead under Elizabeth Tower's lit clock faces.
// Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import type { BufferAttribute } from 'three/webgpu';
import {
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
  Vector3,
} from 'three/webgpu';
import {
  bob,
  canvasTexture,
  legPair,
  loopFade,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import type { StreetPoint } from './world-oldtown';

/** The bridge repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 400;
const BEHIND = 24;
const KERB = 0.15;
/** The red bus lane runs left of the rider's lane, out to the left kerb. */
const BUS_LANE = 6.8;
/** The oncoming carriageway runs right of the rider's lane, out to the right kerb. */
const ONCOMING = 10;
/** Each pavement is 3 m wide, out to the parapet. */
const LEFT_PARAPET = BUS_LANE + 3.1;
const RIGHT_PARAPET = ONCOMING + 3.1;
/** The Thames lies this far below the deck. */
const RIVER = 7.5;
/** The palace and the tower stand a fixed distance ahead, hazed by hand. */
const TOWER_AHEAD = 400;
const TOWER_X = 44;
const HAZE = 0x8f8597;

/** The vehicles in the traffic: a double-decker or a cab, its lane, speed and paint. */
interface Vehicle {
  readonly mesh: Group;
  readonly x: number;
  /** Metres per second along the road: positive with the rider, negative towards them. */
  readonly speed: number;
  readonly offset: number;
}

interface Walker {
  readonly side: -1 | 1;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly height: number;
  readonly phase: number;
}

const COATS = ['#1d1f24', '#2b3445', '#4a3b30', '#6b2b2b', '#3b4a3a', '#8a7a62', '#20242c'];
const TROUSERS = ['#15171b', '#24262b', '#2f3e5c', '#3a3a3a'];
const SKINS = ['#5a3a29', '#8d5a3b', '#c48a5f', '#e2b48c', '#f0c8a0', '#3f2a1f'];

export class WestminsterStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly vehicles: Vehicle[] = [];
  private readonly walkers: Walker[] = [];
  private bodies: InstancedMesh | null = null;
  private legs: InstancedMesh | null = null;
  private heads: InstancedMesh | null = null;
  private readonly landmarks = new Group();
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3(1, 1, 1);
  private readonly up = new Vector3(0, 1, 0);

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit, this.wheel);
    this.addDeck(roadHalf, points);
    this.addLamps();
    this.addTraffic(roadHalf);
    this.addWalkers();
    this.addPalace();
    this.addBanks();
  }

  setTime(seconds: number): void {
    this.time = seconds;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground falls away under the bridge to the river bed. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - RIVER - 2);
      position.setY(i * 2 + 1, p.height - RIVER - 2);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres) + KERB, -metres);
    }
    for (const v of this.vehicles) {
      const metres = loopMetres(v.offset + v.speed * this.time, s, LOOP, BEHIND);
      v.mesh.position.set(v.x, heightAt(metres), -metres);
      v.mesh.scale.setScalar(loopFade(metres, LOOP, BEHIND));
    }
    this.placeWalkers(s, heightAt);
    this.landmarks.position.set(0, heightAt(1e6), -TOWER_AHEAD);
  }

  private placeWalkers(s: number, heightAt: (metres: number) => number): void {
    const { bodies, legs, heads } = this;
    if (!bodies || !legs || !heads) return;
    this.walkers.forEach((w, i) => {
      const metres = loopMetres(w.offset + w.speed * this.time, s, LOOP, BEHIND);
      const y = heightAt(metres) + KERB;
      const step = bob(this.time * 5.5 + w.phase) * 0.04;
      this.turn.setFromAxisAngle(this.up, w.speed > 0 ? 0 : Math.PI);
      this.size.setScalar(w.height * loopFade(metres, LOOP, BEHIND));
      this.spot.set(w.x, y + step, -metres);
      legs.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      this.spot.set(w.x, y + 1.15 * w.height + step, -metres);
      bodies.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
      this.spot.set(w.x, y + 1.6 * w.height + step, -metres);
      heads.setMatrixAt(i, this.matrix.compose(this.spot, this.turn, this.size));
    });
    for (const mesh of [bodies, legs, heads]) mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * The bridge deck: the red bus lane, the oncoming carriageway with its white lines, kerbs and
   * pavements, the green balustrades and their stone copings, and the Thames below.
   */
  private addDeck(roadHalf: number, points: number): void {
    const r = roadHalf;
    const bus = this.material({ map: this.repeat(busLaneTexture(), BUS_LANE - r, 12) });
    const tarmac = this.material({
      map: this.repeat(carriagewayTexture(), ONCOMING - r, 12),
      roughness: 0.55,
    });
    const paving = this.material({ map: this.repeat(pavingTexture(), 3, 3), roughness: 0.8 });
    const iron = this.material({
      map: this.repeat(balustradeTexture(), 1 / 1.1, 1 / 2.4),
      alphaTest: 0.5,
      side: DoubleSide,
      color: 0x2f5d45,
      metalness: 0.4,
      roughness: 0.5,
    });
    const coping = this.material({ color: 0x9d9686, roughness: 0.85 });
    const fascia = this.material({ color: 0x2b4a39, roughness: 0.6, metalness: 0.3 });
    const river = this.material({
      map: this.repeat(riverTexture(), 30, 30),
      color: 0x8a8296,
      roughness: 0.1,
      metalness: 0.2,
    });
    this.ribbons.add(points, bus, [
      [-r, 0.005],
      [-BUS_LANE, 0.005],
    ]);
    this.ribbons.add(points, tarmac, [
      [ONCOMING, 0.005],
      [r, 0.005],
    ]);
    this.ribbons.add(points, paving, [
      [RIGHT_PARAPET, KERB],
      [ONCOMING + 0.2, KERB],
      [ONCOMING, 0],
    ]);
    this.ribbons.add(points, paving, [
      [-BUS_LANE, 0],
      [-BUS_LANE - 0.2, KERB],
      [-LEFT_PARAPET, KERB],
    ]);
    for (const side of [-1, 1] as const) {
      const x = side < 0 ? -LEFT_PARAPET : RIGHT_PARAPET;
      const out = x + side * 0.35;
      // The balustrade, the coping on top and the bridge's painted face down to the water.
      this.ribbons.add(
        points,
        iron,
        side < 0
          ? [
              [x, KERB],
              [x, KERB + 1.0],
            ]
          : [
              [x, KERB + 1.0],
              [x, KERB],
            ],
      );
      this.ribbons.add(
        points,
        coping,
        side < 0
          ? [
              [x + 0.1, KERB + 1.0],
              [x + 0.1, KERB + 1.12],
              [out, KERB + 1.12],
            ]
          : [
              [out, KERB + 1.12],
              [x - 0.1, KERB + 1.12],
              [x - 0.1, KERB + 1.0],
            ],
      );
      this.ribbons.add(
        points,
        fascia,
        side < 0
          ? [
              [out, KERB + 1.12],
              [out, -1.6],
            ]
          : [
              [out, -1.6],
              [out, KERB + 1.12],
            ],
      );
    }
    this.ribbons.add(points, river, [
      [600, -RIVER],
      [-600, -RIVER],
    ]);
  }

  /** Westminster Bridge's green standards on the parapets, three lit lanterns on each. */
  private addLamps(): void {
    const green = this.material({ color: 0x24503b, metalness: 0.5, roughness: 0.45 });
    const glass = this.material({
      color: 0xfff1c8,
      emissive: 0xffc46b,
      emissiveIntensity: 2.2,
      roughness: 0.3,
    });
    const base = new CylinderGeometry(0.28, 0.36, 1.2, 10);
    base.translate(0, 0.6, 0);
    const pole = new CylinderGeometry(0.09, 0.13, 5.2, 10);
    pole.translate(0, 3.8, 0);
    const arm = new BoxGeometry(1.9, 0.1, 0.1);
    arm.translate(0, 5.9, 0);
    const lantern = new CylinderGeometry(0.2, 0.14, 0.55, 6);
    const cap = new ConeGeometry(0.26, 0.3, 6);
    this.disposables.push(base, pole, arm, lantern, cap);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 25) {
        const lamp = new Group();
        lamp.add(new Mesh(base, green), new Mesh(pole, green), new Mesh(arm, green));
        for (const [dx, y] of [
          [-0.9, 6.25],
          [0.9, 6.25],
          [0, 6.75],
        ] as const) {
          const l = new Mesh(lantern, glass);
          l.position.set(dx, y, 0);
          const c = new Mesh(cap, green);
          c.position.set(dx, y + 0.42, 0);
          lamp.add(l, c);
        }
        lamp.rotation.y = Math.PI / 2;
        lamp.children.forEach((m) => (m.castShadow = true));
        this.group.add(lamp);
        const x = side < 0 ? -LEFT_PARAPET + 0.45 : RIGHT_PARAPET - 0.45;
        this.props.push({ mesh: lamp, offset: offset + (side > 0 ? 12 : 0), x });
      }
    }
  }

  /**
   * Rush-hour traffic: double-deckers and cabs in the bus lane racing the rider, and both lanes
   * of the oncoming carriageway streaming towards them with their headlamps on.
   */
  private addTraffic(roadHalf: number): void {
    const random = seeded(61);
    const kinds: { x: number; speed: () => number; count: number }[] = [
      { x: -(roadHalf + (BUS_LANE - roadHalf) / 2), speed: () => 5 + random() * 3, count: 5 },
      { x: roadHalf + 1.7, speed: () => -(8 + random() * 4), count: 6 },
      { x: ONCOMING - 1.6, speed: () => -(6 + random() * 3), count: 6 },
    ];
    for (const kind of kinds) {
      // A lane moves at one speed, so its vehicles keep their order and never drive through
      // each other (#897).
      const speed = kind.speed();
      for (let i = 0; i < kind.count; i++) {
        const isBus = random() < 0.5;
        const mesh = isBus ? this.bus() : this.cab();
        // Oncoming traffic faces the rider.
        if (speed < 0) mesh.rotation.y = Math.PI;
        this.group.add(mesh);
        this.vehicles.push({
          mesh,
          x: kind.x,
          speed,
          offset: (i * LOOP) / kind.count + random() * 20,
        });
      }
    }
  }

  private readonly wheel = new CylinderGeometry(0.5, 0.5, 0.3, 14);

  /** A red double-decker: two decks of lit windows, a destination blind, lamps front and back. */
  private bus(): Group {
    const bus = new Group();
    const red = this.material({ color: 0xc8102e, roughness: 0.35, metalness: 0.2 });
    const glazing = this.material({ map: this.track(busWindowTexture()), roughness: 0.2 });
    const blind = this.material({ color: 0x111111, emissive: 0xffc400, emissiveIntensity: 1.4 });
    const dark = this.material({ color: 0x15161a, roughness: 0.7 });
    const head = this.material({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 3 });
    const tail = this.material({ color: 0x550000, emissive: 0xff1a1a, emissiveIntensity: 2.5 });
    const box = (m: Material | Material[], w: number, h: number, d: number, y: number, z = 0) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(0, y + h / 2, z);
      mesh.castShadow = true;
      bus.add(mesh);
      return mesh;
    };
    // The body is 11 m long and 4.4 m high, its front towards -z.
    box(red, 2.5, 4.1, 11, 0.3);
    box([glazing, glazing, red, red, red, red], 2.52, 1.0, 10.4, 1.5);
    box([glazing, glazing, red, red, red, red], 2.52, 1.0, 10.4, 3.1);
    box(dark, 2.45, 0.12, 10.9, 4.4);
    box(dark, 2.3, 0.9, 0.04, 1.6, -5.51);
    box(blind, 1.6, 0.35, 0.04, 2.75, -5.51);
    box(dark, 2.3, 1.0, 0.04, 3.1, -5.51);
    for (const dx of [-0.95, 0.95]) {
      const lamp = new Mesh(this.unit, head);
      lamp.scale.set(0.3, 0.18, 0.04);
      lamp.position.set(dx, 0.75, -5.53);
      const rear = new Mesh(this.unit, tail);
      rear.scale.set(0.2, 0.35, 0.04);
      rear.position.set(dx * 1.1, 0.9, 5.53);
      bus.add(lamp, rear);
    }
    this.wheels(bus, dark, [-3.6, 3.4]);
    return bus;
  }

  /** A black cab: a tall rounded body, its yellow TAXI sign lit on the roof. */
  private cab(): Group {
    const cab = new Group();
    const paint = this.material({ color: 0x0b0b0d, roughness: 0.25, metalness: 0.5 });
    const glass = this.material({ color: 0x1c2330, roughness: 0.1, metalness: 0.6 });
    const sign = this.material({ color: 0xffd23f, emissive: 0xffb300, emissiveIntensity: 2 });
    const head = this.material({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 3 });
    const tail = this.material({ color: 0x550000, emissive: 0xff1a1a, emissiveIntensity: 2.5 });
    const dark = this.material({ color: 0x15161a, roughness: 0.7 });
    const body = new Mesh(new CapsuleGeometry(0.85, 2.9, 4, 12), paint);
    body.rotation.x = Math.PI / 2;
    body.scale.set(1.05, 1, 0.75);
    body.position.y = 0.95;
    const cabin = new Mesh(new CapsuleGeometry(0.75, 1.6, 4, 12), glass);
    cabin.rotation.x = Math.PI / 2;
    cabin.scale.set(1.08, 1, 0.75);
    cabin.position.set(0, 1.55, 0.25);
    this.disposables.push(body.geometry, cabin.geometry);
    const light = new Mesh(this.unit, sign);
    light.scale.set(0.5, 0.16, 0.2);
    light.position.set(0, 2.18, -0.4);
    cab.add(body, cabin, light);
    for (const dx of [-0.65, 0.65]) {
      const lamp = new Mesh(new SphereGeometry(0.13, 10, 8), head);
      lamp.position.set(dx, 0.95, -2.25);
      const rear = new Mesh(this.unit, tail);
      rear.scale.set(0.14, 0.3, 0.04);
      rear.position.set(dx * 1.15, 1.0, 2.15);
      this.disposables.push(lamp.geometry);
      cab.add(lamp, rear);
    }
    cab.children.forEach((m) => (m.castShadow = true));
    this.wheels(cab, dark, [-1.5, 1.4], 0.36);
    return cab;
  }

  private wheels(vehicle: Group, material: Material, axles: number[], scale = 1): void {
    for (const z of axles) {
      for (const dx of [-1, 1]) {
        const wheel = new Mesh(this.wheel, material);
        wheel.rotation.z = Math.PI / 2;
        wheel.scale.setScalar(scale === 1 ? 1 : 0.8);
        wheel.position.set(dx * (scale === 1 ? 1.15 : 0.88), scale === 1 ? 0.5 : 0.4, z);
        vehicle.add(wheel);
      }
    }
  }

  /** Commuters in coats walking both pavements, to and from Westminster. */
  private addWalkers(): void {
    const random = seeded(83);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP; offset += 2.4 + random() * 3) {
        const near = side < 0 ? -BUS_LANE - 0.8 : ONCOMING + 0.8;
        this.walkers.push({
          side,
          offset,
          x: near + side * random() * 1.9,
          speed: (random() < 0.5 ? -1 : 1) * (1.1 + random() * 0.5),
          height: 0.92 + random() * 0.16,
          phase: random() * 6.3,
        });
      }
    }
    const n = this.walkers.length;
    const body = new CapsuleGeometry(0.2, 0.42, 4, 10);
    const head = new SphereGeometry(0.115, 12, 10);
    const pair = legPair(0.08, 0.84);
    this.disposables.push(body, head, pair);
    this.bodies = this.instanced(body, this.material({ roughness: 0.9 }), n);
    this.legs = this.instanced(pair, this.material({ roughness: 0.9 }), n);
    this.heads = this.instanced(head, this.material({ roughness: 0.7 }), n);
    const c = new Color();
    const random2 = seeded(89);
    for (let i = 0; i < n; i++) {
      this.bodies.setColorAt(i, c.set(COATS[Math.floor(random2() * COATS.length)]!));
      this.legs.setColorAt(i, c.set(TROUSERS[Math.floor(random2() * TROUSERS.length)]!));
      this.heads.setColorAt(i, c.set(SKINS[Math.floor(random2() * SKINS.length)]!));
    }
  }

  /**
   * The Palace of Westminster along the right bank, its gothic river front lit gold, with
   * Elizabeth Tower at its near end, four lit clock faces under the belfry and spire, and the
   * Victoria Tower at the far end. It stands a fixed distance ahead, like the skyline.
   */
  private addPalace(): void {
    const haze = new Color(HAZE);
    const hazed = (hex: number, amount: number, map: Texture | null = null, glow = 0) => {
      const material = new MeshStandardMaterial({ roughness: 0.85, fog: false, map });
      material.color.set(hex).lerp(haze, amount);
      if (glow > 0) {
        material.emissive.set(0xffb45a);
        material.emissiveMap = map;
        material.emissiveIntensity = glow;
      }
      this.disposables.push(material);
      return material;
    };
    const gothic = this.track(gothicTexture());
    gothic.wrapS = RepeatWrapping;
    const stone = 0xd8b77a;
    const front = hazed(stone, 0.2, gothic, 0.35);
    const plain = hazed(stone, 0.25);
    const roof = hazed(0x4b5560, 0.35);
    const gilt = hazed(0xd8a640, 0.15);
    const L = this.landmarks;
    const box = (m: Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
      const mesh = new Mesh(this.unit, m);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y + h / 2, z);
      L.add(mesh);
      return mesh;
    };
    // The river front: 300 m of gothic bays, pinnacles along its parapet.
    const length = 300;
    const frontTexture = gothic.clone();
    frontTexture.repeat.set(length / 12, 1);
    frontTexture.needsUpdate = true;
    this.track(frontTexture);
    const longFront = hazed(stone, 0.2, frontTexture, 0.35);
    box(longFront, 26, 24, length, TOWER_X + 30, -6, -length / 2 - 10);
    box(roof, 22, 6, length - 4, TOWER_X + 32, 18, -length / 2 - 10);
    const pinnacle = new ConeGeometry(0.9, 6, 4);
    this.disposables.push(pinnacle);
    for (let z = -12; z > -length - 8; z -= 8) {
      const p = new Mesh(pinnacle, plain);
      p.position.set(TOWER_X + 17, 21, z);
      L.add(p);
    }
    // Elizabeth Tower: the shaft, the clock stage, the belfry and the gilded spire.
    const t = { x: TOWER_X, z: 0 };
    const shaftTexture = gothic.clone();
    shaftTexture.repeat.set(1, 4);
    shaftTexture.needsUpdate = true;
    this.track(shaftTexture);
    box(hazed(stone, 0.2, shaftTexture, 0.4), 12, 55, 12, t.x, -6, t.z);
    box(front, 14, 16, 14, t.x, 49, t.z);
    const clock = hazed(0xfff6dc, 0, this.track(clockTexture()), 1.6);
    const face = new PlaneGeometry(8.6, 8.6);
    this.disposables.push(face);
    for (const [dx, dz, turn] of [
      [0, 7.05, 0],
      [-7.05, 0, -Math.PI / 2],
      [7.05, 0, Math.PI / 2],
      [0, -7.05, Math.PI],
    ] as const) {
      const f = new Mesh(face, clock);
      f.position.set(t.x + dx, 57, t.z + dz);
      f.rotation.y = turn;
      L.add(f);
    }
    box(plain, 11, 9, 11, t.x, 65, t.z);
    const spire = new ConeGeometry(8, 20, 4);
    spire.rotateY(Math.PI / 4);
    spire.translate(0, 10, 0);
    const finial = new CylinderGeometry(0.3, 0.6, 8, 6);
    finial.translate(0, 4, 0);
    this.disposables.push(spire, finial);
    const s1 = new Mesh(spire, gilt);
    s1.position.set(t.x, 74, t.z);
    const s2 = new Mesh(finial, gilt);
    s2.position.set(t.x, 93, t.z);
    L.add(s1, s2);
    for (const [dx, dz] of [
      [-6, -6],
      [6, -6],
      [-6, 6],
      [6, 6],
    ] as const) {
      const p = new Mesh(pinnacle, gilt);
      p.position.set(t.x + dx, 77, t.z + dz);
      L.add(p);
    }
    // The Victoria Tower closes the far end.
    box(hazed(stone, 0.35, shaftTexture, 0.3), 22, 98, 22, TOWER_X + 30, -6, -length - 20);
  }

  /** Portland-stone blocks along both banks, their windows lit for the evening. */
  private addBanks(): void {
    const haze = new Color(HAZE);
    const windows = this.track(officeTexture(false));
    const lit = this.track(officeTexture(true));
    for (const t of [windows, lit]) {
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
    }
    const random = seeded(101);
    for (let i = 0; i < 26; i++) {
      const material = new MeshStandardMaterial({ map: windows, fog: false, roughness: 0.9 });
      material.color.set([0xf2ece0, 0xe6dccb, 0xd8ccb8][i % 3]!).lerp(haze, 0.4);
      material.emissive.set(0xffc06e);
      material.emissiveMap = lit;
      material.emissiveIntensity = 0.9;
      this.disposables.push(material);
      const w = 30 + random() * 40;
      const h = 18 + random() * 30;
      const block = new Mesh(this.unit, material);
      block.scale.set(w, h, 25 + random() * 20);
      const left = i < 16;
      block.position.set(
        left ? -150 - random() * 120 : 200 + random() * 80,
        h / 2 - 6,
        -100 - random() * 700,
      );
      this.landmarks.add(block);
    }
    this.group.add(this.landmarks);
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

  private instanced(geometry: BufferGeometry, material: Material, n: number): InstancedMesh {
    const mesh = new InstancedMesh(geometry, material, n);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    this.disposables.push(mesh);
    this.group.add(mesh);
    return mesh;
  }
}

/** London's red bus-lane surfacing, its solid white edge line and BUS LANE painted along it. */
function busLaneTexture() {
  return canvasTexture(256, 1024, (g) => {
    speckle(g, 256, 1024, '#8c2a26', 31);
    g.fillStyle = '#efefe8';
    g.fillRect(244, 0, 10, 1024);
    g.save();
    g.translate(128, 520);
    // The lane is read from the rider's side: across runs leftwards, along runs away.
    g.scale(-1, 1);
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.scale(1, 3.2);
    g.fillText('BUS', 0, -40);
    g.fillText('LANE', 0, 20);
    g.restore();
  });
}

/** Wet dark tarmac, a dashed lane line in its middle and dashes at the rider's edge. */
function carriagewayTexture() {
  return canvasTexture(512, 1024, (g) => {
    speckle(g, 512, 1024, '#3a3b3f', 37);
    g.fillStyle = '#e9e9e2';
    for (let y = 0; y < 1024; y += 256) {
      g.fillRect(250, y, 10, 150);
      g.fillRect(0, y + 40, 8, 120);
    }
  });
}

/** York-stone paving slabs. */
function pavingTexture() {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#9a958c', 43);
    g.strokeStyle = 'rgba(40,38,35,0.5)';
    g.lineWidth = 2;
    for (let y = 0; y <= 512; y += 128) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
      for (let x = (y / 128) % 2 ? 0 : 85; x <= 512; x += 170) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x, y + 128);
        g.stroke();
      }
    }
  });
}

/** A run of the bridge's cast-iron balustrade: gothic arches between posts, cut out. */
function balustradeTexture() {
  return canvasTexture(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 22);
    g.fillRect(0, 226, 512, 30);
    g.fillRect(0, 0, 18, 256);
    g.fillRect(494, 0, 18, 256);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 9;
    for (let x = 18; x < 494; x += 59.5) {
      g.beginPath();
      g.moveTo(x, 226);
      g.lineTo(x, 90);
      g.quadraticCurveTo(x + 30, 30, x + 59.5, 90);
      g.stroke();
      g.beginPath();
      g.arc(x + 30, 160, 16, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

/** The Thames at dusk: grey-violet water with the evening's light in long ripples. */
function riverTexture() {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#4b4a5c';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(47);
    for (let i = 0; i < 1600; i++) {
      const warm = random() < 0.3;
      g.fillStyle = warm
        ? `rgba(255,190,120,${0.08 + random() * 0.2})`
        : `rgba(220,215,240,${0.05 + random() * 0.15})`;
      g.fillRect(random() * 512, random() * 512, 10 + random() * 30, 1.5);
    }
  });
}

/** A double-decker's window band: a lit saloon behind dark glass and its pillars. */
function busWindowTexture() {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = '#c8102e';
    g.fillRect(0, 0, 512, 64);
    for (let x = 6; x < 512; x += 64) {
      const grad = g.createLinearGradient(0, 8, 0, 58);
      grad.addColorStop(0, '#ffe2a8');
      grad.addColorStop(1, '#7a5a3a');
      g.fillStyle = grad;
      g.fillRect(x, 8, 54, 48);
    }
  });
}

/** Perpendicular gothic: tall traceried panels in honey stone, the glass lit within. */
function gothicTexture() {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#e2c590';
    g.fillRect(0, 0, 256, 256);
    for (let x = 8; x < 256; x += 32) {
      g.fillStyle = '#7a5a34';
      g.beginPath();
      g.moveTo(x, 240);
      g.lineTo(x, 60);
      g.quadraticCurveTo(x + 12, 30, x + 24, 60);
      g.lineTo(x + 24, 240);
      g.fill();
      g.fillStyle = '#ffd38a';
      g.fillRect(x + 4, 120, 16, 40);
      g.fillRect(x + 4, 180, 16, 40);
      g.fillStyle = '#e2c590';
      g.fillRect(x, 165, 24, 6);
    }
  });
}

/** One of Elizabeth Tower's clock dials: opal glass lit from within, numerals and hands. */
function clockTexture() {
  return canvasTexture(256, 256, (g) => {
    g.fillStyle = '#3b2f22';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#fff6dc';
    g.beginPath();
    g.arc(128, 128, 104, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2b2b2b';
    for (let h = 0; h < 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      g.save();
      g.translate(128 + Math.sin(a) * 88, 128 - Math.cos(a) * 88);
      g.rotate(a);
      g.fillRect(-3, -9, 6, 18);
      g.restore();
    }
    // Ten to six: the rush hour, and the race to beat the chimes.
    g.strokeStyle = '#1b1b1b';
    g.lineCap = 'round';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(128, 128);
    g.lineTo(128 + Math.sin(5.85 * (Math.PI / 6)) * 52, 128 - Math.cos(5.85 * (Math.PI / 6)) * 52);
    g.stroke();
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(128, 128);
    g.lineTo(128 + Math.sin(-Math.PI / 3) * 84, 128 - Math.cos(-Math.PI / 3) * 84);
    g.stroke();
  });
}

/**
 * Portland-stone fronts with rows of windows, most lit warm for the evening: the lit copy is
 * the glow alone, black between the windows, for the emissive map.
 */
function officeTexture(lit: boolean) {
  const texture = canvasTexture(128, 128, (g) => {
    g.fillStyle = lit ? '#000000' : '#ffffff';
    g.fillRect(0, 0, 128, 128);
    const random = seeded(7);
    for (let y = 4; y < 128; y += 16) {
      for (let x = 4; x < 128; x += 12) {
        const on = random() < 0.65;
        g.fillStyle = on ? (lit ? '#ffc777' : '#ffe0a8') : lit ? '#000000' : '#3a3d45';
        g.fillRect(x, y, 7, 10);
      }
    }
  });
  texture.repeat.set(4, 3);
  return texture;
}
