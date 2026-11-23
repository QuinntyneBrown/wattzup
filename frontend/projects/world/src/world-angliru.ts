// The Angliru, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Vuelta's cruellest
// ramps in the Sierra del Aramo, on a stage day with the cloud down on the mountain. The rider
// grinds up the narrow road's grooved concrete, so steep the crowd presses in from both sides and
// leaves only a corridor: fans in red and in Asturias's blue and gold wave flags in the riders'
// faces, shout, and a few run alongside. Kilometre markers count the gradient on the verge, and
// the road is painted with names. Beyond the crowd green pastures fall away behind drystone walls,
// a brown Asturian cow grazes, and an hórreo, the region's granary on its stone stilts, stands
// by a farm. Chestnut trees lean over the road, and mist drifts up the mountain on the wind,
// drifting over the ramps ahead. Built on the shared kit (world-kit.ts) on the pattern of Old Town's
// street.
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

/** The climb repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 340;
const BEHIND = 24;

const FAN_WEAR = {
  tops: ['#d8102e', '#1d4aa8', '#ffd23f', '#ffffff', '#1d1f24', '#f08a2a', '#3a8a5a'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#3a6a9a'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#f5d3b5', '#8d5a3b'],
};

export class AngliruStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; speed: number; phase: number }[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
  private readonly mist: { mesh: Mesh; x: number; speed: number }[] = [];
  private readonly cows: { neck: Group; phase: number }[] = [];
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
    this.addPastures(roadHalf);
    this.addFarm(roadHalf);
    this.addMarkers(roadHalf);
    this.addCrowd(roadHalf);
    this.addMountain();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((f, k) => (f.rotation.y = Math.sin(seconds * 5 + k * 1.1) * 0.8));
    for (const c of this.cows) c.neck.rotation.x = 0.5 + Math.sin(seconds * 0.7 + c.phase) * 0.4;
    for (const m of this.mist) m.mesh.position.x = ((m.x + seconds * m.speed) % 800) - 400;
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the pastures falling away on the left. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - 90);
      position.setY(i * 2 + 1, p.height - 90);
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
        // The fans jump and lean into the corridor; the runners stride alongside.
        const lift = p.speed
          ? Math.abs(Math.sin(this.time * 6 + p.phase)) * 0.1
          : Math.max(0, Math.sin(this.time * 5 + p.phase)) * 0.15;
        const lean = p.speed ? 0 : Math.sin(this.time * 2 + p.phase) * 0.15;
        const heading = p.speed
          ? 0
          : (p.x < 0 ? -Math.PI / 2 : Math.PI / 2) + Math.sin(this.time * 0.8 + p.phase) * 0.5;
        crowd.set(
          i,
          p.x + (p.x < 0 ? lean : -lean),
          heightAt(metres) + lift,
          -metres,
          heading,
          0.95,
          0,
        );
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The grooved concrete road, its grass verges, the bank above and the pastures falling away. */
  private addRoad(roadHalf: number, points: number): void {
    const r = roadHalf;
    const concrete = this.material({
      map: this.repeat(concreteTexture(), r * 2, 40),
      roughness: 0.9,
    });
    const verge = this.material({ map: this.repeat(grassTexture(), 2, 2), roughness: 1 });
    const pasture = this.material({ map: this.repeat(pastureTexture(), 8, 8), roughness: 1 });
    this.ribbons.add(points, concrete, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, verge, [
      [r + 3, 0.3],
      [r, 0.02],
    ]);
    this.ribbons.add(points, pasture, [
      [r + 200, 60],
      [r + 25, 8],
      [r + 3, 0.3],
    ]);
    this.ribbons.add(points, verge, [
      [-r, 0.02],
      [-r - 3, 0],
    ]);
    this.ribbons.add(points, pasture, [
      [-r - 3, 0],
      [-r - 40, -14],
      [-r - 200, -80],
    ]);
  }

  /** The drystone walls, the chestnut trees over the road and the cows on the pastures. */
  private addPastures(roadHalf: number): void {
    const random = seeded(5501);
    const stone = this.material({ map: this.track(wallTexture()), roughness: 1 });
    for (let offset = 0; offset < LOOP; offset += 12)
      for (const side of [-1, 1]) {
        const wall = new Mesh(this.unit, stone);
        wall.scale.set(0.6, 1, 12);
        wall.position.y = side > 0 ? 0.8 : 0.1;
        wall.castShadow = true;
        const holder = new Group();
        holder.add(wall);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset: offset + 6, x: side * (roadHalf + 4.5) });
      }
    const bark = this.material({ color: 0x4a3a2e, roughness: 1 });
    const leaves = [0x3a6a2a, 0x4a7a30, 0x2e5a26].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const trunk = new CylinderGeometry(0.3, 0.5, 6, 6);
    trunk.translate(0, 3, 0);
    const crown = new DodecahedronGeometry(3.4, 1);
    crown.scale(1.2, 0.9, 1.2);
    this.disposables.push(trunk, crown);
    for (let offset = 5; offset < LOOP; offset += 14 + random() * 20) {
      const side = random() < 0.5 ? -1 : 1;
      const tree = new Group();
      const c = new Mesh(crown, leaves[Math.floor(random() * leaves.length)]!);
      c.position.set(-side * 1.2, 7, 0);
      tree.add(new Mesh(trunk, bark), c);
      tree.scale.setScalar(0.8 + random() * 0.4);
      tree.children.forEach((m) => (m.castShadow = true));
      const d = 6 + random() * 10;
      tree.position.y = side > 0 ? 0.3 + (d - 3) * (7.7 / 22) : -(d - 3) * (14 / 37);
      const holder = new Group();
      holder.add(tree);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
    }
    // Brown Asturian cows grazing below the wall.
    const hide = [0xa86a3a, 0x8a5430, 0xc08850].map((c) =>
      this.material({ color: c, roughness: 1 }),
    );
    const dark = this.material({ color: 0x2a2018, roughness: 1 });
    const body = new SphereGeometry(0.7, 10, 7);
    body.scale(0.8, 0.75, 1.6);
    const head = new SphereGeometry(0.28, 8, 6);
    head.scale(0.8, 0.9, 1.4);
    this.disposables.push(body, head);
    for (let k = 0; k < 6; k++) {
      const cow = new Group();
      const b = new Mesh(body, hide[k % hide.length]!);
      b.position.y = 1.1;
      const neck = new Group();
      neck.position.set(0, 1.25, -1);
      const h = new Mesh(head, hide[k % hide.length]!);
      h.position.set(0, 0, -0.3);
      const horns = new Mesh(this.unit, dark);
      horns.scale.set(0.6, 0.06, 0.06);
      horns.position.set(0, 0.22, -0.2);
      neck.add(h, horns);
      cow.add(b, neck);
      for (const [x, z] of [
        [-0.3, -0.7],
        [0.3, -0.7],
        [-0.3, 0.7],
        [0.3, 0.7],
      ] as const) {
        const leg = new Mesh(this.unit, dark);
        leg.scale.set(0.14, 0.8, 0.14);
        leg.position.set(x, 0.4, z);
        cow.add(leg);
      }
      cow.children.forEach((c) => (c.castShadow = true));
      cow.rotation.y = random() * 6;
      const d = 8 + random() * 16;
      const side = k % 2 ? 1 : -1;
      cow.position.y = side > 0 ? 0.3 + (d - 3) * (7.7 / 22) : -(d - 3) * (14 / 37);
      const holder = new Group();
      holder.add(cow);
      this.group.add(holder);
      this.cows.push({ neck, phase: random() * 6 });
      this.props.push({
        mesh: holder,
        offset: 30 + k * 52 + random() * 10,
        x: side * (roadHalf + d),
      });
    }
  }

  /** A farm with its hórreo, the granary raised on its stone stilts. */
  private addFarm(roadHalf: number): void {
    const timber = this.material({ map: this.track(horreoTexture()), roughness: 0.9 });
    const stone = this.material({ color: 0xa8a090, roughness: 1 });
    const tile = this.material({ color: 0xa8482e, roughness: 0.8 });
    const white = this.material({ color: 0xf0ece2, roughness: 0.9 });
    const farm = new Group();
    const store = new Group();
    for (const [x, z] of [
      [-1.8, -1.8],
      [1.8, -1.8],
      [-1.8, 1.8],
      [1.8, 1.8],
    ] as const) {
      const pegollo = new Mesh(new CylinderGeometry(0.25, 0.4, 2, 6), stone);
      pegollo.position.set(x, 1, z);
      const cap = new Mesh(this.unit, stone);
      cap.scale.set(0.8, 0.15, 0.8);
      cap.position.set(x, 2.05, z);
      store.add(pegollo, cap);
      this.disposables.push(pegollo.geometry);
    }
    const box = new Mesh(this.unit, timber);
    box.scale.set(5, 2.6, 5);
    box.position.y = 3.4;
    const roof = new Mesh(new ConeGeometry(4.4, 2.2, 4), tile);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 5.8;
    this.disposables.push(roof.geometry);
    store.add(box, roof);
    farm.add(store);
    const house = new Mesh(this.unit, white);
    house.scale.set(10, 6, 8);
    house.position.set(9, 3, 4);
    const houseRoof = new Mesh(new ConeGeometry(7.5, 3, 4), tile);
    houseRoof.rotation.y = Math.PI / 4;
    houseRoof.scale.set(1, 1, 0.8);
    houseRoof.position.set(9, 7.5, 4);
    this.disposables.push(houseRoof.geometry);
    farm.add(house, houseRoof);
    farm.children.forEach((c) => c.traverse((m) => (m.castShadow = true)));
    farm.position.y = -6;
    const holder = new Group();
    holder.add(farm);
    this.group.add(holder);
    this.props.push({ mesh: holder, offset: 120, x: -roadHalf - 18 });
  }

  /** The kilometre markers with the gradient to come, and the names painted on the road. */
  private addMarkers(roadHalf: number): void {
    const plate = this.material({ map: this.track(kmTexture()), roughness: 0.6 });
    for (const offset of [60, 260]) {
      const marker = new Group();
      const post = new Mesh(this.unit, plate);
      post.scale.set(0.15, 1.2, 0.5);
      post.position.y = 0.6;
      marker.add(post);
      marker.position.y = 0.3;
      const holder = new Group();
      holder.add(marker);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: roadHalf + 0.4 });
    }
  }

  /** The crowd pressing in from both sides, leaving a corridor, flags in the riders' faces. */
  private addCrowd(roadHalf: number): void {
    const random = seeded(5511);
    const asturias = this.material({ map: this.track(asturiasTexture()), roughness: 0.8, side: 2 });
    const spain = this.material({ map: this.track(spainTexture()), roughness: 0.8, side: 2 });
    const pole = this.material({ color: 0x2a2a2a, roughness: 0.6 });
    const cloth = new PlaneGeometry(1.1, 0.7);
    cloth.translate(0.55, 0, 0);
    this.disposables.push(cloth);
    for (let offset = 2; offset < LOOP; offset += 0.55 + random() * 0.9) {
      const side = random() < 0.5 ? -1 : 1;
      // Up close the crowd stands in the road itself; further back, on the verge.
      const inRoad = random() < 0.6;
      const x = side * (inRoad ? roadHalf - 1.4 - random() * 0.6 : roadHalf + 0.4 + random() * 2.4);
      this.people.push({ offset, x, speed: 0, phase: random() * 6 });
      if (random() < 0.12) {
        const stand = new Group();
        const stick = new Mesh(this.unit, pole);
        stick.scale.set(0.03, 2.4, 0.03);
        stick.position.y = 1.2;
        const flag = new Mesh(cloth, random() < 0.65 ? asturias : spain);
        flag.position.y = 2.2;
        flag.rotation.y = side > 0 ? Math.PI : 0;
        stand.add(stick, flag);
        this.flags.push(flag);
        const holder = new Group();
        holder.add(stand);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: x - side * 0.3 });
      }
    }
    // A few fans running alongside up the corridor.
    for (let k = 0; k < 4; k++)
      this.people.push({
        offset: 6 + k * 70,
        x: (k % 2 ? 1 : -1) * (roadHalf - 2.3),
        speed: 2.6 + k * 0.2,
        phase: k,
      });
    this.crowd = new Figures(this.group, this.disposables, this.people.length, FAN_WEAR, 5517);
  }

  /** The mountain's ramps vanishing into the cloud ahead, the ridges either side, and the mist drifting up. */
  private addMountain(): void {
    const random = seeded(5521);
    const green = [0x4a7a34, 0x5a8a3a, 0x3a6a2a].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const rock = this.material({ color: 0x9a968c, roughness: 1, flatShading: true });
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    const summit = new Mesh(hill, green[0]!);
    summit.scale.set(700, 300, 500);
    summit.position.set(120, -60, -900);
    this.horizon.add(summit);
    for (let k = 0; k < 8; k++) {
      const h = new Mesh(hill, k % 3 === 2 ? rock : green[k % green.length]!);
      h.scale.set(250 + random() * 250, 120 + random() * 140, 220);
      h.position.set(-1000 + k * 280 + random() * 80, -100, -600 - random() * 600);
      this.horizon.add(h);
    }
    // The low cloud drifting up the mountain, thick enough to swallow the ramps ahead.
    const fog = this.material({
      color: 0xffffff,
      emissive: 0xdde2e6,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      roughness: 1,
    });
    const puff = new SphereGeometry(1, 12, 8);
    this.disposables.push(puff);
    for (let k = 0; k < 16; k++) {
      const bank = new Mesh(puff, fog);
      bank.scale.set(60 + random() * 80, 14 + random() * 12, 30 + random() * 30);
      bank.position.set(0, 20 + random() * 70, -220 - k * 45);
      this.mist.push({ mesh: bank, x: random() * 800, speed: 2 + random() * 3 });
      this.horizon.add(bank);
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

/** The steep road's grooved concrete, cast in slabs, with names painted for the riders. */
function concreteTexture(): CanvasTexture {
  return canvasTexture(256, 512, (g) => {
    speckle(g, 256, 512, '#a8a49a', 5531);
    g.fillStyle = 'rgba(70,68,62,0.18)';
    for (let y = 0; y < 512; y += 6) g.fillRect(0, y, 256, 1);
    g.fillStyle = 'rgba(40,38,34,0.6)';
    for (let y = 0; y < 512; y += 128) g.fillRect(0, y, 256, 2);
    g.fillRect(127, 0, 2, 512);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const [text, colour, y] of [
      ['ANGLIRU', '#ffffff', 160],
      ['VAMOS', '#ffd23f', 420],
    ] as const) {
      g.save();
      g.translate(128, y);
      g.scale(-1, 1.8);
      g.fillStyle = colour;
      g.font = 'bold 40px sans-serif';
      g.fillText(text, 0, 0);
      g.restore();
    }
  });
}

/** The verge's rough grass. */
function grassTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => speckle(g, 64, 64, '#5a8a34', 5541));
}

