// Champs-Élysées Finale's avenue, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// last day of the great Tour, on a golden summer evening. The riders sprint up the avenue's
// cobbles between double rows of clipped plane trees and the cream stone of Haussmann's façades,
// their iron balconies and grey mansard roofs; crowds pack the barriers ten deep, waving
// tricolours, and the sponsors' banners hang along the barriers. Flags fly from the lamp posts,
// the 1 km kite hangs over the road once a lap, and ahead the Arc de Triomphe stands at the top
// of the avenue. Built on the shared kit (world-kit.ts) on the pattern of Old Town's street.
import {
  BoxGeometry,
  type BufferGeometry,
  type CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
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

/** The avenue repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.14;
/** The pavement's width before the façades, and where the barriers and the plane trees stand. */
const PAVEMENT = 22;
const BARRIER = 1;
const TREES = [8, 14];
/** The kite once a lap. */
const KITE = 180;

const CROWD_WEAR = {
  tops: [
    '#ffd23f',
    '#002395',
    '#ffffff',
    '#ed2939',
    '#1d1f24',
    '#ffd23f',
    '#3a86ff',
    '#ff6b5a',
    '#2a7a4a',
  ],
  bottoms: ['#1d1f24', '#2f3e5c', '#e8c9a0', '#5a5f69'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Fan {
  readonly offset: number;
  readonly x: number;
  readonly heading: number;
  readonly phase: number;
}

export class ChampsStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly fans: Fan[] = [];
  private crowd: Figures | null = null;
  private readonly flags: Mesh[] = [];
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
    this.addPavements(roadHalf, points);
    this.addFacades(roadHalf);
    this.addTrees(roadHalf);
    this.addBarriers(roadHalf);
    this.addFlags(roadHalf);
    this.addKite();
    this.addCrowd(roadHalf);
    this.addArc();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    this.flags.forEach((flag, k) => (flag.rotation.y = Math.sin(seconds * 3.4 + k * 1.3) * 0.35));
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  place(s: number, heightAt: (metres: number) => number): void {
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    const crowd = this.crowd;
    if (crowd) {
      this.fans.forEach((f, i) => {
        const metres = loopMetres(f.offset, s, LOOP, BEHIND);
        // The fans bounce on their toes as the race nears.
        const jump = Math.max(0, Math.sin(this.time * 5 + f.phase)) * 0.08;
        crowd.set(i, f.x, heightAt(metres) + KERB + jump, -metres, f.heading, 0.95, 0);
      });
      crowd.commit();
    }
    this.horizon.position.set(0, heightAt(0), 0);
  }

  /** The wide pavements both sides: sandy gravel under the trees, stone flags before the shops. */
  private addPavements(roadHalf: number, points: number): void {
    const r = roadHalf;
    const flags = this.material({ map: this.repeat(flagTexture(), 2, 2), roughness: 0.8 });
    const gravel = this.material({ map: this.repeat(gravelTexture(), 3, 3), roughness: 1 });
    for (const side of [-1, 1] as const) {
      const profile: [number, number][] = [
        [r, 0.006],
        [r + 0.1, KERB],
        [r + 5, KERB],
      ];
      const flagProfile: [number, number][] = [
        [r + 17, KERB],
        [r + PAVEMENT, KERB],
      ];
      const gravelProfile: [number, number][] = [
        [r + 5, KERB],
        [r + 17, KERB],
      ];
      for (const [p, m] of [
        [profile, flags],
        [gravelProfile, gravel],
        [flagProfile, flags],
      ] as const) {
        const mirrored = p.map(([x, y]) => [side * x, y] as [number, number]);
        this.ribbons.add(points, m, side > 0 ? [...mirrored].reverse() : mirrored);
      }
    }
  }

  /**
   * Haussmann's façades: six storeys of cream ashlar, the shopfronts at the foot, iron balconies
   * along the second and fifth floors, and grey zinc mansards with their dormers.
   */
  private addFacades(roadHalf: number): void {
    const random = seeded(1701);
    const front = this.track(facadeTexture());
    front.wrapS = RepeatWrapping;
    front.wrapT = RepeatWrapping;
    const zinc = this.material({
      map: this.track(mansardTexture()),
      roughness: 0.6,
      metalness: 0.3,
    });
    const awnings = ['#7a1a2a', '#1a3a5a', '#1d1f24', '#2a5a3a', '#c8a050'].map((c) =>
      this.material({ color: c, roughness: 0.8 }),
    );
    const roof = new BoxGeometry(1, 1, 1);
    roof.translate(0, 0.5, 0);
    this.disposables.push(roof);
    for (const side of [-1, 1] as const) {
      for (let offset = 0; offset < LOOP;) {
        const width = 20 + random() * 18;
        const map = front.clone();
        map.repeat.set(width / 8, 1);
        map.needsUpdate = true;
        this.track(map);
        const building = new Group();
        const body = new Mesh(this.unit, this.material({ map, roughness: 0.85 }));
        body.scale.set(20, 20, width - 0.3);
        body.position.set(side * 10, 10, -width / 2);
        body.castShadow = true;
        const mansard = new Mesh(roof, zinc);
        mansard.scale.set(18, 5, width - 0.6);
        mansard.position.set(side * 10.5, 20, -width / 2);
        const awning = new Mesh(this.unit, awnings[Math.floor(random() * awnings.length)]!);
        awning.scale.set(1.6, 0.15, width - 2);
        awning.position.set(-side * 0.7, 4.2, -width / 2);
        awning.rotation.z = side * 0.2;
        building.add(body, mansard, awning);
        this.group.add(building);
        this.props.push({ mesh: building, offset, x: side * (roadHalf + PAVEMENT) });
        offset += width;
      }
    }
  }

  /** The double rows of plane trees, their crowns clipped into boxes along the avenue. */
  private addTrees(roadHalf: number): void {
    const random = seeded(1709);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 0.95 });
    const leaves = [0x4a6a2a, 0x557a32, 0x3f5f26].map((c) =>
      this.material({ color: c, roughness: 0.95 }),
    );
    const trunk = new CylinderGeometry(0.25, 0.35, 5, 8);
    trunk.translate(0, 2.5, 0);
    const parts: BufferGeometry[] = [];
    for (let k = 0; k < 7; k++) {
      const blob = new SphereGeometry(1.8, 8, 6);
      blob.translate((k % 3) - 1, 7 + (k % 2) * 1.2, ((k * 7) % 5) * 0.6 - 1.2);
      parts.push(blob);
    }
    const crown = mergeGeometries(parts)!;
    crown.scale(1.3, 1, 1.4);
    parts.forEach((p) => p.dispose());
    this.disposables.push(trunk, crown);
    for (let offset = 0; offset < LOOP; offset += 8) {
      for (const side of [-1, 1] as const) {
        for (const d of TREES) {
          const tree = new Group();
          const c = new Mesh(crown, leaves[Math.floor(random() * 3)]!);
          tree.add(new Mesh(trunk, bark), c);
          tree.children.forEach((m) => (m.castShadow = true));
          tree.rotation.y = random() * 6;
          tree.scale.setScalar(0.9 + random() * 0.2);
          this.group.add(tree);
          this.props.push({
            mesh: tree,
            offset: offset + (d === 14 ? 4 : 0),
            x: side * (roadHalf + d),
          });
        }
      }
    }
  }

  /** The barriers along both kerbs, hung with the sponsors' banners. */
  private addBarriers(roadHalf: number): void {
    const banners = [0, 1, 2, 3].map((k) =>
      this.material({ map: this.track(bannerTexture(k)), roughness: 0.7 }),
    );
    const steel = this.material({ color: 0xb8bcc4, metalness: 0.6, roughness: 0.4 });
    const panel = new PlaneGeometry(2.4, 1);
    panel.translate(0, 0.6, 0);
    const rail = new BoxGeometry(0.05, 0.05, 2.5);
    rail.translate(0, 1.15, 0);
    this.disposables.push(panel, rail);
    for (let offset = 0, k = 0; offset < LOOP; offset += 2.5, k++) {
      for (const side of [-1, 1] as const) {
        const barrier = new Group();
        const face = new Mesh(panel, banners[Math.floor(k / 3) % 4]!);
        face.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        barrier.add(face, new Mesh(rail, steel));
        this.group.add(barrier);
        this.props.push({ mesh: barrier, offset, x: side * (roadHalf + BARRIER) });
      }
    }
  }

  /** Lamp posts along the kerbs, each flying a tricolour. */
  private addFlags(roadHalf: number): void {
    const iron = this.material({ color: 0x2a2c30, metalness: 0.5, roughness: 0.5 });
    const lantern = this.material({ color: 0xf2e8c8, emissive: 0xffd890, emissiveIntensity: 0.4 });
    const tricolour = this.material({
      map: this.track(tricolourTexture()),
      roughness: 0.8,
      side: 2,
    });
    const post = new CylinderGeometry(0.08, 0.14, 7, 8);
    post.translate(0, 3.5, 0);
    const head = new BoxGeometry(0.5, 0.8, 0.5);
    head.translate(0, 7.3, 0);
    const cloth = new PlaneGeometry(1.8, 1.2);
    cloth.translate(0.9, 0, 0);
    this.disposables.push(post, head, cloth);
    for (let offset = 6; offset < LOOP; offset += 24) {
      for (const side of [-1, 1] as const) {
        const lamp = new Group();
        lamp.add(new Mesh(post, iron), new Mesh(head, lantern));
        const flag = new Mesh(cloth, tricolour);
        flag.position.set(0, 5.6, 0);
        this.flags.push(flag);
        const mount = new Group();
        mount.add(flag);
        mount.rotation.y = side < 0 ? 0 : Math.PI;
        lamp.add(mount);
        this.group.add(lamp);
        this.props.push({ mesh: lamp, offset, x: side * (roadHalf + 3) });
      }
    }
  }

  /** The 1 km kite: the red triangle hung on its gantry over the avenue. */
  private addKite(): void {
    const red = this.material({ map: this.track(kiteTexture()), roughness: 0.6, side: 2 });
    const truss = this.material({ color: 0xd8dce4, metalness: 0.5, roughness: 0.4 });
    const gantry = new Group();
    for (const x of [-9, 9]) {
      const leg = new Mesh(this.unit, truss);
      leg.scale.set(0.4, 7, 0.4);
      leg.position.set(x, 3.5, 0);
      gantry.add(leg);
    }
    const beam = new Mesh(this.unit, truss);
    beam.scale.set(18.4, 0.5, 0.5);
    beam.position.y = 7;
    const kite = new Mesh(new PlaneGeometry(6, 2.6), red);
    this.disposables.push(kite.geometry);
    kite.position.set(0, 5.6, 0.3);
    gantry.add(beam, kite);
    this.group.add(gantry);
    this.props.push({ mesh: gantry, offset: KITE, x: 0 });
  }

  /** The crowd packed behind the barriers both sides, several deep, facing the road. */
  private addCrowd(roadHalf: number): void {
    const random = seeded(1721);
    for (let offset = 0; offset < LOOP; offset += 0.7 + random() * 0.5) {
      for (const side of [-1, 1] as const) {
        const rows = 2 + Math.floor(random() * 3);
        for (let row = 0; row < rows; row++) {
          this.fans.push({
            offset: offset + (random() - 0.5) * 0.4,
            x: side * (roadHalf + BARRIER + 0.6 + row * 0.7 + random() * 0.2),
            heading: (side < 0 ? -Math.PI / 2 : Math.PI / 2) + (random() - 0.5) * 0.8,
            phase: random() * 6,
          });
        }
      }
    }
    this.crowd = new Figures(this.group, this.disposables, this.fans.length, CROWD_WEAR, 1723);
  }

  /** The Arc de Triomphe at the top of the avenue, with a great tricolour hung beneath its vault. */
  private addArc(): void {
    const stone = this.material({ map: this.track(arcTexture()), roughness: 0.85 });
    const arc = new Group();
    for (const x of [-15, 15]) {
      const pier = new Mesh(this.unit, stone);
      pier.scale.set(15, 30, 22);
      pier.position.set(x, 15, 0);
      arc.add(pier);
    }
    const attic = new Mesh(this.unit, stone);
    attic.scale.set(45, 20, 22);
    attic.position.y = 40;
    const cornice = new Mesh(this.unit, stone);
    cornice.scale.set(47, 1.5, 24);
    cornice.position.y = 50.5;
    const vault = new Mesh(new CylinderGeometry(7.5, 7.5, 22, 20, 1, false, 0, Math.PI), stone);
    this.disposables.push(vault.geometry);
    vault.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    vault.position.y = 30;
    const flag = new Mesh(
      new PlaneGeometry(13, 22),
      this.material({ map: this.track(tricolourTexture()), roughness: 0.8, side: 2 }),
    );
    this.disposables.push(flag.geometry);
    flag.position.set(0, 19, 0);
    arc.add(attic, cornice, vault, flag);
    arc.position.set(0, 0, -1100);
    arc.scale.setScalar(2.4);
    this.horizon.add(arc);
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

/** Pale stone flags. */
function flagTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#b8b0a2', 1727);
    g.fillStyle = 'rgba(60,55,50,0.3)';
    for (let y = 0; y < 128; y += 42) g.fillRect(0, y, 128, 2);
    for (let x = 0; x < 128; x += 64) g.fillRect(x, 0, 2, 128);
  });
}

