// The Atacama Desert, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the Salar de
// Atacama late on a cloudless afternoon, the high-altitude sky deep blue and the low sun turning the
// volcanoes pink. The rider rolls along the dead-straight road laid across the salt flat, its crust
// cracked into white polygons and broken into jagged salt boulders. On the left lies a lagoon so
// still it mirrors the sky, where Andean flamingos wade and dip their heads to feed, a wooden
// boardwalk running out to it with visitors and their cameras. On the right the crust gives way to
// the rust-red ridges of the Valle de la Luna, vicuñas graze the scrub and a tour truck kicks up
// dust on a track. Ahead, the perfect snow-tipped cone of Licancabur rises over the line of the
// Andes' volcanoes. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferAttribute,
  type BufferGeometry,
  type CanvasTexture,
  ConeGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
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

/** The salt flat repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
/** The lagoon lies LAGOON metres below the road, from SHORE metres beyond the verge. */
const LAGOON = 0.5;
const SHORE = 14;

const VISITOR_WEAR = {
  tops: ['#f08a2a', '#2a6a9a', '#ffffff', '#d8102e', '#3a8a5a', '#ffd23f', '#1d1f24'],
  bottoms: ['#2f3e5c', '#5a5f69', '#e8dcc0', '#1d1f24'],
  skins: ['#c48a5f', '#e2b48c', '#f0c8a0', '#8d5a3b', '#f5d3b5'],
};

