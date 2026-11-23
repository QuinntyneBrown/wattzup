// The Wicklow Gap, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): race day on the
// mountain road over the Wicklow Mountains, on a bright, blustery spring afternoon with clouds
// racing over the hills. The rider climbs the open road through the blanket bog: brown
// heather and purple ling, tufts of white bog cotton, black peat banks cut along the verge,
// yellow gorse in flower and grey granite boulders. Race marshals in yellow vests wave their
// flags, fans lean on their cars and wave the tricolour, riders' names are chalked on the road,
// and a marshal's motorbike idles on the verge. Mountain sheep with their owners' paint marks
// graze among the heather. On the left the valley falls away to Glendalough's dark lough; on the
// right the rounded granite mountains roll up to Tonelagee, and ahead the road crests the gap
// past the pass's yellow road signs. Built on the shared kit (world-kit.ts) on the pattern of
// Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from 'three/webgpu';
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
const LOOP = 380;
const BEHIND = 24;

const RACE_WEAR = {
  tops: ['#169b62', '#ff883e', '#ffffff', '#e8e020', '#1d3a8a', '#c8102e', '#1d1f24'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#3a4a2a'],
  skins: ['#f5d3b5', '#f0c8a0', '#e2b48c', '#c48a5f'],
};

export class WicklowStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
  private readonly sheep: { neck: Group; phase: number }[] = [];
  private readonly clouds: { mesh: Mesh; x: number; z: number; speed: number }[] = [];
  private lough: Texture | null = null;
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
    this.addRoad(roadHalf, points);
    this.addBog(roadHalf);
    this.addSigns(roadHalf);
    this.addRaceDay(roadHalf);
    this.addSheep(roadHalf);
    this.addPeople(roadHalf);
    this.addMountains();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The flags wave in the wind; the sheep graze; the clouds race over the hills.
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 5 + k) * 0.5));
    for (const s of this.sheep) s.neck.rotation.x = 0.5 + Math.sin(seconds * 0.9 + s.phase) * 0.45;
    for (const c of this.clouds) {
      const x = ((c.x + seconds * c.speed) % 3000) - 1500;
      c.mesh.position.set(x, c.mesh.position.y, c.z);
    }
    if (this.lough) this.lough.offset.set(seconds * 0.004, seconds * 0.002);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the valley falling to the lough on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 160);
      position.setY(i * 2 + 1, p.height - 160);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset + p.speed * this.time, s, LOOP, BEHIND);
        const jump = p.speed ? 0 : Math.max(0, Math.sin(this.time * 3 + p.phase)) * 0.12;
        crowd.set(
          i,
          p.x,
          heightAt(metres) + jump,
          -metres,
          p.x < 0 ? -Math.PI / 2 : Math.PI / 2,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The chalked race road, its grass verges, the bog either side and the fall to the valley. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(chalkTexture(), r * 2, 40), roughness: 0.9 });
    const verge = this.material({ map: this.repeat(vergeTexture(), 2, 2), roughness: 1 });
    const bog = this.material({ map: this.repeat(bogTexture(), 6, 6), roughness: 1 });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, verge, [
      [r + 2.5, 0.2],
      [r, 0.02],
    ]);
    this.ribbons.add(points, bog, [
      [r + 260, 110],
      [r + 60, 16],
      [r + 2.5, 0.2],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.02],
      [-r - 2.5, 0.1],
    ]);
    this.ribbons.add(points, bog, [
      [-r - 2.5, 0.1],
      [-r - 30, -6],
      [-r - 140, -80],
      [-r - 400, -150],
    ]);
  }

  /** Heather and ling, bog cotton, gorse in flower, peat banks and granite boulders. */
  private addBog(roadHalf: number): void {
    const random = seeded(4501);
    const heather = [0x6a3a5a, 0x7a4a6a, 0x5a4a3a, 0x8a5a7a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const gorse = this.material({ color: 0xe8c020, roughness: 1, flatShading: true });
    const gorseGreen = this.material({ color: 0x3a5a2a, roughness: 1, flatShading: true });
    const cotton = this.material({ color: 0xf8f8f0, roughness: 1 });
    const peat = this.material({ map: this.track(peatTexture()), roughness: 1 });
    const granite = this.material({
      map: this.track(graniteTexture()),
      roughness: 1,
      flatShading: true,
    });
    const tuft = new DodecahedronGeometry(1, 0);
    tuft.scale(1, 0.45, 1);
    const ball = new SphereGeometry(0.06, 5, 4);
    const rock = new DodecahedronGeometry(1, 0);
    this.disposables.push(tuft, ball, rock);
    for (let offset = 0; offset < LOOP; offset += 1.6 + random() * 2.4)
      for (const side of [-1, 1]) {
        const d = 3 + random() * 22;
        const patch = new Group();
        const kind = random();
        if (kind < 0.12) {
          const bush = new Mesh(tuft, random() < 0.5 ? gorse : gorseGreen);
          bush.scale.set(1 + random(), 1.3 + random(), 1 + random());
          bush.position.y = 0.45;
          const flowers = new Mesh(tuft, gorse);
          flowers.scale.set(0.8, 1.1, 0.8);
          flowers.position.y = 0.75;
          patch.add(bush, flowers);
        } else if (kind < 0.2) {
          const boulder = new Mesh(rock, granite);
          boulder.scale.set(0.6 + random() * 1.2, 0.4 + random() * 0.8, 0.6 + random() * 1.2);
          boulder.position.y = 0.2;
          boulder.rotation.y = random() * 3;
          patch.add(boulder);
        } else {
          const h = new Mesh(tuft, heather[Math.floor(random() * heather.length)]!);
          h.scale.set(0.5 + random() * 0.7, 0.4 + random() * 0.4, 0.5 + random() * 0.7);
          h.position.y = 0.12;
          patch.add(h);
          if (random() < 0.35)
            for (let k = 0; k < 5; k++) {
              const c = new Mesh(ball, cotton);
              c.position.set(
                (random() - 0.5) * 0.8,
                0.35 + random() * 0.15,
                (random() - 0.5) * 0.8,
              );
              patch.add(c);
            }
        }
        patch.children.forEach((c) => (c.castShadow = true));
        const holder = new Group();
        holder.add(patch);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
    // The black peat banks cut along the right-hand verge, the turf stacked to dry.
    for (let offset = 30; offset < LOOP; offset += 70) {
      const bank = new Group();
      const face = new Mesh(this.unit, peat);
      face.scale.set(1.2, 1.4, 16);
      face.position.y = 0.4;
      bank.add(face);
      for (let k = 0; k < 4; k++) {
        const stack = new Mesh(new ConeGeometry(0.5, 0.8, 5), peat);
        stack.position.set(-1.6, 0.4, -6 + k * 4);
        this.disposables.push(stack.geometry);
        bank.add(stack);
      }
      bank.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(bank);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 8 });
    }
  }

  /** The pass's yellow road signs and the Wicklow Way's waymarker posts. */
  private addSigns(roadHalf: number): void {
    const post = this.material({ color: 0x8a8c90, roughness: 0.6 });
    const timber = this.material({ color: 0x4a3a2a, roughness: 1 });
    const signs = [warningTexture(), nameTexture()].map((t) =>
      this.material({ map: this.track(t), roughness: 0.6 }),
    );
    for (const [offset, k] of [
      [50, 0],
      [210, 1],
      [330, 0],
    ] as const) {
      const sign = new Group();
      const pole = new Mesh(this.unit, post);
      pole.scale.set(0.08, 2.4, 0.08);
      pole.position.y = 1.2;
      const plate = new Mesh(this.unit, signs[k]!);
      if (k === 0) {
        plate.scale.set(0.9, 0.9, 0.04);
        plate.rotation.z = Math.PI / 4;
      } else plate.scale.set(1.8, 0.8, 0.04);
      plate.position.y = 2.5;
      sign.add(pole, plate);
      sign.children.forEach((c) => (c.castShadow = true));
      const holder = new Group();
      holder.add(sign);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 1.4 });
    }
    for (let offset = 90; offset < LOOP; offset += 120) {
      const marker = new Mesh(this.unit, timber);
      marker.scale.set(0.15, 1.1, 0.15);
      marker.position.y = 0.55;
      marker.castShadow = true;
      const holder = new Group();
      holder.add(marker);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 2 });
    }
  }

  /** Marshals with their flags, fans' cars on the verge with the tricolour, and a marshal's motorbike. */
  private addRaceDay(roadHalf: number): void {
    const random = seeded(4511);
    const yellow = this.material({ color: 0xf0e020, roughness: 0.7, side: 2 });
    const tricolour = this.material({
      map: this.track(tricolourTexture()),
      roughness: 0.8,
      side: 2,
    });
    const pole = this.material({ color: 0x2a2a2a, roughness: 0.6 });
    const cloth = new PlaneGeometry(0.9, 0.6);
    cloth.translate(0.45, 0, 0);
    this.disposables.push(cloth);
    // The fans' flags on poles at the roadside.
    for (let offset = 14; offset < LOOP; offset += 22 + random() * 18) {
      const side = random() < 0.5 ? -1 : 1;
      const stand = new Group();
      const stick = new Mesh(this.unit, pole);
      stick.scale.set(0.04, 2.6, 0.04);
      stick.position.y = 1.3;
      const flag = new Mesh(cloth, random() < 0.7 ? tricolour : yellow);
      flag.position.y = 2.3;
      stand.add(stick, flag);
      this.flags.push(flag);
      const holder = new Group();
      holder.add(stand);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + 1.6) });
    }
    // The fans' cars pulled onto the verge.
    const paints = [0xc8102e, 0x1d3a8a, 0xe8e8e4, 0x3a3a3a, 0x2a6a3a].map((c) =>
      this.material({ color: c, roughness: 0.4, metalness: 0.3 }),
    );
    const glass = this.material({ color: 0x1d2630, roughness: 0.1, metalness: 0.6 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    for (let offset = 40; offset < LOOP; offset += 60 + random() * 40) {
      const car = new Group();
      const body = new Mesh(this.unit, paints[Math.floor(random() * paints.length)]!);
      body.scale.set(1.8, 0.8, 4.2);
      body.position.y = 0.7;
      const cabin = new Mesh(this.unit, glass);
      cabin.scale.set(1.6, 0.6, 2.2);
      cabin.position.set(0, 1.35, 0.2);
      const wheels = new Mesh(this.unit, tyre);
      wheels.scale.set(1.9, 0.6, 3);
      wheels.position.y = 0.3;
      car.add(body, cabin, wheels);
      car.children.forEach((c) => (c.castShadow = true));
      car.rotation.y = (random() - 0.5) * 0.3;
      const holder = new Group();
      holder.add(car);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 4.5 });
      // The fans leaning on it, waiting for the race.
      for (let k = 0; k < 2; k++)
        this.people.push({
          offset: offset + k * 1.2 - 1,
          x: roadHalf + 3.2,
          speed: 0,
          phase: random() * 6,
        });
    }
    // The marshal's motorbike on the verge, blue light on its screen.
    const black = this.material({ color: 0x1d1f24, roughness: 0.5 });
    const white = this.material({ color: 0xf8f8f4, roughness: 0.4 });
    const lamp = this.material({ color: 0x3a6aff, emissive: 0x3a6aff, emissiveIntensity: 1.5 });
    const bike = new Group();
    const frame = new Mesh(this.unit, white);
    frame.scale.set(0.3, 0.45, 1.3);
    frame.position.y = 0.75;
    const wheel = new CylinderGeometry(0.33, 0.33, 0.15, 12);
    wheel.rotateZ(Math.PI / 2);
    this.disposables.push(wheel);
    for (const z of [-0.75, 0.75]) {
      const w = new Mesh(wheel, black);
      w.position.set(0, 0.33, z);
      bike.add(w);
    }
    const light = new Mesh(this.unit, lamp);
    light.scale.set(0.25, 0.12, 0.1);
    light.position.set(0, 1.3, -0.6);
    bike.add(frame, light);
    bike.children.forEach((c) => (c.castShadow = true));
    bike.rotation.y = 0.3;
    const holder = new Group();
    holder.add(bike);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 26, x: -roadHalf - 1.3 });
    // The marshals in their yellow vests along the road.
    for (let offset = 20; offset < LOOP; offset += 45)
      this.people.push({
        offset,
        x: (offset % 90 ? 1 : -1) * (roadHalf + 0.8),
        speed: 0,
        phase: random() * 6,
      });
  }

  /** Mountain sheep with their owners' paint marks, grazing among the heather. */
  private addSheep(roadHalf: number): void {
    const random = seeded(4521);
    const fleece = this.material({ color: 0xe8e2d4, roughness: 1 });
    const face = this.material({ color: 0x2a2420, roughness: 1 });
    const marks = [0x1d6ad8, 0xc8102e, 0x2a9a3a].map((c) =>
      this.material({ color: c, roughness: 1 }),
    );
    const body = new SphereGeometry(0.45, 8, 6);
    body.scale(0.85, 0.8, 1.35);
    const head = new SphereGeometry(0.16, 6, 5);
    head.scale(0.8, 0.9, 1.4);
    this.disposables.push(body, head);
    for (let k = 0; k < 9; k++) {
      const sheep = new Group();
      const b = new Mesh(body, fleece);
      b.position.y = 0.6;
      const mark = new Mesh(this.unit, marks[k % marks.length]!);
      mark.scale.set(0.35, 0.05, 0.35);
      mark.position.set(0, 0.97, 0.15);
      const neck = new Group();
      neck.position.set(0, 0.7, -0.55);
      const h = new Mesh(head, face);
      h.position.set(0, 0, -0.15);
      neck.add(h);
      sheep.add(b, mark, neck);
      for (const [x, z] of [
        [-0.18, -0.3],
        [0.18, -0.3],
        [-0.18, 0.3],
        [0.18, 0.3],
      ] as const) {
        const leg = new Mesh(this.unit, face);
        leg.scale.set(0.07, 0.4, 0.07);
        leg.position.set(x, 0.2, z);
        sheep.add(leg);
      }
      sheep.children.forEach((c) => (c.castShadow = true));
      sheep.rotation.y = random() * 6;
      const holder = new Group();
      holder.add(sheep);
      this.group.add(holder);
      this.sheep.push({ neck, phase: random() * 6 });
      this.props.push({
        mesh: holder,
        offset: 10 + k * 41 + random() * 15,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 3 + random() * 12),
      });
    }
  }

  /** Walkers on the Wicklow Way crossing the road. */
  private addPeople(roadHalf: number): void {
    const random = seeded(4531);
    for (let k = 0; k < 6; k++)
      this.people.push({
        offset: 60 + k * 55,
        x: (random() < 0.5 ? -1 : 1) * (roadHalf + 1.8),
        speed: (random() < 0.5 ? 1 : -1) * 1.1,
        phase: random() * 6,
      });
    this.crowd = new Figures(this.group, this.disposables, this.people.length, RACE_WEAR, 4537);
  }

  /**
   * The valley falling to Glendalough's dark lough on the left, the rounded granite mountains
   * rolling up to Tonelagee on the right and ahead, and the clouds racing over them.
   */
  private addMountains(): void {
    const random = seeded(4541);
    const hill = [0x9a8a5c, 0x8a9a54, 0x9a7a6a, 0xa0905a].map((c) =>
      this.material({
        map: this.repeat(bogTexture(), 40, 40),
        color: c,
        roughness: 1,
        flatShading: true,
      }),
    );
    const dome = new SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    this.disposables.push(dome);
    for (let k = 0; k < 16; k++) {
      const m = new Mesh(dome, hill[k % hill.length]!);
      const a = -Math.PI / 2 + (k - 4) * 0.2;
      const d = (Math.cos(a) < -0.2 ? 2400 : 1000) + random() * 1500;
      const h = 220 + random() * 300 + (k === 10 ? 200 : 0);
      m.scale.set(500 + random() * 500, h, 500 + random() * 400);
      m.position.set(Math.cos(a) * d + 200, -60, Math.sin(a) * d);
      this.horizon.add(m);
    }
    // The valley floor far below on the left.
    const floor = new Mesh(new PlaneGeometry(6000, 6000), hill[2]!);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-3100, -152, -1000);
    this.disposables.push(floor.geometry);
    this.horizon.add(floor);
    // Glendalough's lough far below in the valley on the left, under its wooded slopes.
    const ripple = this.track(loughTexture());
    ripple.wrapS = RepeatWrapping;
    ripple.wrapT = RepeatWrapping;
    ripple.repeat.set(20, 20);
    this.lough = ripple;
    const water = new Mesh(
      new PlaneGeometry(600, 260),
      this.material({
        map: ripple,
        color: 0x2a3a4a,
        roughness: 0.45,
        metalness: 0,
        emissive: 0x0a1420,
        emissiveIntensity: 0.3,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-520, -148, -500);
    this.disposables.push(water.geometry);
    this.horizon.add(water);
    const wood = this.material({ color: 0x2a4a2a, roughness: 1, flatShading: true });
    const conifer = new ConeGeometry(1, 2.4, 6);
    this.disposables.push(conifer);
    for (let k = 0; k < 90; k++) {
      const t = new Mesh(conifer, wood);
      t.scale.setScalar(8 + random() * 6);
      const along = random();
      t.position.set(-520 + (along - 0.5) * 700, -140 + random() * 30, -660 - random() * 120);
      this.horizon.add(t);
    }
    // The clouds racing over the hills on the wind.
    const cloud = this.material({
      color: 0xffffff,
      emissive: 0xd8dce0,
      emissiveIntensity: 0.5,
      roughness: 1,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const puff = new SphereGeometry(1, 10, 8);
    this.disposables.push(puff);
    for (let k = 0; k < 8; k++) {
      const c = new Mesh(puff, cloud);
      c.scale.set(140 + random() * 160, 40 + random() * 30, 80 + random() * 60);
      c.position.set(0, 520 + random() * 300, -1200 - random() * 1800);
      this.clouds.push({ mesh: c, x: random() * 3000, z: c.position.z, speed: 12 + random() * 8 });
      this.horizon.add(c);
    }
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

/** The mountain road's grey tarmac with riders' names chalked across it by the fans. */
function chalkTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#55575a', 4551);
    g.fillStyle = 'rgba(245,245,240,0.85)';
    for (let y = 0; y < 512; y += 64) g.fillRect(126, y, 4, 32);
    g.fillStyle = 'rgba(250,250,245,0.8)';
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    // Written to be read by the riders coming up the road.
    g.save();
    g.translate(128, 200);
    g.rotate(Math.PI);
    g.fillText('GO ON CONOR', 0, 0);
    g.fillStyle = 'rgba(255,220,60,0.75)';
    g.fillText('ROCHE', 0, -220);
    g.restore();
  });
}

/** The verge's tussocky grass. */
function vergeTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#6a8a3a', 4561));
}