/** The sandy gravel under the plane trees. */
function gravelTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => speckle(g, 128, 128, '#c8b08a', 1733));
}

/** Plane-tree bark, mottled cream and olive. */
function barkTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#8a8466', 1739);
    const random = seeded(1741);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = random() < 0.5 ? 'rgba(220,210,180,0.6)' : 'rgba(80,90,60,0.5)';
      g.fillRect(random() * 64, random() * 128, 6 + random() * 12, 6 + random() * 14);
    }
  });
}

/**
 * Eight metres of Haussmann façade, ground to cornice: the shopfronts, then five floors of tall
 * windows in cream ashlar with iron balconies on the second and fifth floors.
 */
function facadeTexture(): CanvasTexture {
  return canvasTexture(256, 640, (g) => {
    speckle(g, 256, 640, '#e2d4b4', 1747);
    g.fillStyle = 'rgba(120,100,70,0.25)';
    for (let y = 0; y < 640; y += 16) g.fillRect(0, y, 256, 1);
    // The shopfronts across the foot.
    g.fillStyle = '#2a2c30';
    g.fillRect(0, 520, 256, 120);
    g.fillStyle = 'rgba(255,220,160,0.55)';
    g.fillRect(14, 540, 100, 90);
    g.fillRect(142, 540, 100, 90);
    // Five floors of windows, the balconies on the second and fifth.
    for (let floor = 0; floor < 5; floor++) {
      const y = 420 - floor * 100;
      for (const x of [26, 106, 186]) {
        g.fillStyle = '#c8b892';
        g.fillRect(x - 6, y - 6, 56, 78);
        g.fillStyle = '#2a3440';
        g.fillRect(x, y, 44, 70);
        g.fillStyle = '#e8e0cc';
        g.fillRect(x + 20, y, 4, 70);
      }
      if (floor === 0 || floor === 3) {
        g.fillStyle = '#1d1f24';
        g.fillRect(0, y + 70, 256, 4);
        for (let x = 0; x < 256; x += 6) g.fillRect(x, y + 56, 2, 16);
      }
    }
    g.fillStyle = '#c8b892';
    g.fillRect(0, 0, 256, 14);
  });
}