export class AtacamaStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly people: { offset: number; x: number; phase: number; y: number }[] = [];
  private crowd: Figures | null = null;
  private readonly necks: { neck: Group; phase: number }[] = [];
  private truck: Group | null = null;
  private readonly dust: Mesh[] = [];
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
    this.addSalar(roadHalf, points);
    this.addSaltBoulders(roadHalf);
    this.addFlamingos(roadHalf);
    this.addBoardwalk(roadHalf);
    this.addVicunas(roadHalf);
    this.addTruck();
    this.addVolcanoes();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The flamingos dip their heads to feed and lift them again.
    for (const n of this.necks)
      n.neck.rotation.x = Math.max(0, Math.sin(seconds * 0.6 + n.phase)) * 2.2;
    this.dust.forEach((d, k) => {
      const t = (seconds * 0.6 + k * 0.33) % 1;
      d.position.set(0, 0.6 + t * 2, 3 + t * 9);
      d.scale.setScalar(0.8 + t * 3);
      (d.material as MeshStandardMaterial).opacity = 0.45 * (1 - t);
    });
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /** The ground plane drops below the lagoon's floor. */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - LAGOON - 1);
      position.setY(i * 2 + 1, p.height - LAGOON - 1);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    // The tour truck bumps along its track across the flat, ahead of the riders.
    if (this.truck) {
      const metres = loopMetres(120 + this.time * 7, s, LOOP, BEHIND);
      this.truck.position.set(40, heightAt(metres) + Math.sin(this.time * 9) * 0.03, -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.people.forEach((p, i) => {
        const metres = loopMetres(p.offset, s, LOOP, BEHIND);
        const heading = -Math.PI / 2 + Math.sin(this.time * 0.4 + p.phase) * 0.7;
        crowd.set(i, p.x, heightAt(metres) + p.y, -metres, heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The road across the salt crust, the lagoon on the left and the red ridges rising on the right. */
  private addSalar(roadHalf: number, points: number): void {
    const r = roadHalf;
    const tarmac = this.material({ map: this.repeat(roadTexture(), r * 2, 6), roughness: 0.85 });
    const crust = this.material({ map: this.repeat(crustTexture(), 8, 8), roughness: 0.95 });
    const ridge = this.material({
      map: this.repeat(ridgeTexture(), 12, 12),
      roughness: 1,
      flatShading: true,
    });
    const water = this.material({
      map: this.repeat(lagoonTexture(), 20, 20),
      color: 0x8ab8e8,
      roughness: 0.05,
      metalness: 0.5,
      emissive: 0x2a5a9a,
      emissiveIntensity: 0.3,
    });
    this.ribbons.add(points, tarmac, [
      [r, 0.012],
      [-r, 0.012],
    ]);
    this.ribbons.add(points, crust, [
      [r + 60, 0.1],
      [r, 0.02],
    ]);
    this.ribbons.add(points, ridge, [
      [r + 260, 70],
      [r + 120, 20],
      [r + 60, 0.1],
    ]);
    this.ribbons.add(points, crust, [
      [-r, 0.02],
      [-r - SHORE, 0.02],
      [-r - SHORE - 1, -LAGOON],
    ]);
    this.ribbons.add(points, water, [
      [-r - SHORE - 1, -LAGOON + 0.05],
      [-r - 600, -LAGOON + 0.05],
    ]);
  }

  /** The jagged boulders the crust has broken into, on both sides of the road. */
  private addSaltBoulders(roadHalf: number): void {
    const random = seeded(6901);
    const salt = [0xf4f0e8, 0xe8e0d0, 0xd8ccb8].map((c) =>
      this.material({ color: c, roughness: 0.9, flatShading: true }),
    );
    const lump = new DodecahedronGeometry(1, 0);
    this.disposables.push(lump);
    for (let offset = 0; offset < LOOP; offset += 2 + random() * 4)
      for (const side of [-1, 1]) {
        if (random() < 0.3) continue;
        const pile = new Group();
        for (let k = 0; k < 2 + Math.floor(random() * 3); k++) {
          const b = new Mesh(lump, salt[Math.floor(random() * salt.length)]!);
          const s = 0.2 + random() * 0.5;
          b.scale.set(s * 1.4, s * 0.7, s * 1.2);
          b.position.set((random() - 0.5) * 2, s * 0.2, (random() - 0.5) * 2);
          b.rotation.set(random(), random() * 3, random());
          b.castShadow = true;
          pile.add(b);
        }
        const d = side < 0 ? 1.5 + random() * (SHORE - 3) : 1.5 + random() * 50;
        const holder = new Group();
        holder.add(pile);
        this.group.add(holder);
        this.props.push({ mesh: holder, offset, x: side * (roadHalf + d) });
      }
  }

  /** The Andean flamingos wading in the lagoon, dipping their heads to feed. */
  private addFlamingos(roadHalf: number): void {
    const random = seeded(6911);
    const pink = [0xf4a0a8, 0xf08890, 0xf8b8b8].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const black = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const body = new SphereGeometry(0.35, 8, 6);
    body.scale(0.8, 0.7, 1.3);
    const head = new SphereGeometry(0.09, 6, 5);
    this.disposables.push(body, head);
    for (let k = 0; k < 34; k++) {
      const bird = new Group();
      const m = pink[k % pink.length]!;
      const b = new Mesh(body, m);
      b.position.y = 1.15;
      const tail = new Mesh(this.unit, black);
      tail.scale.set(0.3, 0.12, 0.2);
      tail.position.set(0, 1.18, 0.42);
      bird.add(b, tail);
      for (const x of [-0.08, 0.08]) {
        const leg = new Mesh(this.unit, m);
        leg.scale.set(0.03, 0.95, 0.03);
        leg.position.set(x, 0.48, 0);
        bird.add(leg);
      }
      // The long neck swings down from the shoulder to feed.
      const neck = new Group();
      neck.position.set(0, 1.3, -0.3);
      const stem = new Mesh(this.unit, m);
      stem.scale.set(0.05, 0.7, 0.05);
      stem.position.y = 0.35;
      const h = new Mesh(head, m);
      h.position.set(0, 0.72, -0.06);
      const beak = new Mesh(this.unit, black);
      beak.scale.set(0.05, 0.06, 0.14);
      beak.position.set(0, 0.68, -0.18);
      neck.add(stem, h, beak);
      bird.add(neck);
      bird.rotation.y = random() * 6;
      bird.position.y = -LAGOON;
      bird.scale.setScalar(1.3);
      const holder = new Group();
      holder.add(bird);
      this.group.add(holder);
      this.necks.push({ neck, phase: random() * 6 });
      this.props.push({
        mesh: holder,
        offset: random() * LOOP,
        x: -roadHalf - SHORE - 4 - random() * 40,
      });
    }
  }

  /** The wooden boardwalk running out to the lagoon, with visitors and their cameras. */
  private addBoardwalk(roadHalf: number): void {
    const random = seeded(6921);
    const plank = this.material({ map: this.track(plankTexture()), roughness: 0.9 });
    const rope = this.material({ color: 0x8a6a4a, roughness: 0.9 });
    for (const offset of [70, 250]) {
      const walk = new Group();
      const deck = new Mesh(this.unit, plank);
      deck.scale.set(SHORE + 6, 0.15, 1.8);
      deck.position.set(-(SHORE + 6) / 2, 0.25, 0);
      walk.add(deck);
      for (let x = -1; x > -SHORE - 6; x -= 2)
        for (const z of [-0.9, 0.9]) {
          const post = new Mesh(this.unit, rope);
          post.scale.set(0.08, 0.9, 0.08);
          post.position.set(x, 0.7, z);
          walk.add(post);
        }
      const holder = new Group();
      holder.add(walk);
      this.group.add(holder);
      this.props.push({ mesh: holder, offset, x: -roadHalf - 0.5 });
      for (let k = 0; k < 4; k++)
        this.people.push({
          offset: offset + (random() - 0.5) * 1.2,
          x: -roadHalf - 3 - random() * (SHORE + 1),
          phase: random() * 6,
          y: 0.32,
        });
    }
    this.crowd = new Figures(this.group, this.disposables, this.people.length, VISITOR_WEAR, 6927);
  }

  /** Vicuñas grazing the scrub at the foot of the ridges. */
  private addVicunas(roadHalf: number): void {
    const random = seeded(6931);
    const coat = this.material({ color: 0xc88a4a, roughness: 1 });
    const belly = this.material({ color: 0xf4ece0, roughness: 1 });
    const scrub = this.material({ color: 0x9a9a5a, roughness: 1, flatShading: true });
    const body = new SphereGeometry(0.45, 8, 6);
    body.scale(0.7, 0.75, 1.4);
    const tuft = new DodecahedronGeometry(0.4, 0);
    this.disposables.push(body, tuft);
    for (let k = 0; k < 8; k++) {
      const v = new Group();
      const b = new Mesh(body, coat);
      b.position.y = 1;
      const under = new Mesh(body, belly);
      under.scale.set(0.9, 0.5, 0.9);
      under.position.y = 0.85;
      const neck = new Mesh(this.unit, coat);
      neck.scale.set(0.15, 0.8, 0.15);
      neck.position.set(0, 1.45, -0.55);
      neck.rotation.x = -0.3;
      const head = new Mesh(this.unit, coat);
      head.scale.set(0.16, 0.18, 0.3);
      head.position.set(0, 1.85, -0.75);
      v.add(b, under, neck, head);
      for (const [x, z] of [
        [-0.15, -0.4],
        [0.15, -0.4],
        [-0.15, 0.4],
        [0.15, 0.4],
      ] as const) {
        const leg = new Mesh(this.unit, coat);
        leg.scale.set(0.07, 0.8, 0.07);
        leg.position.set(x, 0.4, z);
        v.add(leg);
      }
      v.children.forEach((c) => (c.castShadow = true));
      v.rotation.y = random() * 6;
      const holder = new Group();
      holder.add(v);
      for (let t = 0; t < 4; t++) {
        const bush = new Mesh(tuft, scrub);
        bush.scale.set(1, 0.6, 1);
        bush.position.set((random() - 0.5) * 6, 0.15, (random() - 0.5) * 6);
        holder.add(bush);
      }
      this.group.add(holder);
      this.props.push({
        mesh: holder,
        offset: 20 + k * 44 + random() * 12,
        x: roadHalf + 22 + random() * 30,
      });
    }
  }

  /** The white tour truck on its track across the flat, a plume of dust behind it. */
  private addTruck(): void {
    const white = this.material({ color: 0xf4f4f0, roughness: 0.4, metalness: 0.2 });
    const glass = this.material({ color: 0x2a3440, roughness: 0.1, metalness: 0.6 });
    const tyre = this.material({ color: 0x1d1f24, roughness: 0.8 });
    const truck = new Group();
    const body = new Mesh(this.unit, white);
    body.scale.set(2, 1.4, 4.6);
    body.position.y = 1.2;
    const cab = new Mesh(this.unit, glass);
    cab.scale.set(1.9, 0.7, 2.4);
    cab.position.set(0, 2.2, 0.2);
    const roof = new Mesh(this.unit, white);
    roof.scale.set(1.9, 0.1, 2.6);
    roof.position.set(0, 2.6, 0.2);
    const wheels = new Mesh(this.unit, tyre);
    wheels.scale.set(2.1, 0.7, 3.4);
    wheels.position.y = 0.4;
    truck.add(body, cab, roof, wheels);
    truck.children.forEach((c) => (c.castShadow = true));
    const puff = new SphereGeometry(1, 8, 6);
    this.disposables.push(puff);
    for (let k = 0; k < 3; k++) {
      const d = new Mesh(
        puff,
        this.material({
          color: 0xd8b890,
          roughness: 1,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      );
      truck.add(d);
      this.dust.push(d);
    }
    this.group.add(truck);
    this.truck = truck;
  }

  /** Licancabur's snow-tipped cone and the line of the Andes' volcanoes, and the Cordillera de Sal. */
  private addVolcanoes(): void {
    const random = seeded(6941);
    const rock = [0x8a5a5a, 0x9a6a5a, 0x7a5a64].map((c) =>
      this.material({ color: c, roughness: 1, flatShading: true }),
    );
    const snow = this.material({ color: 0xfff0f0, roughness: 0.8, flatShading: true });
    const cone = new ConeGeometry(1, 1, 28, 2);
    this.disposables.push(cone);
    const volcano = (
      x: number,
      z: number,
      h: number,
      w: number,
      m: MeshStandardMaterial,
      capped: boolean,
    ) => {
      const v = new Mesh(cone, m);
      v.scale.set(w, h, w);
      v.position.set(x, h / 2 - 10, z);
      this.horizon.add(v);
      if (capped) {
        // The snow sits a touch proud of the rock, so the two faces never fight.
        const cap = new Mesh(cone, snow);
        cap.scale.set(w * 0.25, h * 0.22, w * 0.25);
        cap.position.set(x, h - 10 - h * 0.11 + 4, z);
        this.horizon.add(cap);
      }
    };
    volcano(-300, -4600, 1000, 1900, rock[0]!, true);
    for (let k = 0; k < 9; k++) {
      const h = 420 + random() * 420;
      volcano(
        -4400 + k * 1000 + random() * 300,
        -5600 - random() * 600,
        h,
        h * (2.2 + random() * 0.8),
        rock[k % rock.length]!,
        random() < 0.6,
      );
    }
    // The Cordillera de Sal's low, folded ridges far off on the left.
    const ridge = this.material({ color: 0xc89a7a, roughness: 1, flatShading: true });
    const hill = new DodecahedronGeometry(1, 1);
    this.disposables.push(hill);
    for (let k = 0; k < 6; k++) {
      const h = new Mesh(hill, ridge);
      h.scale.set(500 + random() * 300, 60 + random() * 50, 260);
      h.position.set(-2600 + k * 450, -20, -1800 - random() * 500);
      this.horizon.add(h);
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

/** The desert road's sun-bleached tarmac with its white edge lines. */
function roadTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#6a6460', 6951);
    g.fillStyle = 'rgba(245,245,240,0.9)';
    g.fillRect(3, 0, 3, 128);
    g.fillRect(122, 0, 3, 128);
    g.fillStyle = 'rgba(255,200,40,0.85)';
    g.fillRect(63, 0, 2, 64);
  });
}

/** The salt crust cracked into white polygons with grey ridges. */
function crustTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#ece6da', 6961);
    const random = seeded(6963);
    g.strokeStyle = 'rgba(140,128,110,0.7)';
    g.lineWidth = 2;
    for (let cy = 0; cy < 256; cy += 48)
      for (let cx = (cy / 48) % 2 ? 24 : 0; cx < 280; cx += 48) {
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + random() * 0.3;
          const rr = 22 + random() * 6;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          if (k) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.closePath();
        g.stroke();
      }
  });
}

/** The Valle de la Luna's rust-red, wind-carved earth. */
function ridgeTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b8664a', 6971);
    g.fillStyle = 'rgba(240,220,200,0.3)';
    for (let y = 4; y < 128; y += 10) g.fillRect(0, y, 128, 2);
  });
}

/** The lagoon's still water, mirroring the sky. */
function lagoonTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#6aa0e0');
    grad.addColorStop(1, '#4a80c8');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const random = seeded(6981);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 30; i++) g.fillRect(random() * 128, random() * 128, 10, 1);
  });
}

/** The boardwalk's sun-silvered planks. */
function plankTexture(): CanvasTexture {
  return canvasTexture(64, 64, (g) => {
    speckle(g, 64, 64, '#a8987a', 6991);
    g.fillStyle = 'rgba(60,40,20,0.4)';
    for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 1, 64);
  });
}