/** The blanket bog: brown heather, rust grass and green moss. */
function bogTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#7a6a48', 4571);
    const random = seeded(4573);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = ['#5a3a4a', '#9a7a48', '#5a7a34', '#6a4a5a', '#a88a58'][
        Math.floor(random() * 5)
      ]!;
      g.fillRect(random() * 128, random() * 128, 3 + random() * 6, 2 + random() * 3);
    }
  });
}

/** Cut peat: black-brown with the slane's strokes. */
function peatTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#2a1e18', 4581);
    g.fillStyle = 'rgba(80,60,40,0.5)';
    for (let y = 4; y < 64; y += 10) g.fillRect(0, y, 64, 2);
  });
}

/** Wicklow granite: pale grey flecked with mica. */
function graniteTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#a8a49c', 4591);
    const random = seeded(4593);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = random() < 0.5 ? '#3a3834' : '#e8e4dc';
      g.fillRect(random() * 64, random() * 64, 2, 2);
    }
  });
}

/** The yellow diamond warning sign: a bend ahead. */
function warningTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    g.fillStyle = '#f8d020';
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#111111';
    g.lineWidth = 4;
    g.strokeRect(4, 4, 56, 56);
    g.beginPath();
    g.moveTo(22, 46);
    g.lineTo(22, 30);
    g.quadraticCurveTo(22, 18, 40, 18);
    g.stroke();
  });
}

/** The pass's name board, in Irish and English. */
function nameTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#f8f8f4';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#111111';
    g.font = 'italic 16px sans-serif';
    g.textAlign = 'center';
    g.fillText('Bearna Chill Mhantáin', 64, 26);
    g.font = 'bold 16px sans-serif';
    g.fillText('WICKLOW GAP', 64, 48);
  });
}

/** The tricolour: green, white and orange. */
function tricolourTexture(): CanvasTexture {
  return canvasTexture(48, 32, (g) => {
    g.fillStyle = '#169b62';
    g.fillRect(0, 0, 16, 32);
    g.fillStyle = '#ffffff';
    g.fillRect(16, 0, 16, 32);
    g.fillStyle = '#ff883e';
    g.fillRect(32, 0, 16, 32);
  });
}

/** The lough's dark peaty water with the sky's light on it. */
function loughTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#2a3a4a', 4601);
    const random = seeded(4603);
    for (let i = 0; i < 20; i++) {
      g.fillStyle = `rgba(220,230,240,${0.15 + random() * 0.2})`;
      g.fillRect(random() * 64, random() * 64, 6 + random() * 8, 1);
    }
  });
}