/** The zinc mansard with its dormers. */
function mansardTexture(): CanvasTexture {
  return canvasTexture(128, 64, (g) => {
    g.fillStyle = '#6a7078';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = 'rgba(30,30,35,0.3)';
    for (let x = 0; x < 128; x += 6) g.fillRect(x, 0, 1, 64);
    g.fillStyle = '#e8e0cc';
    g.fillRect(20, 20, 24, 30);
    g.fillRect(84, 20, 24, 30);
    g.fillStyle = '#2a3440';
    g.fillRect(24, 26, 16, 22);
    g.fillRect(88, 26, 16, 22);
  });
}

/** A barrier's banner, in the race's colours. */
function bannerTexture(k: number): CanvasTexture {
  const [bg, fg, word] = [
    ['#ffd23f', '#1d1f24', 'MAILLOT JAUNE'],
    ['#002395', '#ffffff', 'PARIS · ARRIVÉE'],
    ['#ffffff', '#ed2939', 'ALLEZ ! ALLEZ !'],
    ['#2a7a4a', '#ffffff', 'DERNIÈRE ÉTAPE'],
  ][k]!;
  return canvasTexture(256, 96, (g) => {
    g.fillStyle = bg!;
    g.fillRect(0, 0, 256, 96);
    g.fillStyle = fg!;
    g.font = 'bold 28px sans-serif';
    g.textAlign = 'center';
    g.fillText(word!, 128, 60, 240);
  });
}

/** The tricolour: blue, white and red. */
function tricolourTexture(): CanvasTexture {
  return canvasTexture(96, 64, (g) => {
    ['#002395', '#ffffff', '#ed2939'].forEach((c, k) => {
      g.fillStyle = c;
      g.fillRect(k * 32, 0, 32, 64);
    });
  });
}

/** The flamme rouge: the red kite with its distance. */
function kiteTexture(): CanvasTexture {
  return canvasTexture(240, 104, (g) => {
    g.fillStyle = '#d8202a';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(240, 0);
    g.lineTo(120, 104);
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    g.fillText('1 KM', 120, 44);
  });
}

/** The Arc's pale limestone, with the friezes' bands and the reliefs' panels. */
function arcTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#d8ccb0', 1753);
    g.fillStyle = 'rgba(110,95,70,0.35)';
    g.fillRect(0, 40, 256, 10);
    g.fillRect(0, 200, 256, 6);
    g.fillRect(40, 90, 70, 80);
    g.fillRect(146, 90, 70, 80);
  });
}