/** The pastures' lush green grass with clover and buttercups. */
function pastureTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#5a8a3a', 5551);
    const random = seeded(5553);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = ['#7aa04a', '#3a6a2a', '#e8d040', '#f0f0e8'][Math.floor(random() * 4)]!;
      g.fillRect(random() * 128, random() * 128, 2, 2);
    }
  });
}

/** The drystone walls' grey limestone, mossy in places. */
function wallTexture(): CanvasTexture {
  return canvasTexture(128, 32, (g) => {
    speckle(g, 128, 32, '#9a968a', 5561);
    g.strokeStyle = 'rgba(50,48,42,0.55)';
    const random = seeded(5563);
    for (let y = 0; y < 32; y += 10)
      for (let x = (y / 10) % 2 ? -5 : 0; x < 128; x += 10 + random() * 6)
        g.strokeRect(x, y, 10 + random() * 4, 10);
    g.fillStyle = 'rgba(70,110,50,0.4)';
    for (let i = 0; i < 12; i++) g.fillRect(random() * 128, random() * 32, 6, 3);
  });
}

/** The hórreo's weathered chestnut boards with their carved band. */
function horreoTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#6a4a30', 5571);
    g.fillStyle = 'rgba(30,20,12,0.5)';
    for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 1, 64);
    g.fillStyle = '#c8a060';
    g.fillRect(0, 4, 64, 4);
  });
}

/** A kilometre marker's face: the distance to the top and the gradient to come. */
function kmTexture(): CanvasTexture {
  return canvasTexture(32, 64, (g) => {
    g.fillStyle = '#f8f8f4';
    g.fillRect(0, 0, 32, 64);
    g.fillStyle = '#d8102e';
    g.fillRect(0, 0, 32, 20);
    g.fillStyle = '#ffffff';
    g.font = 'bold 12px sans-serif';
    g.textAlign = 'center';
    g.fillText('KM 3', 16, 15);
    g.fillStyle = '#111111';
    g.font = 'bold 13px sans-serif';
    g.fillText('23%', 16, 44);
  });
}

/** Asturias's flag: the gold Victory Cross on blue. */
function asturiasTexture(): CanvasTexture {
  return canvasTexture(48, 32, (g) => {
    g.fillStyle = '#1d4aa8';
    g.fillRect(0, 0, 48, 32);
    g.fillStyle = '#ffd23f';
    g.fillRect(22, 5, 4, 22);
    g.fillRect(16, 11, 16, 4);
  });
}

/** Spain's flag: red, gold and red. */
function spainTexture(): CanvasTexture {
  return canvasTexture(48, 32, (g) => {
    g.fillStyle = '#c8102e';
    g.fillRect(0, 0, 48, 32);
    g.fillStyle = '#ffc400';
    g.fillRect(0, 8, 48, 16);
  });
}
