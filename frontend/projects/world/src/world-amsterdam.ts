// Amsterdam Canals' street, drawn by world-renderer.ts (L2-101 AC1, L2-111 technique 1): the
// Herengracht on a May morning. The rider takes the brick street along the canal; gabled canal
// houses and stone-faced mansions rise on the right and face them again across the water, dressed
// as lived in. Elms, cast-iron lamps, parked cars and bikes line the quay; houseboats lie moored
// along both walls while tour boats, sloepen and canal bikes pass; humpback brick bridges with
// their cross streets span the canal every 120 m; and commuters, walkers and visitors fill the
// streets and quays. The view closes on the canal's bend under the Westertoren. Built on the
// shared kit (world-kit.ts) on the pattern of Old Town's street; docs/screenshots/amsterdam
// records each step.
import {
  BufferAttribute,
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  type CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  type Texture,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  canvasTexture,
  hazedMaterial,
  loopMetres,
  Ribbons,
  type SceneStreet,
  seeded,
  speckle,
} from './world-kit';
import { clinkerTexture } from './amsterdam-clinker';
import type { StreetPoint } from './world-oldtown';

/** The gracht repeats every LOOP metres; its parts run from BEHIND metres behind the rider. */
const LOOP = 360;
const BEHIND = 24;
const KERB = 0.12;
/** The quay between the street and the canal, the canal's width, and its water below. */
const QUAY = 5.2;
const CANAL = 25;
const WATER = 1.5;
/** The far quay's width, and the narrow pavement before the houses on the rider's side. */
const FAR_QUAY = 5;
const PAVEMENT = 2.2;
/** How far ahead the Westertoren stands over the end of the gracht. */
const TOWER = 560;
/** A humpback bridge crosses the canal every BRIDGE metres. */
const BRIDGE = 120;
/** The ride sets off this far along the loop, so the opening view looks ahead to a bridge. */
const START = 80;

const COMMUTER_WEAR = {
  tops: ['#1d1f24', '#f5f5f0', '#2c7be5', '#ff7a00', '#7a8ca0', '#c8102e', '#3a6b4a', '#e8c9a0'],
  bottoms: ['#1d1f24', '#2f3e5c', '#5a5f69', '#8a8f99'],
  skins: ['#f0c8a0', '#e2b48c', '#c48a5f', '#8d5a3b', '#f5d3b5', '#5a3a29'],
};

interface Rider {
  readonly bike: Object3D;
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly phase: number;
}

interface Walker {
  readonly offset: number;
  readonly x: number;
  readonly speed: number;
  readonly scale: number;
  readonly phase: number;
}

export class AmsterdamStreet implements SceneStreet {
  readonly group = new Group();
  private readonly ribbons: Ribbons;
  private readonly props: { mesh: Group; offset: number; x: number }[] = [];
  private readonly riders: Rider[] = [];
  private readonly walkers: Walker[] = [];
  private cyclists: SeatedRiders | null = null;
  private pedestrians: Walkers | null = null;
  private dogs: InstancedMesh | null = null;
  private readonly boats: { mesh: Group; offset: number; speed: number; float?: number }[] = [];
  private time = 0;
  private readonly unit = new BoxGeometry(1, 1, 1);
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly one = new Vector3(1, 1, 1);
  private readonly up = new Vector3(0, 1, 0);
  private readonly tower = new Group();
  private readonly clouds = new Group();
  private readonly gulls: { mesh: Group; radius: number; height: number; phase: number }[] = [];
  private waterMap: CanvasTexture | null = null;
  private bikePaints: MeshStandardMaterial[] | null = null;
  private sitters: MeshStandardMaterial | null = null;
  private extra: (() => number) | null = null;
  private tilts: (() => number) | null = null;
  private foam: MeshStandardMaterial | null = null;
  private lanes: (() => number) | null = null;
  private farDress: (() => number) | null = null;
  private ivyRoll: (() => number) | null = null;
  private lockRoll: (() => number) | null = null;
  private saleRoll: (() => number) | null = null;
  private readonly crossers: { mesh: Group; phase: number; speed: number }[] = [];
  private bikeShape: BufferGeometry | null = null;

  constructor(
    private readonly track: <T extends Texture>(texture: T) => T,
    private readonly disposables: { dispose(): void }[],
  ) {
    this.ribbons = new Ribbons(this.group, disposables);
  }

  build(roadHalf: number, points: number): void {
    this.disposables.push(this.unit);
    this.addGround(roadHalf, points);
    this.addHouses(roadHalf);
    this.addElmsAndLamps(roadHalf);
    this.addParkedBikes(roadHalf);
    this.addBollards(roadHalf);
    this.addParkedCars(roadHalf);
    this.addStreetFurniture(roadHalf);
    this.addCafe(roadHalf);
    this.addScooters(roadHalf);
    this.addSigns(roadHalf);
    this.addBenches(roadHalf);
    this.addContainers(roadHalf);
    this.addTour(roadHalf);
    this.addScaffold(roadHalf);
    this.addMovingLift(roadHalf);
    this.addShop(roadHalf);
    this.addCabinets(roadHalf);
    this.addFamily(roadHalf);
    this.addFlowerStall(roadHalf);
    this.addChatter(roadHalf);
    this.addFarTerrace(roadHalf);
    this.addBridges(roadHalf);
    this.addHouseboats(roadHalf);
    this.addCommuters(roadHalf);
    this.addWaterfowl(roadHalf);
    this.addBirds(roadHalf);
    this.addHeron(roadHalf);
    this.addWestertoren();
    this.addClouds();
  }

  setTime(seconds: number): void {
    this.time = seconds;
    // The canal's ripples drift with the breeze.
    this.waterMap?.offset.set(seconds * 0.004, seconds * 0.011);
  }

  lay(points: readonly StreetPoint[], s: number): void {
    this.ribbons.lay(points, s);
  }

  /**
   * The ground plane drops far below the canal's water, so the canal lies below the quays and its
   * reflections hang beneath the water's surface.
   */
  sink(ground: BufferGeometry, points: readonly StreetPoint[]): void {
    const position = ground.getAttribute('position') as BufferAttribute;
    points.forEach((p, i) => {
      position.setY(i * 2, p.height - WATER - 40);
      position.setY(i * 2 + 1, p.height - WATER - 40);
    });
    position.needsUpdate = true;
    ground.computeBoundingSphere();
  }

  place(s: number, heightAt: (metres: number) => number): void {
    this.tower.position.set(12, heightAt(0), -TOWER);
    // The people crossing the bridges go over the hump and back.
    for (const c of this.crossers) {
      const u = (((c.phase + c.speed * this.time) % CANAL) + CANAL) % CANAL;
      const rise = 1.4 * Math.sin((Math.PI * u) / CANAL);
      c.mesh.position.set(u, KERB + rise, c.mesh.position.z);
      c.mesh.rotation.y = c.speed > 0 ? -Math.PI / 2 : Math.PI / 2;
      c.mesh.rotation.x = 0;
    }
    // Gulls wheel over the canal ahead, beating their wings now and then.
    for (const gull of this.gulls) {
      const a = this.time * 0.25 + gull.phase;
      gull.mesh.position.set(
        -14 + Math.cos(a) * gull.radius,
        gull.height + Math.sin(a * 2) * 1.5,
        -48 + Math.sin(a) * gull.radius,
      );
      gull.mesh.rotation.y = -a;
      const flap = Math.sin(this.time * 7 + gull.phase) * 0.35 * (Math.sin(a * 3) > 0.4 ? 1 : 0.15);
      gull.mesh.children[1]!.rotation.z = 0.15 + flap;
      gull.mesh.children[2]!.rotation.z = -0.15 - flap;
    }
    // The clouds drift slowly from the west across the sky and stay over the horizon.
    this.clouds.position.set(((this.time * 1.5 + 1200) % 2400) - 1200, 0, 0);
    for (const prop of this.props) {
      const metres = loopMetres(prop.offset, s + START, LOOP, BEHIND);
      prop.mesh.position.set(prop.x, heightAt(metres), -metres);
    }
    for (const boat of this.boats) {
      const metres = loopMetres(boat.offset + boat.speed * this.time, s + START, LOOP, BEHIND);
      boat.mesh.position.z = -metres;
      boat.mesh.position.y =
        heightAt(metres) + (boat.float ?? 0) + Math.sin(this.time * 1.3 + boat.offset) * 0.02;
    }
    const cyclists = this.cyclists;
    if (cyclists) {
      this.riders.forEach((r, i) => {
        const metres = loopMetres(r.offset + r.speed * this.time, s + START, LOOP, BEHIND);
        const y = heightAt(metres);
        const heading = r.speed > 0 ? 0 : Math.PI;
        r.bike.position.set(r.x, y, -metres);
        r.bike.rotation.y = heading;
        cyclists.set(i, r.x, y, -metres, heading, Math.sin(this.time * 5 + r.phase) * 0.015);
      });
    }
    const pedestrians = this.pedestrians;
    if (pedestrians) {
      this.walkers.forEach((w, i) => {
        const metres = loopMetres(w.offset + w.speed * this.time, s + START, LOOP, BEHIND);
        const pace = Math.abs(w.speed) > 2 ? 2.4 : 1;
        const step = Math.abs(Math.sin(this.time * 4.5 * pace + w.phase)) * 0.04 * pace;
        const y = heightAt(metres) + KERB;
        pedestrians.set(
          i,
          w.x,
          y,
          -metres,
          w.speed > 0 ? 0 : Math.PI,
          w.scale,
          step,
          this.time * 4.5 * pace + w.phase,
        );
        // Every fifth walker has a dog trotting ahead on its lead.
        if (this.dogs && i % 5 === 0) {
          const ahead = w.speed > 0 ? 1 : -1;
          this.matrix.compose(
            this.spot.set(w.x + 0.3, y + step * 0.5, -metres - ahead * 1.1),
            this.turn.setFromAxisAngle(this.up, w.speed > 0 ? 0 : Math.PI),
            this.one,
          );
          this.dogs.setMatrixAt(i / 5, this.matrix);
        }
      });
      pedestrians.commit();
      if (this.dogs) this.dogs.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * The brick street, the quays' clinker paving, the canal's stone edges and walls, its water,
   * and the narrow pavement before the houses.
   */
  private addGround(roadHalf: number, points: number): void {
    const r = roadHalf;
    const street = this.material({
      map: this.repeat(clinkerTexture('#8a4a36'), 2.4, 2.4),
      roughness: 0.85,
    });
    const quay = this.material({
      map: this.repeat(clinkerTexture('#86705f'), 2.4, 2.4),
      roughness: 0.9,
    });
    const stone = this.material({ color: 0x8f8a82, roughness: 0.9 });
    const wall = this.material({
      map: this.repeat(canalWallTexture(false), 1.3, 3),
      roughness: 0.95,
    });
    const farWall = this.material({
      map: this.repeat(canalWallTexture(true), WATER + KERB, 3),
      roughness: 0.95,
    });
    this.waterMap = this.repeat(waterTexture(), 12, 12);
    const water = this.material({
      map: this.waterMap,
      roughness: 0.08,
      metalness: 0.25,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const sky = new MeshBasicMaterial({ color: 0xb4cadb });
    const mirroredWall = this.material({
      map: this.repeat(brickTexture(), 2, 2),
      color: 0x6f7a78,
      roughness: 1,
    });
    this.disposables.push(sky);
    const edge = -r - QUAY;
    const far = edge - CANAL;
    this.ribbons.add(points, street, [
      [r, 0.004],
      [-r, 0.004],
    ]);
    this.ribbons.add(points, quay, [
      [-r - 0.18, KERB],
      [edge + 0.4, KERB],
    ]);
    this.ribbons.add(points, stone, [
      [edge + 0.4, KERB],
      [edge, KERB],
      [edge, -0.2],
    ]);
    this.ribbons.add(points, wall, [
      [edge, -0.2],
      [edge, -WATER],
    ]);
    // The water mirrors the sky and its own walls: the sky lies far beneath it and the walls
    // hang upside down under their reflections' line, all seen through the water's tint.
    this.ribbons.add(points, sky, [
      [edge, -WATER - 30],
      [far, -WATER - 30],
    ]);
    this.ribbons.add(points, mirroredWall, [
      [edge, -2 * WATER - KERB],
      [edge, -WATER],
    ]);
    this.ribbons.add(points, mirroredWall, [
      [far, -WATER],
      [far, -2 * WATER - KERB],
    ]);
    this.ribbons.add(points, water, [
      [edge, -WATER],
      [far, -WATER],
    ]);
    this.ribbons.add(points, farWall, [
      [far, -WATER],
      [far, KERB],
    ]);
    this.ribbons.add(points, quay, [
      [far, KERB],
      [far - FAR_QUAY, KERB],
    ]);
    const tiles = this.material({ map: this.repeat(pavementTexture(), 1.2, 1.2), roughness: 0.9 });
    const granite = this.material({ map: this.repeat(kerbTexture(), 0.3, 1.5), roughness: 0.8 });
    this.ribbons.add(points, tiles, [
      [r + PAVEMENT, KERB],
      [r + 0.18, KERB],
    ]);
    this.ribbons.add(points, granite, [
      [r + 0.18, KERB],
      [r + 0.02, KERB],
      [r, 0.004],
    ]);
    this.ribbons.add(points, granite, [
      [-r, 0.004],
      [-r - 0.02, KERB],
      [-r - 0.18, KERB],
    ]);
    // The gutters along both kerbs, with a gully grate every 12 m, and May's papery elm seeds
    // drifted against the kerbs and the house fronts.
    const litter = (kerbFirst: boolean, grates: boolean) =>
      this.material({
        map: this.repeat(gutterTexture(kerbFirst, grates), 0.6, 12),
        transparent: true,
        depthWrite: false,
        roughness: 0.9,
      });
    this.ribbons.add(points, litter(true, true), [
      [r, 0.009],
      [r - 0.6, 0.009],
    ]);
    this.ribbons.add(points, litter(false, true), [
      [-r + 0.6, 0.009],
      [-r, 0.009],
    ]);
    this.ribbons.add(points, litter(false, false), [
      [r + PAVEMENT, KERB + 0.006],
      [r + PAVEMENT - 0.6, KERB + 0.006],
    ]);
  }

  /**
   * The canal houses on the rider's side and across the water: each its own block, narrow
   * gabled houses (step, bell, neck and spout) among the wider cornice-topped mansions of the
   * Herengracht, set back or forward a little from its neighbours, its front drawn on it.
   */
  private addHouses(roadHalf: number): void {
    const random = seeded(401);
    const sides = this.material({ map: this.repeat(brickTexture(), 4, 4), roughness: 0.95 });
    const flankWall = this.material({ map: this.track(flankTexture()), roughness: 0.92 });
    const shapes = GABLES.map((kind) => {
      const geometry = new ExtrudeGeometry(gableShape(kind), { depth: 1, bevelEnabled: false });
      this.disposables.push(geometry);
      return geometry;
    });
    const fronts = GABLES.map((kind, k) =>
      [0, 1, 2, 3, 4].map((v) =>
        this.material({
          map: this.track(
            facadeTexture(
              kind,
              kind === 'cornice' ? STONE[v]! : FRONTS[(k * 3 + v * 5) % FRONTS.length]!,
              503 + k * 7 + v,
              v % 2 === 1,
            ),
          ),
          roughness: 0.85,
        }),
      ),
    );
    // Their reflections in the canal: the same fronts, darkened by the water.
    const mirrored = new Map(
      fronts.flat().map((m) => [m, this.material({ map: m.map, color: 0x6f7a78, roughness: 1 })]),
    );
    const mirroredSides = this.material({ color: 0x3a3634, roughness: 1 });
    const stone = this.material({ color: 0xa39d92, roughness: 0.9 });
    const iron = this.material({ color: 0x15171a, metalness: 0.5, roughness: 0.5 });
    const { steps, railings } = stoopGeometry();
    const timber = this.material({ color: 0x2a2420, roughness: 0.8 });
    const dark = this.material({ color: 0x1e2830, roughness: 0.2, metalness: 0.3 });
    const hemp = this.material({ color: 0xb89a6a, roughness: 0.95 });
    const white = this.material({ color: 0xf2f2ee, roughness: 0.5 });
    const amsterdam = this.material({
      map: this.track(flagTexture(true)),
      side: DoubleSide,
      roughness: 0.9,
    });
    const dutch = this.material({
      map: this.track(flagTexture(false)),
      side: DoubleSide,
      roughness: 0.9,
    });
    const flagPole = new CylinderGeometry(0.025, 0.03, 2.4, 6);
    flagPole.translate(0, 1.2, 0);
    const flagCloth = flagGeometry();
    this.disposables.push(flagPole, flagCloth);
    const ledge = this.material({ color: 0xece6d8, roughness: 0.75 });
    const zinc = this.material({ color: 0x8a8f94, metalness: 0.6, roughness: 0.45 });
    const ball = new SphereGeometry(0.16, 8, 6);
    ball.translate(0, 0.16, 0);
    const vase = new LatheGeometry(
      [
        [0, 0],
        [0.14, 0],
        [0.08, 0.1],
        [0.18, 0.3],
        [0.1, 0.5],
        [0.14, 0.56],
        [0, 0.62],
      ].map(([x, y]) => new Vector2(x, y)),
      10,
    );
    this.disposables.push(ball, vase);
    const relief = GABLES.map((kind) => [false, true].map((right) => reliefGeometry(kind, right)));
    this.disposables.push(...relief.flat());
    const hookGeometry = new TorusGeometry(0.1, 0.025, 4, 8, Math.PI * 1.5);
    this.disposables.push(hookGeometry);
    const gableRoof = roofGeometry(false);
    const hip = roofGeometry(true);
    const roof = this.material({ map: this.repeat(roofTexture(), 0.25, 0.25), roughness: 0.85 });
    this.disposables.push(steps, railings, gableRoof, hip);
    const decor = this.decor();
    let wisteriaShown = false;
    const rows = [
      { x: roadHalf + PAVEMENT, turn: Math.PI / 2 },
      { x: -roadHalf - QUAY - CANAL - FAR_QUAY, turn: -Math.PI / 2 },
    ];
    const street = this.material({
      map: this.repeat(clinkerTexture('#8a4a36'), 2.4, 2.4),
      roughness: 0.85,
    });
    const paving = new BoxGeometry(CROSS, 0.2, 60);
    paving.translate(0, -0.1, 0);
    paving.rotateY(Math.PI / 2);
    this.disposables.push(paving);
    // Far up the gracht the canal bends, so the view closes on the houses of its outer bank:
    // a row of fronts turned towards the rider, standing with the Westertoren's distance.
    {
      const bend = new Group();
      let along = -46;
      while (along < 22) {
        const k = Math.floor(random() * 5);
        const width = k === 4 ? 12 : 6 + random() * 2;
        const height = k === 4 ? 16 : 17 + random() * 4;
        const end = new Mesh(shapes[k]!, [fronts[k]![Math.floor(random() * VARIANTS)]!, sides]);
        end.scale.set(width, height, 10);
        end.position.set(along, 0, 0);
        bend.add(end);
        along += width;
      }
      bend.rotation.y = -0.35;
      bend.position.set(-4, 0, 212);
      this.tower.add(bend);
    }
    for (const { x, turn } of rows) {
      const away = turn > 0 ? 1 : -1;
      // A cross street runs off the gracht at each bridge, paved back between the houses, with
      // the houses of the next canal closing its far end.
      for (let b = 0; b < LOOP; b += BRIDGE) {
        const cross = new Group();
        const floor = new Mesh(paving, street);
        floor.position.x = away * 30;
        floor.receiveShadow = true;
        cross.add(floor);
        for (let n = 0; n < 2; n++) {
          const k = Math.floor(random() * 4);
          const end = new Mesh(shapes[k]!, [fronts[k]![Math.floor(random() * VARIANTS)]!, sides]);
          end.scale.set(CROSS / 2, 16 + random() * 3, 8);
          end.rotation.y = turn;
          end.position.set(away * 42, 0, (away * CROSS) / 2 - (away * n * CROSS) / 2);
          cross.add(end);
        }
        // The cross street's own houses, facing each other across it from behind the corner
        // houses to its far end.
        const lane = (this.lanes ??= seeded(767));
        for (const facing of [1, -1]) {
          for (let start = 12.5; start < 40;) {
            const k = Math.floor(lane() * 4);
            const width = 5 + lane() * 2;
            const side = new Mesh(shapes[k]!, [fronts[k]![Math.floor(lane() * VARIANTS)]!, sides]);
            side.scale.set(width, 15 + lane() * 4, 8);
            const flip = facing > 0 ? Math.PI : 0;
            side.rotation.y = flip;
            const near = away > 0 ? (flip ? start + width : start) : flip ? -start : -start - width;
            side.position.set(near, 0, (-facing * CROSS) / 2);
            cross.add(side);
            start += width;
          }
        }
        this.group.add(cross);
        this.props.push({ mesh: cross, offset: b + 2, x });
      }
      for (let offset = 0; offset < LOOP;) {
        const gap = bridgeGap(offset);
        if (gap !== null) {
          offset = gap;
          continue;
        }
        const roll = random();
        let k = roll < 0.22 ? 4 : Math.floor(random() * 4);
        // A house too wide to fit before the next cross street is cut down to the room left.
        const room = nextGap(offset) - offset;
        let width = Math.min(room, k === 4 ? 11 + random() * 5 : 5.6 + random() * 2.4);
        if (room - width < 3.5) width = room;
        if (width < 9 && k === 4) k = Math.floor(random() * 4);
        const height = k === 4 ? 15 + random() * 3 : 17 + random() * 4;
        const house = new Group();
        const variant = Math.floor(random() * VARIANTS);
        const face = fronts[k]![variant]!;
        const block = (
          front: MeshStandardMaterial,
          wall: MeshStandardMaterial,
          tiles: MeshStandardMaterial,
        ) => {
          // The front with its gable, 0.5 m thick; the house's body behind it up to the eaves;
          // and a pitched roof of tiles, its ridge running back from the gable (or, behind a
          // mansion's cornice, along the front).
          const whole = new Group();
          const screen = new Mesh(shapes[k]!, [front, wall]);
          screen.scale.set(width, height, 0.5);
          // The stone sills, lintels and cornice standing proud of the front.
          screen.add(new Mesh(relief[k]![variant % 2]!, ledge));
          // The body's flanks, seen where a cross street opens beside it, have their own
          // windows; its back and top are plain.
          const flank = wall === sides ? flankWall : wall;
          const body = new Mesh(this.unit, [flank, flank, wall, wall, wall, wall]);
          body.scale.set(width, height * EAVES, 11.5);
          body.position.set(width / 2, (height * EAVES) / 2, 6.25);
          const pitch = new Mesh(k === 4 ? hip : gableRoof, tiles);
          pitch.scale.set(width, height * (k === 4 ? 0.2 : 0.95 - EAVES), 11.5);
          pitch.position.set(0, height * EAVES, 0.5);
          whole.add(screen, body, pitch);
          // A brick chimney stack on the ridge of most roofs, and a dormer or two on the front
          // slope of a mansion's hipped roof.
          if (random() < 0.65) {
            const stack = new Mesh(this.unit, wall);
            const top = k === 4 ? height * (EAVES + 0.2) : height * 0.95;
            stack.scale.set(0.7, 1.8, 0.7);
            stack.position.set(width * (0.3 + random() * 0.4), top + 0.3, 4 + random() * 5);
            const cap = new Mesh(this.unit, tiles);
            cap.scale.set(0.9, 0.12, 0.9);
            cap.position.set(stack.position.x, top + 1.26, stack.position.z);
            whole.add(stack, cap);
          }
          if (k === 4) {
            for (let d = 0; d < 2; d++) {
              const dormer = new Mesh(this.unit, wall);
              dormer.scale.set(1.3, 1.3, 1.4);
              dormer.position.set(width * (0.3 + d * 0.4), height * EAVES + 0.9, 2.2);
              const hood = new Mesh(gableRoof, tiles);
              hood.scale.set(1.5, 0.7, 1.6);
              hood.position.set(width * (0.3 + d * 0.4) - 0.75, height * EAVES + 1.55, 1.4);
              const pane = new Mesh(this.unit, dark);
              pane.scale.set(0.8, 0.8, 0.05);
              pane.position.set(width * (0.3 + d * 0.4), height * EAVES + 0.9, 1.48);
              whole.add(dormer, hood, pane);
            }
          }
          // Canal houses lean forward over the street a little, built so on purpose to keep
          // goods hoisted up the front clear of the windows.
          const lean = -0.006 - random() * 0.01;
          screen.rotation.x = lean;
          // A zinc downpipe runs down the front at the party wall from a hopper under the eaves.
          if (downpipe) {
            const pipe = new Mesh(this.unit, zinc);
            pipe.scale.set(0.09, height * EAVES - 0.3, 0.09);
            pipe.position.set(0.12, (height * EAVES) / 2 + 0.15, -0.08);
            const hopper = new Mesh(this.unit, zinc);
            hopper.scale.set(0.22, 0.25, 0.2);
            hopper.position.set(0.12, height * EAVES - 0.05, -0.1);
            whole.add(pipe, hopper);
          }
          // Sandstone ornaments on the gable's outline: ball finials on a stepped gable's steps,
          // urns on a neck gable's shoulders, and a crowning piece on top.
          for (const [u, v, urn] of FINIALS[GABLES[k]!]) {
            const piece = new Mesh(urn ? vase : ball, front === face ? ledge : wall);
            piece.position.set(u * width, v * height + 0.05, 0.25 + v * height * lean);
            whole.add(piece);
          }
          if (k !== 4) {
            // The hoist beam juts from the top of the gable, a hook hanging from its end.
            const beam = new Mesh(this.unit, timber);
            beam.scale.set(0.18, 0.24, 1.3);
            beam.position.set(width / 2, height * 0.9, -0.55 + height * 0.9 * lean);
            const hook = new Mesh(hookGeometry, iron);
            hook.position.set(width / 2, height * 0.9 - 0.3, -1.1 + height * 0.9 * lean);
            whole.add(beam, hook);
            if (rigged) {
              // On some, a pulley block and its rope hang from the beam, the rope's end tied
              // off at a first-floor window.
              const block = new Mesh(this.unit, timber);
              block.scale.set(0.16, 0.3, 0.12);
              block.position.set(width / 2, height * 0.9 - 0.35, -1.15 + height * 0.9 * lean);
              const drop = height * 0.9 - 0.5 - height * 0.32;
              const rope = new Mesh(this.unit, hemp);
              rope.scale.set(0.025, drop, 0.025);
              rope.position.set(width / 2, height * 0.32 + drop / 2, -1.15 + height * 0.6 * lean);
              whole.add(block, rope);
            }
          }
          whole.rotation.y = turn;
          // Some fronts have settled on their piles and lean sideways against a neighbour.
          whole.rotation.z = settle;
          whole.children.forEach((m) => {
            m.castShadow = true;
            m.receiveShadow = true;
          });
          return whole;
        };
        const tilt = (this.tilts ??= seeded(751))();
        const downpipe = tilt > 0.35;
        const rigged = tilt > 0.88;
        const settle = tilt < 0.18 ? (tilt < 0.09 ? 1 : -1) * (0.006 + tilt * 0.06) : 0;
        house.add(block(face, sides, roof));
        if (turn < 0) {
          const reflection = block(mirrored.get(face)!, mirroredSides, mirroredSides);
          reflection.scale.y = -1;
          reflection.position.y = -2 * WATER;
          house.add(reflection);
        }
        // The stoop up to the door, its steps running out onto the pavement.
        const along = doorAt(GABLES[k]!, variant % 2 === 1) * width;
        const stoop = new Group();
        stoop.add(new Mesh(steps, stone), new Mesh(railings, iron));
        stoop.position.z = turn > 0 ? -along : along;
        stoop.rotation.y = turn > 0 ? 0 : Math.PI;
        stoop.scale.z = random() < 0.5 ? 1 : -1;
        const stoopSide = turn > 0 ? -stoop.scale.z : stoop.scale.z;
        stoop.children.forEach((m) => (m.castShadow = true));
        house.add(stoop);
        if (turn > 0) {
          // One house just up the street from the start always has its wisteria, so the opening
          // view shows one.
          const featured = !wisteriaShown && offset > START + BEHIND + 22;
          if (featured) wisteriaShown = true;
          this.dress(
            house,
            GABLES[k]!,
            width,
            height,
            along / width,
            random,
            decor,
            featured,
            -stoopSide,
          );
        } else {
          // Across the canal the fronts are dressed the same way, seen from the water: the
          // dressing is built as for the rider's side and turned round to face the canal.
          const dressing = new Group();
          this.dress(
            dressing,
            GABLES[k]!,
            width,
            height,
            along / width,
            (this.farDress ??= seeded(773)),
            decor,
            false,
            stoopSide,
          );
          dressing.rotation.y = Math.PI;
          house.add(dressing);
        }
        if (random() < 0.16) {
          // A flag on a pole angled out from the first floor: Amsterdam's red-black-red with its
          // three St Andrew's crosses, or now and then the Dutch tricolour.
          const flag = new Group();
          const pole = new Mesh(flagPole, white);
          const cloth = new Mesh(flagCloth, random() < 0.75 ? amsterdam : dutch);
          flag.add(pole, cloth);
          flag.rotation.y = turn > 0 ? 0 : Math.PI;
          flag.rotateZ(0.6);
          flag.position.set(0, height * 0.32, turn > 0 ? -width * 0.5 : width * 0.5);
          flag.children.forEach((m) => (m.castShadow = true));
          house.add(flag);
        }
        this.group.add(house);
        // The house's front runs from `offset` to `offset + width` along the gracht.
        const setback = random() * 0.35;
        const front = turn > 0 ? x + setback : x - setback;
        this.props.push({ mesh: house, offset: turn > 0 ? offset : offset + width, x: front });
        offset += width;
      }
    }
  }

  /**
   * The Westertoren, rising over the rooftops at the end of the gracht and keeping its distance
   * as the rider rides: a square brick base with stone bands, a stone clock stage, two
   * octagonal stone stages, a lantern, and on top the blue imperial crown picked out in gold
   * under an orb and weathervane. Hazed by hand, out of the fog, as far landmarks are.
   */
  private addWestertoren(): void {
    const haze = new Color(0xd6dde3);
    const brick = hazedMaterial(this.disposables, haze, 0x7a3a2a, 0.3);
    const stone = hazedMaterial(this.disposables, haze, 0xd8cfb8, 0.3);
    const dark = hazedMaterial(this.disposables, haze, 0x2a2a2a, 0.3);
    const blue = hazedMaterial(this.disposables, haze, 0x2a4a8c, 0.22);
    const gold = hazedMaterial(this.disposables, haze, 0xd9a830, 0.18, { metalness: 0.6 });
    const add = (geometry: BufferGeometry, material: MeshStandardMaterial, y: number) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.y = y;
      this.tower.add(mesh);
      this.disposables.push(geometry);
    };
    add(new BoxGeometry(11, 36, 11).translate(0, 18, 0), brick, 0);
    for (const y of [12, 24, 35.5]) add(new BoxGeometry(11.4, 0.8, 11.4), stone, y);
    add(new BoxGeometry(9.4, 10, 9.4).translate(0, 5, 0), stone, 36);
    const clocks = new CylinderGeometry(1.6, 1.6, 9.6, 16).rotateZ(Math.PI / 2);
    add(clocks, dark, 41);
    add(clocks.clone().rotateY(Math.PI / 2), dark, 41);
    add(new CylinderGeometry(4.2, 4.6, 10, 8).translate(0, 5, 0), stone, 46);
    add(new CylinderGeometry(3.6, 4.4, 0.8, 8), dark, 56.4);
    add(new CylinderGeometry(3, 3.2, 8, 8).translate(0, 4, 0), stone, 56.8);
    add(new CylinderGeometry(2.6, 3.1, 0.6, 8), dark, 65);
    add(new CylinderGeometry(2, 2.2, 5, 8).translate(0, 2.5, 0), stone, 65.3);
    // The imperial crown: a blue cap swelling under gold arches, a gold band at its foot.
    add(new CylinderGeometry(2.4, 2.4, 0.7, 12), gold, 70.6);
    add(
      new SphereGeometry(2.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.6, 1),
      blue,
      70.9,
    );
    for (let a = 0; a < 4; a++) {
      const arch = new TorusGeometry(2.1, 0.16, 4, 16, Math.PI);
      arch.scale(1, 1.6, 1);
      arch.rotateY((a * Math.PI) / 4);
      add(arch, gold, 70.9);
    }
    add(new SphereGeometry(0.6, 10, 8), gold, 74.8);
    add(new CylinderGeometry(0.08, 0.12, 4, 6).translate(0, 2, 0), gold, 75.3);
    add(new BoxGeometry(1.4, 0.1, 0.1), gold, 78.6);
    // The Westerkerk's nave stretching away behind the tower: brick walls with tall arched
    // windows under a steep slate-blue roof, crossed by the transepts' gables.
    const slate = hazedMaterial(this.disposables, haze, 0x3a4250, 0.3);
    const nave = new Mesh(new BoxGeometry(26, 16, 58).translate(0, 8, -35), brick);
    this.disposables.push(nave.geometry);
    this.tower.add(nave);
    const roof = new Shape();
    roof.moveTo(-13.5, 0);
    roof.lineTo(13.5, 0);
    roof.lineTo(0, 14);
    roof.closePath();
    const pitch = new ExtrudeGeometry(roof, { depth: 58, bevelEnabled: false });
    pitch.translate(0, 16, -64);
    add(pitch, slate, 0);
    for (const z of [-22, -46]) {
      const transept = new ExtrudeGeometry(roof, { depth: 34, bevelEnabled: false });
      transept.rotateY(Math.PI / 2);
      transept.translate(-17, 16, z);
      add(transept, slate, 0);
      add(new BoxGeometry(34, 16, 26).translate(0, 8, z), brick, 0);
    }
    this.group.add(this.tower);
  }

  /**
   * A Dutch sky: banks of fair-weather cumulus over the far end of the gracht, white and piled
   * up on top with grey, flat bases, drawn as soft cards out of the fog.
   */
  private addClouds(): void {
    const random = seeded(557);
    const maps = [0, 1, 2].map((k) => this.track(cloudTexture(561 + k * 4)));
    const materials = maps.map((map) => {
      const material = new MeshBasicMaterial({
        map,
        transparent: true,
        depthWrite: false,
        fog: false,
        // Brighter than white, so the heads stay white through the tone mapping.
        color: new Color(1.7, 1.7, 1.75),
      });
      this.disposables.push(material);
      return material;
    });
    const card = new PlaneGeometry(1, 0.5);
    this.disposables.push(card);
    for (let i = 0; i < 22; i++) {
      const cloud = new Mesh(card, materials[i % 3]!);
      const far = 900 + random() * 900;
      const width = 260 + random() * 320;
      cloud.scale.set(width, width, 1);
      cloud.position.set((random() - 0.5) * 1800, 120 + random() * 320 + far * 0.06, -far);
      cloud.renderOrder = -1;
      this.clouds.add(cloud);
    }
    // High above, thin streaks of cirrus combed out by the wind, and a fading contrail.
    const wisps = new MeshBasicMaterial({
      map: this.track(cirrusTexture()),
      transparent: true,
      depthWrite: false,
      fog: false,
      color: new Color(1.5, 1.5, 1.55),
      side: DoubleSide,
    });
    this.disposables.push(wisps);
    const streak = new PlaneGeometry(1, 0.18);
    this.disposables.push(streak);
    for (let i = 0; i < 7; i++) {
      const cirrus = new Mesh(streak, wisps);
      const far = 1400 + random() * 800;
      const width = 500 + random() * 600;
      cirrus.scale.set(width, width, 1);
      cirrus.position.set((random() - 0.5) * 1600, 420 + random() * 380, -far);
      cirrus.rotation.z = (random() - 0.5) * 0.5;
      cirrus.renderOrder = -2;
      this.clouds.add(cirrus);
    }
    this.group.add(this.clouds);
  }

  /** The window boxes and façade gardens' materials and shapes. */
  private decor() {
    const gardens = [0, 1, 2].map((k) => gardenGeometry(521 + k * 5));
    const geraniums = geraniumGeometry();
    const wisterias = [0, 1].map((k) => wisteriaGeometry(709 + k * 6));
    const lantern = wallLantern();
    const pot = new CylinderGeometry(0.2, 0.15, 0.36, 10);
    pot.translate(0, 0.18, 0);
    const ball = new IcosahedronGeometry(0.28, 1);
    this.disposables.push(lantern.frame, lantern.glass, pot, ball);
    this.disposables.push(
      ...gardens.flatMap((g) => [g.leaves, g.flowers]),
      geraniums,
      ...wisterias.flatMap((w) => [w.stems, w.leaves, w.flowers]),
    );
    return {
      gardens,
      geraniums,
      box: this.material({ color: 0x3a2a20, roughness: 0.9 }),
      leaves: this.material({ color: 0x3f6a2a, roughness: 0.95 }),
      blooms: [0xd23a5a, 0xf2f0f2, 0xe86a9a, 0x8a3ab0].map((hex) =>
        this.material({ color: hex, roughness: 0.8 }),
      ),
      geranium: this.material({ color: 0xd8282e, roughness: 0.8 }),
      wisterias,
      bark: this.material({ color: 0x4a3e34, roughness: 1 }),
      lilac: this.material({ color: 0xa88ad8, roughness: 0.8 }),
      whiteWisteria: this.material({ color: 0xeee8f4, roughness: 0.8 }),
      paints: [0x16181b, 0x16181b, 0x2a3a5c, 0x6a1a1a, 0x8fc0b0, 0xe8dcc0].map((hex) =>
        this.material({ color: hex, metalness: 0.35, roughness: 0.5 }),
      ),
      people: this.material({ vertexColors: true, roughness: 0.85 }),
      lantern,
      black: this.material({ color: 0x1b1b1f, metalness: 0.5, roughness: 0.45 }),
      glow: this.material({
        color: 0xfff2d8,
        emissive: 0xffd890,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.85,
      }),
      plate: this.material({ color: 0x1d3f7c, roughness: 0.4 }),
      pot,
      ball,
      terracotta: this.material({ color: 0xb0583a, roughness: 0.9 }),
      sale: this.material({ map: this.track(saleBoardTexture()), roughness: 0.6 }),
      white: this.material({ color: 0xf2f2ee, roughness: 0.6 }),
      bench: this.material({ color: 0x8a8a84, roughness: 0.85 }),
    };
  }

  /**
   * Dresses a house on the rider's side: a façade garden of hollyhocks and roses along its foot
   * on half the houses, and window boxes of red geraniums under the first-floor windows on a
   * third. Built against a front at x 0 facing -x, running along -z.
   */
  private dress(
    house: Group,
    kind: Gable,
    width: number,
    height: number,
    door: number,
    random: () => number,
    decor: ReturnType<AmsterdamStreet['decor']>,
    featured = false,
    stoopSide = 1,
  ): void {
    if (random() < 0.5) {
      const bloom = decor.blooms[Math.floor(random() * decor.blooms.length)]!;
      for (let u = 0.08; u < 0.95; u += 0.18 + random() * 0.2) {
        if (Math.abs(u - door) < 0.16) continue;
        const garden = decor.gardens[Math.floor(random() * 3)]!;
        const clump = new Group();
        clump.add(new Mesh(garden.leaves, decor.leaves), new Mesh(garden.flowers, bloom));
        clump.position.set(-0.3, KERB, -u * width);
        clump.rotation.y = random() * Math.PI * 2;
        clump.children.forEach((m) => (m.castShadow = true));
        house.add(clump);
      }
    }
    if (random() < 0.35) {
      for (const { u, v, span } of sills(kind)) {
        const box = new Mesh(this.unit, decor.box);
        box.scale.set(0.24, 0.22, span * width);
        box.position.set(-0.12, v * height - 0.11, -u * width);
        const flowers = new Mesh(decor.geraniums, decor.geranium);
        flowers.scale.set(1, 1, span * width);
        flowers.position.set(-0.12, v * height, -u * width);
        house.add(box, flowers);
      }
    }
    // A bike or two leant against the front, out of the stoop's way, and on some stoops
    // someone sitting on the steps in the sun with a coffee.
    const extra = (this.extra ??= seeded(743));
    for (let u = 0.12; u < 0.9; u += 0.35) {
      if (Math.abs(u - door) < 0.22 || extra() < 0.55) continue;
      if (!this.bikeShape) {
        this.bikeShape = bikeGeometry();
        this.disposables.push(this.bikeShape);
      }
      const paint = decor.paints[Math.floor(extra() * decor.paints.length)]!;
      const leaning = new Mesh(this.bikeShape, paint);
      leaning.position.set(-0.32, KERB, -u * width);
      leaning.rotation.set(0.12, extra() < 0.5 ? 0 : Math.PI, 0, 'YXZ');
      leaning.castShadow = true;
      house.add(leaning);
    }
    if (extra() < 0.45) {
      // Pots of box and bay on the stoop's landing, either side of the door.
      for (const dz of [-0.45, 0.45]) {
        const pot = new Mesh(decor.pot, decor.terracotta);
        pot.position.set(-0.75, KERB + 1.12, -door * width + dz);
        const shrub = new Mesh(decor.ball, decor.leaves);
        shrub.position.set(-0.75, KERB + 1.12 + 0.55, -door * width + dz);
        house.add(pot, shrub);
      }
    }
    if (extra() < 0.18) {
      // A bench put out against the front, a pot of herbs beside it.
      const bench = new Group();
      const seat = new Mesh(this.unit, decor.bench);
      seat.scale.set(0.4, 0.05, 1.4);
      seat.position.set(0, 0.45, 0);
      const back = new Mesh(this.unit, decor.bench);
      back.scale.set(0.05, 0.45, 1.4);
      back.position.set(0.18, 0.72, 0);
      bench.add(seat, back);
      for (const z of [-0.6, 0.6]) {
        const leg = new Mesh(this.unit, decor.bench);
        leg.scale.set(0.38, 0.45, 0.05);
        leg.position.set(0, 0.225, z);
        bench.add(leg);
      }
      const side = door > 0.5 ? -1 : 1;
      bench.position.set(-0.25, KERB, -door * width + side * 2.2 - width * 0.0);
      bench.children.forEach((m) => (m.castShadow = true));
      house.add(bench);
    }
    if (extra() < 0.6) {
      // A lantern on a bracket beside the door, and the house number on an enamel plate.
      const lantern = new Group();
      lantern.add(
        new Mesh(decor.lantern.frame, decor.black),
        new Mesh(decor.lantern.glass, decor.glow),
      );
      lantern.position.set(0, height * 0.19, -door * width + (door > 0.5 ? 1 : -1) * 1.0);
      house.add(lantern);
      const number = new Mesh(this.unit, decor.plate);
      number.scale.set(0.02, 0.16, 0.24);
      number.position.set(-0.05, height * 0.17, -door * width + (door > 0.5 ? -1 : 1) * 0.75);
      house.add(number);
    }
    if ((this.saleRoll ??= seeded(911))() < 0.08) {
      // A house for sale: the estate agent's board hung out from a first-floor window on its
      // bracket, TE KOOP in white on orange.
      const board = new Mesh(this.unit, [
        decor.sale,
        decor.sale,
        decor.white,
        decor.white,
        decor.sale,
        decor.sale,
      ]);
      board.scale.set(0.7, 0.5, 0.04);
      board.rotation.y = Math.PI / 2;
      board.position.set(-0.45, height * 0.42, -width * 0.5);
      const arm = new Mesh(this.unit, decor.white);
      arm.scale.set(0.8, 0.04, 0.04);
      arm.position.set(-0.4, height * 0.42 + 0.27, -width * 0.5);
      house.add(board, arm);
    }
    if (extra() < 0.22) {
      const sitter = new Mesh(sitterGeometry(extra), decor.people);
      this.disposables.push(sitter.geometry);
      sitter.rotation.y = Math.PI / 2;
      sitter.position.set(-0.6, KERB + 0.56 - 0.42, -door * width + stoopSide * 1.05);
      sitter.castShadow = true;
      house.add(sitter);
    }
    if (random() < 0.1 || featured) {
      // A wisteria trained up the front from a corner, its cascades of lilac in flower.
      const vine = decor.wisterias[Math.floor(random() * decor.wisterias.length)]!;
      const plant = new Group();
      plant.add(
        new Mesh(vine.stems, decor.bark),
        new Mesh(vine.leaves, decor.leaves),
        new Mesh(vine.flowers, extra() < 0.3 ? decor.whiteWisteria : decor.lilac),
      );
      plant.scale.set(1, Math.min(1, (height * 0.55) / 9), Math.min(1, (width - 0.6) / 6));
      plant.position.set(-0.08, KERB, door > 0.5 ? -0.3 : -width + 0.3);
      if (door > 0.5) plant.scale.z *= -1;
      plant.children.forEach((m) => (m.castShadow = true));
      house.add(plant);
    }
  }

  /** Elms along both quays and Amsterdam's dark green lamps between them. */
  private addElmsAndLamps(roadHalf: number): void {
    const random = seeded(419);
    const bark = this.material({ map: this.track(barkTexture()), roughness: 1 });
    const foliage = this.track(leafTexture());
    const leaves = [0xffffff, 0xe6f0c8, 0xd2e2b4].map((hex) =>
      this.material({
        map: foliage,
        color: hex,
        alphaTest: 0.45,
        side: DoubleSide,
        roughness: 0.9,
      }),
    );
    const shadowed = new Map(
      leaves.map((m) => [
        m,
        this.material({
          map: foliage,
          color: m.color.clone().multiplyScalar(0.55),
          alphaTest: 0.45,
          side: DoubleSide,
          roughness: 1,
        }),
      ]),
    );
    const iron = this.material({ color: 0x1f3a2c, metalness: 0.4, roughness: 0.5 });
    const glass = this.material({
      color: 0xf6f1e0,
      emissive: 0xffe6b0,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    const elms = [0, 1, 2].map((k) => elmGeometry(467 + k * 13));
    const soil = this.material({ color: 0x3a3026, roughness: 1 });
    const grass = this.material({ color: 0x4f7a32, roughness: 1 });
    const tuft = tuftGeometry();
    const guard = new TorusGeometry(0.75, 0.025, 4, 4, Math.PI * 2);
    guard.rotateX(Math.PI / 2);
    guard.rotateY(Math.PI / 4);
    guard.translate(0, 0.4, 0);
    const roots = new CylinderGeometry(0.3, 0.55, 0.35, 8);
    roots.translate(0, KERB + 0.15, 0);
    const ivy = ivyGeometry();
    const ivyLeaf = this.material({ color: 0x24401e, roughness: 0.85 });
    this.disposables.push(tuft, guard, roots, ivy);
    const { post, lantern } = canalLamp();
    const lockBike = bikeGeometry();
    const gullBody = new CapsuleGeometry(0.09, 0.26, 3, 8);
    gullBody.rotateX(Math.PI / 2 - 0.3);
    gullBody.translate(0, 0.14, 0);
    const gullBack = new BoxGeometry(0.2, 0.05, 0.34);
    gullBack.translate(0, 0.22, 0.04);
    const gullWhite = this.material({ color: 0xf2f2ee, roughness: 0.8 });
    const gullGrey = this.material({ color: 0x9aa0a8, roughness: 0.8 });
    this.disposables.push(gullBody, gullBack);
    const lockPaints = [0x16181b, 0x2a3a5c, 0x6a1a1a, 0x8fc0b0, 0xe8dcc0].map((hex) =>
      this.material({ color: hex, metalness: 0.35, roughness: 0.5 }),
    );
    this.disposables.push(lockBike);
    this.disposables.push(...elms.flatMap((e) => [e.wood, e.leaves]), post, lantern);
    const quays = [-roadHalf - QUAY + 1.1, -roadHalf - QUAY - CANAL - 1.2];
    for (const x of quays) {
      for (let offset = 0; offset < LOOP; offset += 9) {
        if (offset % BRIDGE < 8) continue;
        const tree = new Group();
        const leaf = leaves[Math.floor(random() * 3)]!;
        const elm = elms[Math.floor(random() * 3)]!;
        tree.add(new Mesh(elm.wood, bark), new Mesh(elm.leaves, leaf));
        tree.children.forEach((m) => (m.castShadow = true));
        // Its bed in the paving: a square of earth gone over to grass and weeds, edged in
        // stone, a low iron hoop guarding it, and a root flare where the trunk meets the ground.
        const bed = new Mesh(this.unit, soil);
        bed.scale.set(1.6, 0.06, 1.6);
        bed.position.y = KERB + 0.01;
        const weeds = new Mesh(tuft, grass);
        weeds.position.y = KERB;
        const hoop = new Mesh(guard, iron);
        hoop.position.y = KERB;
        const flare = new Mesh(roots, bark);
        tree.add(bed, weeds, hoop, flare);
        // Ivy climbing the trunk of about one elm in three.
        if ((this.ivyRoll ??= seeded(821))() < 0.35) tree.add(new Mesh(ivy, ivyLeaf));
        const size = 0.9 + random() * 0.3;
        if (x < quays[0]!) {
          // The far quay's elms hang upside down in the water.
          const reflection = new Group();
          reflection.add(new Mesh(elm.wood, bark), new Mesh(elm.leaves, shadowed.get(leaf)!));
          reflection.scale.y = -1;
          reflection.position.y = (-2 * WATER) / size;
          tree.add(reflection);
        }
        tree.scale.setScalar(size);
        tree.rotation.y = random() * Math.PI * 2;
        this.group.add(tree);
        this.props.push({ mesh: tree, offset: offset + random() * 2, x });
      }
      // A lamp every 27 m along the quay, and one at each end of every bridge.
      const spots: number[] = [];
      for (let offset = 13.5; offset < LOOP; offset += 27) {
        if (bridgeGap(offset) === null && bridgeGap(offset + 4) === null) spots.push(offset);
      }
      for (let b = 0; b < LOOP; b += BRIDGE) spots.push(b - 4 + (b === 0 ? LOOP : 0), b + 8);
      for (const offset of spots) {
        const lamp = new Group();
        lamp.add(new Mesh(post, iron), new Mesh(lantern, glass));
        // A bike or two locked to the lamp post, leant against it from either side, and on some
        // a herring gull standing on the lantern's crown.
        const locked = (this.lockRoll ??= seeded(907));
        if (locked() < 0.3) {
          const gull = new Group();
          const body = new Mesh(gullBody, gullWhite);
          const back = new Mesh(gullBack, gullGrey);
          gull.add(body, back);
          gull.position.set(0, 5.18, 0);
          gull.rotation.y = locked() * Math.PI * 2;
          lamp.add(gull);
        }
        for (const side of [-1, 1]) {
          if (locked() < 0.45) continue;
          const bike = new Mesh(lockBike, lockPaints[Math.floor(locked() * lockPaints.length)]!);
          bike.position.set(side * 0.28, KERB, side * 0.35);
          bike.rotation.set(0, Math.PI / 2 + side * 0.3, side * 0.16, 'YXZ');
          lamp.add(bike);
        }
        lamp.children.forEach((m) => (m.castShadow = true));
        this.group.add(lamp);
        this.props.push({ mesh: lamp, offset, x: x + 0.6 });
      }
    }
  }

  /**
   * Amsterdammertjes: the city's red-brown cast-iron bollards, each with its three St Andrew's
   * crosses, standing in a line along the kerb before the houses, cast as tiles of the gracht.
   */
  private addBollards(roadHalf: number): void {
    const iron = this.material({ color: 0x4f2219, metalness: 0.35, roughness: 0.55 });
    const tile = (spacing: number, gaps: boolean, random: () => number) => {
      const parts: BufferGeometry[] = [];
      for (let z = 0; z < 30; z += spacing) {
        if (gaps && z % 10 > 8.4) continue;
        // Now and then one has been knocked out by a van, or knocked askew.
        if (random() < 0.07) continue;
        const bollard = amsterdammertje();
        if (random() < 0.15) {
          bollard.rotateZ((random() - 0.5) * 0.3);
          bollard.rotateX((random() - 0.5) * 0.2);
        }
        bollard.translate(0, 0, -z);
        parts.push(bollard);
      }
      const merged = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      this.disposables.push(merged);
      return merged;
    };
    const tiles = [0, 1, 2].map((k) => tile(2.4, true, seeded(881 + k)));
    const rows = [{ x: roadHalf + 0.3 }];
    for (const { x } of rows) {
      for (let offset = 0; offset < LOOP; offset += 30) {
        if (offset % BRIDGE < 8) continue;
        const run = new Group();
        const mesh = new Mesh(tiles[(offset / 30) % 3]!, iron);
        mesh.castShadow = true;
        mesh.position.y = KERB;
        run.add(mesh);
        this.group.add(run);
        this.props.push({ mesh: run, offset, x });
      }
    }
  }

  /**
   * Small cars parked nose to tail along the canal side of the street, as they are all along the
   * Herengracht: hatchbacks, a few city cars and the odd delivery van, in the greys, blacks,
   * whites and dark blues of a Dutch street, with gaps between them.
   */
  private addParkedCars(roadHalf: number): void {
    const random = seeded(509);
    const paints = [0x2a2c30, 0xd9dcdf, 0x8a9096, 0x1f2d4a, 0x5a6066, 0xf2f2ee, 0x7a1f1f, 0x3a4a3a];
    const bodies = paints.map((hex) =>
      this.material({ color: hex, metalness: 0.55, roughness: 0.35 }),
    );
    const glass = this.material({ color: 0x1a2028, metalness: 0.6, roughness: 0.1 });
    const rubber = this.material({ color: 0x141414, roughness: 0.9 });
    // Dutch number plates are yellow; the lamps are glass over chrome.
    const yellow = this.material({ color: 0xf2c418, roughness: 0.4 });
    const lamp = this.material({ color: 0xf4f6f8, metalness: 0.6, roughness: 0.15 });
    const red = this.material({ color: 0xa8141a, roughness: 0.25 });
    const taxiSign = this.material({
      map: this.track(taxiTexture()),
      emissive: 0xffe080,
      emissiveIntensity: 0.2,
      roughness: 0.4,
    });
    let taxied = false;
    const kinds = (['hatch', 'city', 'van'] as const).map((kind) => {
      const car = carGeometry(kind);
      this.disposables.push(car.body, car.glass, car.wheels, car.plates, car.heads, car.tails);
      return car;
    });
    // Along the near kerb, and along the far quay's water's edge, facing the other way.
    const rows = [
      { x: -roadHalf - 1.25, turn: 0 },
      { x: -roadHalf - QUAY - CANAL - 1.3, turn: Math.PI },
    ];
    for (const row of rows)
      for (let offset = row.turn ? 5 : 0; offset < LOOP;) {
        const gap = bridgeGap(offset);
        if (gap !== null) {
          offset = gap + 1;
          continue;
        }
        const roll = random();
        const car = kinds[roll < 0.55 ? 0 : roll < 0.88 ? 1 : 2]!;
        if (offset + car.length > nextGap(offset)) {
          offset = nextGap(offset);
          continue;
        }
        if (random() < 0.2) {
          offset += 3 + random() * 4;
          continue;
        }
        const parked = new Group();
        const paint = car === kinds[2] ? bodies[5]! : bodies[Math.floor(random() * bodies.length)]!;
        parked.add(
          new Mesh(car.body, paint),
          new Mesh(car.glass, glass),
          new Mesh(car.wheels, rubber),
          new Mesh(car.plates, yellow),
          new Mesh(car.heads, lamp),
          new Mesh(car.tails, red),
        );
        parked.children.forEach((m) => (m.castShadow = true));
        parked.children.forEach((m) => (m.position.y = KERB));
        this.group.add(parked);
        parked.children.forEach((m) => (m.rotation.y = row.turn));
        if (!taxied && row.turn === 0 && car !== kinds[2] && offset > START + BEHIND + 30) {
          // A taxi waiting at the kerb: black, its lit roof sign on top.
          taxied = true;
          (parked.children[0] as Mesh).material = bodies[0]!;
          const sign = new Mesh(this.unit, taxiSign);
          sign.scale.set(0.75, 0.2, 0.18);
          sign.rotation.y = Math.PI / 2;
          sign.position.set(0, KERB + (car === kinds[1] ? 1.62 : 1.58), 0.2);
          parked.add(sign);
        }
        this.props.push({ mesh: parked, offset: offset + car.length / 2, x: row.x });
        offset += car.length + 0.6 + random() * 1.2;
      }
  }

  /**
   * The quay's street furniture: a green cast-iron krul, the canals' curled urinal screen, just
   * past the first bridge, and dark green litter bins on posts every 45 m along both kerbs.
   */
  private addStreetFurniture(roadHalf: number): void {
    const green = this.material({
      color: 0x1f3a2c,
      metalness: 0.35,
      roughness: 0.55,
      side: DoubleSide,
    });
    const zinc = this.material({ color: 0x6a6e70, metalness: 0.5, roughness: 0.5 });
    const screen = new CylinderGeometry(0.85, 0.85, 1.7, 18, 1, true, 0, Math.PI * 1.55);
    screen.translate(0, 1.05, 0);
    const cap = new TorusGeometry(0.85, 0.05, 4, 18, Math.PI * 1.55);
    cap.rotateX(Math.PI / 2);
    cap.translate(0, 1.95, 0);
    const finial = new ConeGeometry(0.12, 0.5, 8);
    finial.translate(0, 2.3, 0);
    const pillar = new CylinderGeometry(0.06, 0.08, 2.1, 8);
    pillar.translate(0, 1.05, 0);
    const bin = new CylinderGeometry(0.24, 0.22, 0.6, 12);
    bin.translate(0, 0.85, 0);
    const lid = new CylinderGeometry(0.26, 0.26, 0.06, 12);
    lid.translate(0, 1.18, 0);
    const post = new CylinderGeometry(0.04, 0.04, 0.9, 6);
    post.translate(0, 0.45, 0);
    this.disposables.push(screen, cap, finial, pillar, bin, lid, post);
    const krul = new Group();
    for (const geometry of [screen, cap, finial, pillar]) krul.add(new Mesh(geometry, green));
    krul.rotation.y = 0.6;
    krul.children.forEach((m) => (m.castShadow = true));
    krul.position.y = KERB;
    const spot = new Group();
    spot.add(krul);
    this.group.add(spot);
    this.props.push({ mesh: spot, offset: BRIDGE + 11, x: -roadHalf - QUAY + 2.4 });
    for (const x of [-roadHalf - 2.6, roadHalf + 0.35]) {
      for (let offset = 7; offset < LOOP; offset += 45) {
        if (bridgeGap(offset) !== null) continue;
        const litter = new Group();
        litter.add(new Mesh(bin, green), new Mesh(lid, zinc), new Mesh(post, zinc));
        litter.children.forEach((m) => (m.castShadow = true));
        litter.position.y = KERB;
        const at = new Group();
        at.add(litter);
        this.group.add(at);
        this.props.push({ mesh: at, offset: offset + (x > 0 ? 20 : 0), x });
      }
    }
  }

  /**
   * A brown café on the corner by the first bridge: a narrow terrace of round marble-topped
   * tables and bistro chairs against the front on the pavement, people sitting over drinks, and
   * the café's name board in gold on dark green over the windows.
   */
  private addCafe(roadHalf: number): void {
    const random = seeded(653);
    const iron = this.material({ color: 0x1b1b1f, metalness: 0.5, roughness: 0.5 });
    const marble = this.material({ color: 0xe8e4dc, roughness: 0.4 });
    const wicker = this.material({ color: 0x8a6a40, roughness: 0.9 });
    const board = this.material({ map: this.track(cafeBoardTexture()), roughness: 0.6 });
    const glass = this.material({
      color: 0xd8a040,
      transparent: true,
      opacity: 0.8,
      roughness: 0.2,
    });
    const clothes = this.material({ vertexColors: true, roughness: 0.85 });
    const chalk = this.material({ map: this.track(menuBoardTexture()), roughness: 0.9 });
    const top = new CylinderGeometry(0.32, 0.32, 0.03, 16);
    top.translate(0, 0.74, 0);
    const stem = new CylinderGeometry(0.025, 0.12, 0.74, 8);
    stem.translate(0, 0.37, 0);
    const seat = new CylinderGeometry(0.2, 0.2, 0.05, 12);
    seat.translate(0, 0.46, 0);
    const back = new BoxGeometry(0.4, 0.42, 0.04);
    back.translate(0, 0.7, 0.19);
    const beer = new CylinderGeometry(0.035, 0.03, 0.16, 8);
    beer.translate(0.1, 0.84, -0.05);
    this.disposables.push(top, stem, seat, back, beer);
    const terrace = new Group();
    for (let t = 0; t < 4; t++) {
      const table = new Group();
      table.add(new Mesh(top, marble), new Mesh(stem, iron), new Mesh(beer, glass));
      table.position.set(0, 0, -t * 1.7);
      terrace.add(table);
      for (const side of [-1, 1]) {
        const chair = new Group();
        chair.add(new Mesh(seat, wicker), new Mesh(back, wicker), new Mesh(stem, iron));
        chair.position.set(0, 0, -t * 1.7 + side * 0.55);
        chair.rotation.y = side > 0 ? 0 : Math.PI;
        terrace.add(chair);
        if (random() < 0.7) {
          const person = new Mesh(sitterGeometry(random), clothes);
          person.position.copy(chair.position);
          person.rotation.y = chair.rotation.y;
          terrace.add(person);
          this.disposables.push(person.geometry);
        }
      }
    }
    terrace.children.forEach((m) => m.traverse((o) => (o.castShadow = true)));
    const sign = new Mesh(this.unit, board);
    sign.scale.set(0.08, 0.5, 4.2);
    sign.position.set(PAVEMENT - 1.35 - 0.06, 3.3, -2.5);
    terrace.add(sign);
    // The waiter in a long black apron bringing a tray out, the chalkboard of the day's menu
    // standing at the terrace's end, and a dog lying under a table.
    const waiter = new Mesh(standerGeometry(seeded(829), false), clothes);
    this.disposables.push(waiter.geometry);
    waiter.position.set(-0.6, 0, -3.4);
    waiter.rotation.y = Math.PI / 2;
    const apron = new Mesh(this.unit, iron);
    apron.scale.set(0.42, 0.75, 0.05);
    apron.position.set(-0.6 - 0.2, 0.62, -3.4);
    apron.rotation.y = Math.PI / 2;
    const tray = new Mesh(top, marble);
    tray.scale.set(0.6, 1, 0.6);
    tray.position.set(-0.95, 0.42, -3.4);
    const easel = new Mesh(this.unit, [iron, chalk, iron, iron, iron, iron]);
    easel.scale.set(0.05, 1.0, 0.6);
    easel.position.set(-0.75, 0.5, 1.0);
    easel.rotation.z = 0.12;
    const hound = new Mesh(dogGeometry(), this.material({ color: 0x7a5a3a, roughness: 0.95 }));
    this.disposables.push(hound.geometry);
    hound.scale.set(1, 0.6, 1);
    hound.rotation.y = Math.PI / 2;
    hound.position.set(0.1, 0, -1.7);
    terrace.add(waiter, apron, tray, easel, hound);
    terrace.position.y = KERB;
    this.group.add(terrace);
    this.props.push({ mesh: terrace, offset: BRIDGE + 2 - CROSS / 2 - 0.9, x: roadHalf + 1.35 });
  }

  /**
   * Scooters parked on their stands along the pavement's kerb and on the quay, in mint, cream,
   * red, black and white, as Amsterdam's snorfietsen stand everywhere bikes do.
   */
  private addScooters(roadHalf: number): void {
    const random = seeded(701);
    const paints = [0x9fd4c0, 0xefe6cc, 0xb8242a, 0x1b1b1f, 0xf2f2ee].map((hex) =>
      this.material({ color: hex, metalness: 0.3, roughness: 0.35 }),
    );
    const rubber = this.material({ color: 0x141414, roughness: 0.9 });
    const seat = this.material({ color: 0x3a2a20, roughness: 0.7 });
    const scooter = scooterGeometry();
    this.disposables.push(scooter.body, scooter.wheels, scooter.seat);
    const spots: [number, number][] = [];
    for (let offset = 4; offset < LOOP; offset += 22 + random() * 25) {
      if (bridgeGap(offset) === null)
        spots.push([offset, random() < 0.5 ? roadHalf + 0.75 : -roadHalf - 2.9]);
    }
    spots.push([START + BEHIND + 7.4, roadHalf + 0.75], [START + BEHIND + 8.5, roadHalf + 0.75]);
    for (const [offset, x] of spots) {
      const parked = new Group();
      parked.add(
        new Mesh(scooter.body, paints[Math.floor(random() * paints.length)]!),
        new Mesh(scooter.wheels, rubber),
        new Mesh(scooter.seat, seat),
      );
      parked.children.forEach((m) => (m.castShadow = true));
      parked.rotation.set(0, Math.PI / 2 + (random() - 0.5) * 0.5, x > 0 ? 0.06 : -0.06);
      parked.position.y = KERB;
      const at = new Group();
      at.add(parked);
      this.group.add(at);
      this.props.push({ mesh: at, offset, x });
    }
  }

  /**
   * Traffic signs on grey posts at the corners of every cross street: the street's one-way
   * sign with its plate excepting cyclists, a 30 zone sign, and on the quay the blue parking
   * sign for permit holders.
   */
  private addSigns(roadHalf: number): void {
    const grey = this.material({ color: 0x8a8e90, metalness: 0.6, roughness: 0.4 });
    const faces = (['oneway', 'thirty', 'parking'] as const).map((kind) =>
      this.material({ map: this.track(signTexture(kind)), roughness: 0.5 }),
    );
    const post = new CylinderGeometry(0.04, 0.04, 2.9, 8);
    post.translate(0, 1.45, 0);
    this.disposables.push(post);
    const sign = (face: MeshStandardMaterial, y: number, w: number, h: number) => {
      const plate = new Mesh(this.unit, [grey, face, grey, grey, grey, grey]);
      plate.scale.set(0.02, h, w);
      plate.position.set(-0.04, y, 0);
      return plate;
    };
    for (let b = 0; b < LOOP; b += BRIDGE) {
      const near = new Group();
      near.add(
        new Mesh(post, grey),
        sign(faces[0]!, 2.55, 0.6, 0.6),
        sign(faces[1]!, 1.95, 0.5, 0.5),
      );
      near.position.y = KERB;
      const quay = new Group();
      quay.add(new Mesh(post, grey), sign(faces[2]!, 2.4, 0.5, 0.75));
      quay.position.y = KERB;
      for (const [group, x, along] of [
        [near, roadHalf + 0.35, b + 2 + CROSS / 2 + 0.6],
        [quay, -roadHalf - 2.6, b + 2 + CROSS / 2 + 2],
      ] as const) {
        group.children.forEach((m) => (m.castShadow = true));
        const at = new Group();
        at.add(group);
        group.rotation.y = Math.PI / 2;
        this.group.add(at);
        this.props.push({ mesh: at, offset: along, x });
      }
    }
  }

  /**
   * Benches on the quay before every bridge, facing the water: green slats on cast-iron ends,
   * with people sitting on them in the sun, and at each a pair sitting on the quay's edge with
   * their legs over the water.
   */
  private addBenches(roadHalf: number): void {
    const random = seeded(733);
    const slats = this.material({ color: 0x2f5a3a, roughness: 0.8 });
    const iron = this.material({ color: 0x1b1b1f, metalness: 0.5, roughness: 0.5 });
    const people = this.material({ vertexColors: true, roughness: 0.85 });
    const seat = new BoxGeometry(0.45, 0.05, 1.8);
    seat.translate(0, 0.45, 0);
    const back = new BoxGeometry(0.05, 0.4, 1.8);
    back.rotateZ(-0.15);
    back.translate(0.24, 0.72, 0);
    const ends = mergeGeometries(
      [-0.8, 0.8].map((z) => {
        const end = new BoxGeometry(0.5, 0.45, 0.06);
        end.translate(0.02, 0.225, z);
        return end;
      }),
    )!;
    this.disposables.push(seat, back, ends);
    const edge = -roadHalf - QUAY;
    for (let b = 0; b < LOOP; b += BRIDGE) {
      for (const along of [-2.4]) {
        const bench = new Group();
        bench.add(new Mesh(seat, slats), new Mesh(back, slats), new Mesh(ends, iron));
        for (let p = 0; p < 2; p++) {
          if (random() < 0.3) continue;
          const sitter = new Mesh(sitterGeometry(random), people);
          this.disposables.push(sitter.geometry);
          sitter.rotation.y = Math.PI / 2;
          sitter.position.set(0.05, -0.02, (p - 0.5) * 0.9);
          bench.add(sitter);
        }
        bench.children.forEach((m) => (m.castShadow = true));
        bench.position.y = KERB;
        const at = new Group();
        at.add(bench);
        this.group.add(at);
        this.props.push({ mesh: at, offset: b + along, x: edge + 2.2 });
      }
      // Two friends on the quay's edge, legs dangling over the water.
      const pair = new Group();
      for (const z of [0, 0.7]) {
        const sitter = new Mesh(sitterGeometry(random), people);
        this.disposables.push(sitter.geometry);
        sitter.rotation.y = Math.PI / 2;
        sitter.position.set(0.25, KERB - 0.48, z);
        pair.add(sitter);
      }
      pair.children.forEach((m) => (m.castShadow = true));
      const at = new Group();
      at.add(pair);
      this.group.add(at);
      this.props.push({ mesh: at, offset: b - 5.5, x: edge });
    }
  }

  /**
   * The underground waste containers' inlet columns, in a row on the quay just past every
   * bridge: grey steel with a coloured band for what each takes (green for glass, blue for
   * paper, orange for plastic, grey for the rest) and a dark mouth.
   */
  private addContainers(roadHalf: number): void {
    const steel = this.material({ color: 0x6e7276, metalness: 0.5, roughness: 0.5 });
    const mouth = this.material({ color: 0x111111, roughness: 0.9 });
    const bands = [0x2f7a3a, 0x1d4f9c, 0xe07a1a, 0x5a5e62].map((hex) =>
      this.material({ color: hex, roughness: 0.6 }),
    );
    const column = new BoxGeometry(0.62, 1.15, 0.62);
    column.translate(0, 0.575, 0);
    const band = new BoxGeometry(0.64, 0.14, 0.64);
    band.translate(0, 1.0, 0);
    const slot = new BoxGeometry(0.05, 0.16, 0.36);
    slot.translate(-0.31, 0.82, 0);
    const plate = new BoxGeometry(1.2, 0.04, 1.2);
    plate.translate(0, 0.02, 0);
    this.disposables.push(column, band, slot, plate);
    for (let b = 0; b < LOOP; b += BRIDGE) {
      const row = new Group();
      bands.forEach((colour, i) => {
        const bin = new Group();
        bin.add(
          new Mesh(plate, steel),
          new Mesh(column, steel),
          new Mesh(band, colour),
          new Mesh(slot, mouth),
        );
        bin.position.z = -i * 1.3;
        row.add(bin);
      });
      row.traverse((o) => (o.castShadow = true));
      row.position.y = KERB;
      const at = new Group();
      at.add(row);
      this.group.add(at);
      this.props.push({ mesh: at, offset: b + 2 + CROSS / 2 + 12, x: -roadHalf - 2.7 });
    }
  }

  /**
   * A walking tour gathered on the quay at the far end of the first bridge: a dozen visitors
   * standing round their guide, who holds up a red umbrella, some of them turned to the canal
   * with their phones up.
   */
  private addTour(roadHalf: number): void {
    const random = seeded(757);
    const people = this.material({ vertexColors: true, roughness: 0.85 });
    const red = this.material({ color: 0xc8202a, roughness: 0.7, side: DoubleSide });
    const black = this.material({ color: 0x1b1b1f, roughness: 0.6 });
    const group = new Group();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 1.6 - Math.PI * 0.3;
      const r = 1.4 + random() * 0.9;
      const person = new Mesh(standerGeometry(random, random() < 0.4), people);
      this.disposables.push(person.geometry);
      person.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      person.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)) + (random() - 0.5) * 0.6;
      group.add(person);
    }
    const guide = new Mesh(standerGeometry(random, true), people);
    this.disposables.push(guide.geometry);
    guide.rotation.y = -Math.PI / 2;
    const shaft = new Mesh(this.unit, black);
    shaft.scale.set(0.025, 1.1, 0.025);
    shaft.position.set(0.25, 2.0, -0.2);
    const canopy = new Mesh(new ConeGeometry(0.55, 0.28, 8, 1, true), red);
    this.disposables.push(canopy.geometry);
    canopy.position.set(0.25, 2.62, -0.2);
    group.add(guide, shaft, canopy);
    group.children.forEach((m) => (m.castShadow = true));
    group.position.y = KERB;
    this.group.add(group);
    this.props.push({ mesh: group, offset: BRIDGE + 2 + CROSS / 2 + 3, x: -roadHalf - 2.9 });
  }

  /**
   * A house up the street under renovation: a scaffold of galvanised tubes standing on the
   * pavement before its front, boarded at every lift, toe boards at the edges, and a fine green
   * safety net hung over the top half, with a builder's board at the foot.
   */
  private addScaffold(roadHalf: number): void {
    const tube = this.material({ color: 0xa8acb0, metalness: 0.7, roughness: 0.35 });
    const board = this.material({ color: 0xb08a58, roughness: 0.9 });
    const net = this.material({
      color: 0x3a8a4a,
      transparent: true,
      opacity: 0.55,
      side: DoubleSide,
      roughness: 0.9,
      depthWrite: false,
    });
    const parts: BufferGeometry[] = [];
    const planks: BufferGeometry[] = [];
    const length = 9;
    const tall = 15;
    for (const x of [0.2, 1.3]) {
      for (let z = 0; z <= length; z += 1.8) {
        const post = new CylinderGeometry(0.024, 0.024, tall, 5);
        post.translate(-x, tall / 2, -z);
        parts.push(post);
      }
      for (let y = 2; y <= tall; y += 2) {
        const ledger = new CylinderGeometry(0.024, 0.024, length, 5);
        ledger.rotateX(Math.PI / 2);
        ledger.translate(-x, y, -length / 2);
        parts.push(ledger);
      }
    }
    for (let y = 2; y <= tall; y += 2) {
      const deck = new BoxGeometry(1.1, 0.05, length);
      deck.translate(-0.75, y, -length / 2);
      planks.push(deck);
      const toe = new BoxGeometry(0.03, 0.15, length);
      toe.translate(-1.32, y + 0.1, -length / 2);
      planks.push(toe);
      const rail = new CylinderGeometry(0.024, 0.024, length, 5);
      rail.rotateX(Math.PI / 2);
      rail.translate(-1.3, y + 1, -length / 2);
      parts.push(rail);
    }
    for (let z = 0; z < length; z += 1.8) {
      const brace = limb(new Vector3(-1.3, 0, -z), new Vector3(-1.3, 4, -z - 1.8), 0.024);
      parts.push(brace);
    }
    const frame = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
    const decks = mergeGeometries(planks.map((p) => p.toNonIndexed()))!;
    parts.forEach((p) => p.dispose());
    planks.forEach((p) => p.dispose());
    const sheet = new PlaneGeometry(length, tall / 2);
    sheet.rotateY(Math.PI / 2);
    sheet.translate(-1.36, tall * 0.75, -length / 2);
    this.disposables.push(frame, decks, sheet);
    const scaffold = new Group();
    scaffold.add(new Mesh(frame, tube), new Mesh(decks, board), new Mesh(sheet, net));
    scaffold.children.forEach((m) => (m.castShadow = true));
    scaffold.position.y = KERB;
    this.group.add(scaffold);
    this.props.push({ mesh: scaffold, offset: START + BEHIND + 44, x: roadHalf + PAVEMENT });
  }

  /**
   * Someone moving house across the canal: a removal lift on the far quay, a small white truck
   * with its long orange ladder raised to a third-floor window, the platform halfway up it
   * carrying a sofa, since nothing fits up a canal house's stairs.
   */
  private addMovingLift(roadHalf: number): void {
    const white = this.material({ color: 0xf2f2ee, metalness: 0.3, roughness: 0.45 });
    const orange = this.material({ color: 0xe07a1a, metalness: 0.3, roughness: 0.5 });
    const dark = this.material({ color: 0x1b1b1f, roughness: 0.6 });
    const sofa = this.material({ color: 0x5a6a7a, roughness: 0.9 });
    const lift = new Group();
    const box = (
      material: MeshStandardMaterial,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mesh = new Mesh(this.unit, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      lift.add(mesh);
      return mesh;
    };
    box(white, 2.0, 1.9, 1.8, 0, 1.25, -2.4);
    box(dark, 1.9, 0.7, 0.05, 0, 1.6, -3.31);
    box(white, 2.0, 0.5, 4.2, 0, 0.6, 0.6);
    for (const z of [-2.3, 1.6]) {
      for (const x of [-0.95, 0.95]) {
        const wheel = new Mesh(this.unit, dark);
        wheel.scale.set(0.25, 0.7, 0.7);
        wheel.position.set(x, 0.35, z);
        lift.add(wheel);
      }
    }
    // The ladder, raised from the truck's bed to the window, leaning in against the front.
    const ladder = new Group();
    for (const x of [-0.35, 0.35]) {
      const rail = new Mesh(this.unit, orange);
      rail.scale.set(0.1, 14, 0.16);
      rail.position.set(x, 7, 0);
      ladder.add(rail);
    }
    for (let y = 0.6; y < 14; y += 0.9) {
      const rung = new Mesh(this.unit, orange);
      rung.scale.set(0.7, 0.05, 0.05);
      rung.position.set(0, y, 0);
      ladder.add(rung);
    }
    const platform = new Mesh(this.unit, orange);
    platform.scale.set(1.1, 0.08, 1.4);
    platform.position.set(0, 7.5, 0.6);
    const couch = new Mesh(this.unit, sofa);
    couch.scale.set(0.95, 0.7, 1.3);
    couch.position.set(0, 7.9, 0.6);
    ladder.add(platform, couch);
    ladder.position.set(0, 0.9, 1.6);
    ladder.rotation.x = 0;
    ladder.rotation.z = -0.42;
    lift.add(ladder);
    lift.traverse((o) => (o.castShadow = true));
    lift.rotation.y = Math.PI;
    lift.position.y = KERB;
    this.group.add(lift);
    this.props.push({
      mesh: lift,
      offset: START + BEHIND + 52,
      x: -roadHalf - QUAY - CANAL - 2.6,
    });
  }

  /**
   * The corner house across the first cross street keeps a shop on its ground floor: an
   * antiques dealer's, with a striped awning let down over the windows and its name board, and
   * a couple of chairs and a mirror set out on the pavement.
   */
  private addShop(roadHalf: number): void {
    const canvas = this.material({
      map: this.track(awningTexture()),
      side: DoubleSide,
      roughness: 0.9,
    });
    const board = this.material({ map: this.track(shopBoardTexture()), roughness: 0.6 });
    const iron = this.material({ color: 0x1b1b1f, metalness: 0.5, roughness: 0.5 });
    const wood = this.material({ color: 0x6a4a2e, roughness: 0.8 });
    const gilt = this.material({ color: 0xc8a040, metalness: 0.6, roughness: 0.35 });
    const shop = new Group();
    const awning = new Mesh(this.unit, canvas);
    awning.scale.set(1.3, 0.03, 4.6);
    awning.position.set(-0.6, 3.3, -2.6);
    awning.rotation.z = 0.5;
    const valance = new Mesh(this.unit, canvas);
    valance.scale.set(0.02, 0.25, 4.6);
    valance.position.set(-1.17, 2.9, -2.6);
    for (const z of [-0.4, -4.8]) {
      const arm = new Mesh(this.unit, iron);
      arm.scale.set(1.3, 0.03, 0.03);
      arm.position.set(-0.6, 3.25, z);
      arm.rotation.z = 0.5;
      shop.add(arm);
    }
    const sign = new Mesh(this.unit, [board, board, board, board, board, board]);
    sign.scale.set(0.06, 0.45, 3.6);
    sign.position.set(-0.04, 3.9, -2.6);
    shop.add(awning, valance, sign);
    // Wares set out on the pavement: two chairs and a gilt-framed mirror leaning on the wall.
    for (const z of [-1.2, -3.8]) {
      const chair = new Group();
      const seat = new Mesh(this.unit, wood);
      seat.scale.set(0.45, 0.05, 0.45);
      seat.position.y = 0.46;
      const back = new Mesh(this.unit, wood);
      back.scale.set(0.05, 0.5, 0.45);
      back.position.set(0.2, 0.72, 0);
      chair.add(seat, back);
      for (const [x, zz] of [
        [-0.2, -0.2],
        [0.2, -0.2],
        [-0.2, 0.2],
        [0.2, 0.2],
      ] as const) {
        const leg = new Mesh(this.unit, wood);
        leg.scale.set(0.04, 0.46, 0.04);
        leg.position.set(x, 0.23, zz);
        chair.add(leg);
      }
      chair.position.set(-0.7, 0, z);
      shop.add(chair);
    }
    const mirror = new Mesh(this.unit, gilt);
    mirror.scale.set(0.06, 1.3, 0.8);
    mirror.position.set(-0.12, 0.7, -2.5);
    mirror.rotation.z = -0.1;
    shop.add(mirror);
    shop.traverse((o) => (o.castShadow = true));
    shop.position.y = KERB;
    this.group.add(shop);
    this.props.push({
      mesh: shop,
      offset: BRIDGE + 2 + CROSS / 2 + 0.2,
      x: roadHalf + PAVEMENT,
    });
  }

  /**
   * The street's utility cabinets: grey-green steel boxes on the pavement's kerb and the quay,
   * plastered with stickers and the odd tag, every 60 m or so.
   */
  private addCabinets(roadHalf: number): void {
    const random = seeded(787);
    const skin = this.material({
      map: this.track(cabinetTexture()),
      roughness: 0.6,
      metalness: 0.2,
    });
    const plain = this.material({ color: 0x6e7a72, roughness: 0.6, metalness: 0.2 });
    for (
      let offset = START + BEHIND + 30;
      offset < START + BEHIND + 30 + LOOP;
      offset += 55 + random() * 20
    ) {
      const at = offset % LOOP;
      if (bridgeGap(at) !== null) continue;
      const nearSide = random() < 0.6;
      const box = new Mesh(this.unit, [skin, skin, plain, plain, skin, skin]);
      box.scale.set(0.45, 1.25, 0.9);
      box.position.y = KERB + 0.625;
      box.castShadow = true;
      const spot = new Group();
      spot.add(box);
      this.group.add(spot);
      this.props.push({ mesh: spot, offset: at, x: nearSide ? roadHalf + 0.75 : -roadHalf - 2.4 });
    }
  }

  /**
   * A family out on the near pavement up ahead: a parent pushing a pram, and a child scooting
   * ahead of them on a kick scooter, all keeping to the open strip outside the stoops.
   */
  private addFamily(roadHalf: number): void {
    const random = seeded(809);
    const people = this.material({ vertexColors: true, roughness: 0.85 });
    const navy = this.material({ color: 0x24304a, roughness: 0.7 });
    const black = this.material({ color: 0x1b1b1f, roughness: 0.6, metalness: 0.3 });
    const red = this.material({ color: 0xd8282e, roughness: 0.5 });
    const family = new Group();
    const parent = new Mesh(standerGeometry(random, false), people);
    this.disposables.push(parent.geometry);
    family.add(parent);
    // The pram: a deep carrycot under its hood on a four-wheeled frame with a handle.
    const cot = new Mesh(this.unit, navy);
    cot.scale.set(0.45, 0.32, 0.8);
    cot.position.set(0, 0.72, -1.05);
    const hood = new Mesh(new SphereGeometry(0.28, 10, 6, 0, Math.PI, 0, Math.PI / 2), navy);
    this.disposables.push(hood.geometry);
    hood.rotation.y = Math.PI / 2;
    hood.scale.set(1, 1, 0.8);
    hood.position.set(0, 0.88, -0.75);
    const handle = new Mesh(this.unit, black);
    handle.scale.set(0.5, 0.03, 0.03);
    handle.position.set(0, 1.0, -0.42);
    family.add(cot, hood, handle);
    for (const z of [-1.35, -0.75]) {
      for (const x of [-0.2, 0.2]) {
        const wheel = new Mesh(new TorusGeometry(0.11, 0.025, 4, 12), black);
        this.disposables.push(wheel.geometry);
        wheel.rotation.y = Math.PI / 2;
        wheel.position.set(x, 0.12, z);
        family.add(wheel);
      }
    }
    // The child on a kick scooter a few steps ahead.
    const child = new Mesh(standerGeometry(random, false), people);
    this.disposables.push(child.geometry);
    child.scale.setScalar(0.62);
    child.position.set(0.1, 0.06, -3.2);
    const deck = new Mesh(this.unit, red);
    deck.scale.set(0.12, 0.04, 0.5);
    deck.position.set(0.1, 0.06, -3.25);
    const stem = new Mesh(this.unit, red);
    stem.scale.set(0.03, 0.7, 0.03);
    stem.position.set(0.1, 0.4, -3.5);
    family.add(child, deck, stem);
    family.children.forEach((m) => (m.castShadow = true));
    family.rotation.y = Math.PI;
    family.position.y = KERB;
    this.group.add(family);
    this.props.push({ mesh: family, offset: START + BEHIND + 21, x: roadHalf + 0.75 });
  }

  /**
   * A flower stall on the quay before the first bridge: a green-painted cart under a striped
   * awning, rows of zinc buckets packed with tulips in red, yellow, pink, orange and white, and
   * the seller standing beside it.
   */
  private addFlowerStall(roadHalf: number): void {
    const random = seeded(811);
    const green = this.material({ color: 0x1f4a32, roughness: 0.7 });
    const zinc = this.material({ color: 0x9a9ea2, metalness: 0.6, roughness: 0.4 });
    const stems = this.material({ color: 0x4f8a34, roughness: 0.9 });
    const canvas = this.material({
      map: this.track(awningTexture()),
      side: DoubleSide,
      roughness: 0.9,
    });
    const blooms = [0xd8202a, 0xf2c418, 0xe86a9a, 0xf07a1a, 0xf6f2ee, 0x8a2a8a].map((hex) =>
      this.material({ color: hex, roughness: 0.6 }),
    );
    const bucket = new CylinderGeometry(0.16, 0.12, 0.3, 10);
    const bunch = new IcosahedronGeometry(0.15, 1);
    bunch.scale(1, 0.7, 1);
    const stalk = new CylinderGeometry(0.11, 0.08, 0.3, 8);
    this.disposables.push(bucket, bunch, stalk);
    const stall = new Group();
    const cart = new Mesh(this.unit, green);
    cart.scale.set(1.1, 0.8, 2.6);
    cart.position.y = 0.4;
    stall.add(cart);
    for (const z of [-1.2, 1.2]) {
      const pole = new Mesh(this.unit, green);
      pole.scale.set(0.05, 1.6, 0.05);
      pole.position.set(0.5, 1.6, z);
      stall.add(pole);
    }
    const awning = new Mesh(this.unit, canvas);
    awning.scale.set(1.5, 0.03, 2.8);
    awning.position.set(0.1, 2.35, 0);
    awning.rotation.z = -0.25;
    stall.add(awning);
    // Three tiers of buckets stepping down towards the street.
    for (let tier = 0; tier < 3; tier++) {
      for (let z = -1.1; z <= 1.1; z += 0.36) {
        const x = -0.35 + tier * 0.3;
        const y = 0.95 + tier * 0.12;
        const pail = new Mesh(bucket, zinc);
        pail.position.set(x - 0.6, y - 0.2 - tier * 0.25, z);
        const green1 = new Mesh(stalk, stems);
        green1.position.set(x - 0.6, y - 0.02 - tier * 0.25, z);
        const flowers = new Mesh(bunch, blooms[Math.floor(random() * blooms.length)]!);
        flowers.position.set(x - 0.6, y + 0.18 - tier * 0.25, z);
        stall.add(pail, green1, flowers);
      }
    }
    const seller = new Mesh(
      standerGeometry(random, false),
      this.material({ vertexColors: true, roughness: 0.85 }),
    );
    this.disposables.push(seller.geometry);
    seller.rotation.y = -Math.PI / 2;
    seller.position.set(0.2, 0, 1.8);
    stall.add(seller);
    stall.traverse((o) => (o.castShadow = true));
    stall.position.y = KERB;
    this.group.add(stall);
    this.props.push({ mesh: stall, offset: BRIDGE - 6.2, x: -roadHalf - QUAY + 2.6 });
  }

  /**
   * Neighbours stopped to talk: pairs and threes standing turned to one another on the
   * pavement and the quay, one holding a bike by its bars, and a parking meter on the quay with
   * someone at it.
   */
  private addChatter(roadHalf: number): void {
    const random = seeded(839);
    const people = this.material({ vertexColors: true, roughness: 0.85 });
    const grey = this.material({ color: 0x5a6066, metalness: 0.4, roughness: 0.5 });
    const blue = this.material({ color: 0x1d4f9c, roughness: 0.5 });
    const groups: [number, number, number][] = [
      [START + BEHIND + 33, roadHalf + 0.9, 2],
      [START + BEHIND + 62, -roadHalf - 3.0, 3],
      [200, roadHalf + 0.9, 2],
      [290, -roadHalf - 3.1, 2],
    ];
    for (const [offset, x, count] of groups) {
      const knot = new Group();
      for (let p = 0; p < count; p++) {
        const a = (p / count) * Math.PI * 2;
        const person = new Mesh(standerGeometry(random, false), people);
        this.disposables.push(person.geometry);
        person.position.set(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45);
        person.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)) + Math.PI;
        knot.add(person);
      }
      knot.children.forEach((m) => (m.castShadow = true));
      knot.position.y = KERB;
      this.group.add(knot);
      this.props.push({ mesh: knot, offset, x });
    }
    // The parking meter: a grey column with its blue P panel, and someone paying at it.
    const meter = new Group();
    const column = new Mesh(this.unit, grey);
    column.scale.set(0.35, 1.5, 0.3);
    column.position.y = 0.75;
    const panel = new Mesh(this.unit, blue);
    panel.scale.set(0.02, 0.3, 0.26);
    panel.position.set(0.18, 1.3, 0);
    const payer = new Mesh(standerGeometry(random, true), people);
    this.disposables.push(payer.geometry);
    payer.rotation.y = -Math.PI / 2;
    payer.position.set(0.7, 0, 0);
    meter.add(column, panel, payer);
    meter.children.forEach((m) => (m.castShadow = true));
    meter.position.y = KERB;
    this.group.add(meter);
    this.props.push({ mesh: meter, offset: BRIDGE + 2 + CROSS / 2 + 8.5, x: -roadHalf - 2.2 });
  }

  /**
   * Across the canal, a café's terrace spills over the far quay by the water: tables under
   * cream parasols, people sitting out in the sun facing the canal, in view over the water.
   */
  private addFarTerrace(roadHalf: number): void {
    const random = seeded(887);
    const cream = this.material({ color: 0xefe6cc, roughness: 0.8, side: DoubleSide });
    const wood = this.material({ color: 0x6a4a2e, roughness: 0.8 });
    const people = this.material({ vertexColors: true, roughness: 0.85 });
    const canopy = new ConeGeometry(1.3, 0.5, 8, 1, true);
    const pole = new CylinderGeometry(0.03, 0.03, 2.4, 6);
    pole.translate(0, 1.2, 0);
    const table = new CylinderGeometry(0.4, 0.4, 0.75, 10);
    table.translate(0, 0.375, 0);
    this.disposables.push(canopy, pole, table);
    const terrace = new Group();
    for (let t = 0; t < 4; t++) {
      const spot = new Group();
      const shade = new Mesh(canopy, cream);
      shade.position.y = 2.45;
      spot.add(shade, new Mesh(pole, wood), new Mesh(table, wood));
      for (const a of [0, Math.PI]) {
        if (random() < 0.25) continue;
        const sitter = new Mesh(sitterGeometry(random), people);
        this.disposables.push(sitter.geometry);
        sitter.position.set(Math.sin(a) * 0.7, -0.02, Math.cos(a) * 0.7);
        sitter.rotation.y = a + Math.PI / 2;
        spot.add(sitter);
      }
      spot.position.z = -t * 2.8;
      terrace.add(spot);
    }
    terrace.traverse((o) => (o.castShadow = true));
    terrace.position.y = KERB;
    this.group.add(terrace);
    this.props.push({
      mesh: terrace,
      offset: START + BEHIND + 44,
      x: -roadHalf - QUAY - CANAL - 1.8,
    });
  }

  /** Bicycles crowding the quay's edge, leaning every which way, in tiles along the canal. */
  private addParkedBikes(roadHalf: number): void {
    const frames = this.material({ vertexColors: true, metalness: 0.35, roughness: 0.55 });
    const steel = this.material({ color: 0x8a8e92, metalness: 0.7, roughness: 0.35 });
    // Mostly black, with the odd blue, oxblood, mint, cream or green bike, and a crate up front
    // on a few, in red, black or green plastic or pale wood.
    const paints = [
      '#16181b',
      '#16181b',
      '#16181b',
      '#2a3a5c',
      '#6a1a1a',
      '#8fc0b0',
      '#e8dcc0',
      '#2f4a34',
    ];
    const crates = ['#b02a2a', '#1b1b1f', '#3a6a3a', '#c8a878'];
    const colour = new Color();
    const paint = (geometry: BufferGeometry, hex: string) => {
      colour.set(hex);
      const count = geometry.getAttribute('position').count;
      const colours = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) colour.toArray(colours, i * 3);
      geometry.setAttribute('color', new BufferAttribute(colours, 3));
      return geometry;
    };
    const tiles = [0, 1, 2, 3].map((k) => {
      const random = seeded(431 + k);
      const parts: BufferGeometry[] = [];
      const hoops: BufferGeometry[] = [];
      for (let z = 0; z < 30; z += 0.7 + random() * 0.6) {
        if (random() < 0.25) continue;
        const bike = paint(bikeGeometry(), paints[Math.floor(random() * paints.length)]!);
        if (random() < 0.3) {
          const crate = new BoxGeometry(0.4, 0.28, 0.32).toNonIndexed();
          crate.translate(0, 0.95, -0.62);
          parts.push(paint(crate, crates[Math.floor(random() * crates.length)]!));
          const both = mergeGeometries([bike, parts.pop()!])!;
          bike.dispose();
          both.rotateY(Math.PI / 2 + (random() - 0.5) * 0.4);
          both.rotateZ((random() - 0.5) * 0.15);
          both.translate(0, 0, -z);
          parts.push(both);
          continue;
        }
        bike.rotateY(Math.PI / 2 + (random() - 0.5) * 0.4);
        bike.rotateZ((random() - 0.5) * 0.15);
        bike.translate(0, 0, -z);
        parts.push(bike);
      }
      // Steel hoops (nietjes) to lock them to, every 1.6 m.
      for (let z = 0.4; z < 30; z += 1.6) {
        const hoop = new TorusGeometry(0.4, 0.03, 5, 12, Math.PI);
        hoop.rotateY(Math.PI / 2);
        hoop.translate(0.35, 0.35, -z);
        hoops.push(hoop);
        for (const dz of [-0.4, 0.4]) {
          const leg = new CylinderGeometry(0.03, 0.03, 0.35, 5);
          leg.translate(0.35, 0.175, -z + dz);
          hoops.push(leg);
        }
      }
      const merged = mergeGeometries(parts)!;
      const rack = mergeGeometries(hoops.map((h) => h.toNonIndexed()))!;
      parts.forEach((p) => p.dispose());
      hoops.forEach((p) => p.dispose());
      this.disposables.push(merged, rack);
      return { bikes: merged, rack };
    });
    for (let offset = 0, k = 0; offset < LOOP; offset += 30, k++) {
      if (offset % BRIDGE < 8) continue;
      const rack = new Group();
      const tile = tiles[k % 4]!;
      rack.add(new Mesh(tile.bikes, frames), new Mesh(tile.rack, steel));
      rack.children.forEach((m) => {
        m.position.y = KERB;
        m.castShadow = true;
      });
      this.group.add(rack);
      this.props.push({ mesh: rack, offset, x: -roadHalf - QUAY + 0.9 });
    }
  }

  /**
   * Humpback bridges across the canal: a brick arch with an iron railing either side between
   * stone piers.
   */
  private addBridges(roadHalf: number): void {
    const brick = this.material({ map: this.repeat(brickTexture(), 2, 2), roughness: 0.95 });
    const stone = this.material({ color: 0xd9d2c4, roughness: 0.85 });
    const iron = this.material({ color: 0x1c2a22, metalness: 0.5, roughness: 0.45 });
    const arch = bridgeGeometry();
    const crossing = seeded(859);
    const crossBike = bikeGeometry();
    this.disposables.push(crossBike);
    const people = this.material({ vertexColors: true, roughness: 0.85 });
    const box = this.material({ color: 0x2a2a24, roughness: 0.8 });
    const bloom = this.material({ color: 0xd8283e, roughness: 0.8 });
    const glow = this.material({ color: 0xfff6e0, emissive: 0xfff0d0, emissiveIntensity: 0.4 });
    const geraniums = geraniumGeometry();
    const bulbs = archBulbs();
    const voussoirs = archRing();
    this.disposables.push(voussoirs);
    this.disposables.push(geraniums, bulbs);
    const railing = bridgeRailing();
    this.disposables.push(arch, railing);
    for (let offset = 0; offset < LOOP; offset += BRIDGE) {
      const bridge = new Group();
      const deck = new Mesh(arch, brick);
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridge.add(deck);
      for (const z of [-3.4, 3.4]) {
        const rail = new Mesh(railing, iron);
        rail.position.z = z;
        rail.castShadow = true;
        bridge.add(rail);
        // Stone piers at each end of the railing.
        for (const u of [0.3, CANAL - 0.3]) {
          const pier = new Mesh(this.unit, stone);
          pier.scale.set(0.5, 1.2, 0.5);
          pier.position.set(u, KERB + 0.6 + 1.4 * Math.sin((Math.PI * u) / CANAL), z);
          bridge.add(pier);
        }
        // Planters of trailing geraniums hung along the railing's outer side, as the canal
        // bridges carry them from spring to autumn.
        for (let u = 3; u < CANAL - 2; u += 3.6) {
          const top = KERB + 1.4 * Math.sin((Math.PI * u) / CANAL) + 0.8;
          const planter = new Mesh(this.unit, box);
          planter.scale.set(1.2, 0.3, 0.32);
          planter.position.set(u, top, z * 1.06);
          planter.rotation.z = Math.atan(
            ((1.4 * Math.PI) / CANAL) * Math.cos((Math.PI * u) / CANAL),
          );
          const flowers = new Mesh(geraniums, bloom);
          flowers.position.set(u, top + 0.15, z * 1.06);
          flowers.rotation.set(0, Math.PI / 2, planter.rotation.z);
          flowers.scale.set(1, 1.2, 1.2);
          bridge.add(planter, flowers);
        }
      }
      // A row of white bulbs along the arch's face, lit at dusk.
      bridge.add(new Mesh(bulbs, glow));
      // The arch's ring of pale stone voussoirs with its keystone, on both faces, and a stone
      // coping along the deck's edges.
      bridge.add(new Mesh(voussoirs, stone));
      // People crossing the bridge: a cyclist or two and someone on foot, going either way
      // over the hump.
      for (let c = 0; c < 3; c++) {
        const cycling = c < 2;
        const crosser = new Group();
        if (cycling) {
          crosser.add(new Mesh(crossBike, iron));
          const rider = new Mesh(sitterGeometry(crossing), people);
          this.disposables.push(rider.geometry);
          rider.position.set(0, 0.42, 0.22);
          crosser.add(rider);
        } else {
          const walker = new Mesh(standerGeometry(crossing, crossing() < 0.5), people);
          this.disposables.push(walker.geometry);
          crosser.add(walker);
        }
        crosser.children.forEach((m) => (m.castShadow = true));
        const lane = c === 1 ? 1.2 : -1.4;
        crosser.position.z = lane;
        bridge.add(crosser);
        this.crossers.push({
          mesh: crosser,
          phase: crossing() * CANAL,
          speed: (lane > 0 ? 1 : -1) * (cycling ? 3.2 : 1.2),
        });
      }
      bridge.scale.x = -1;
      this.group.add(bridge);
      this.props.push({ mesh: bridge, offset: offset + 2, x: -roadHalf - QUAY });
    }
  }

  /** Houseboats moored along both walls, and a glass-roofed canal boat gliding along. */
  private addHouseboats(roadHalf: number): void {
    const random = seeded(443);
    const hulls = [0x1f3a2c, 0x1d1f24, 0x3a1f1a, 0x24304a].map((hex) =>
      this.material({ color: hex, roughness: 0.6 }),
    );
    const cabinMap = this.track(cabinTexture());
    const cabins = [0xf2efe6, 0x4a6a4a, 0x9a6a44, 0x5a7088, 0x2a2e33, 0xd8c8a0].map((hex) =>
      this.material({ map: cabinMap, color: hex, roughness: 0.7 }),
    );
    const roofs = this.material({ color: 0x3a3a3a, roughness: 0.8 });
    const concrete = this.material({ color: 0x8e8b84, roughness: 0.95 });
    const plants = this.material({ color: 0x4f7f34, roughness: 1 });
    const rail = this.material({ color: 0x1b1b1f, metalness: 0.5, roughness: 0.5 });
    const glass = this.material({
      color: 0x9ab8c8,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
    });
    const bush = new IcosahedronGeometry(0.35, 1);
    this.disposables.push(bush);
    const deck = this.material({ color: 0x7a6a58, roughness: 0.9 });
    const solar = this.material({ color: 0x1a2440, metalness: 0.5, roughness: 0.25 });
    const sunshade = this.material({ color: 0xe8dcc0, roughness: 0.8, side: DoubleSide });
    const parasol = new ConeGeometry(1.1, 0.45, 8, 1, true);
    this.disposables.push(parasol);
    const letterbox = this.material({ color: 0xd8282e, roughness: 0.5 });
    const edge = -roadHalf - QUAY;
    const box = (
      material: MeshStandardMaterial,
      w: number,
      h: number,
      l: number,
      y: number,
      z = 0,
    ) => {
      const mesh = new Mesh(this.unit, material);
      mesh.scale.set(w, h, l);
      mesh.position.set(0, y + h / 2, z);
      return mesh;
    };
    for (const [x, side] of [
      [edge - 2.6, 1],
      [edge - CANAL + 2.6, -1],
    ] as const) {
      for (let offset = 10; offset < LOOP; offset += 30) {
        if ((offset + 10) % BRIDGE < 22) continue;
        const boat = new Group();
        const length = 16 + random() * 6;
        const cabin = cabins[Math.floor(random() * cabins.length)]!;
        if (random() < 0.5) {
          // An ark: a box house on a concrete pontoon, with a roof terrace behind a rail and a
          // deck at one end.
          boat.add(box(concrete, 4.6, 1.1, length, -WATER - 0.5));
          boat.add(box(cabin, 4.2, 2.5, length - 3.5, -WATER + 0.6, -1.4));
          boat.add(box(roofs, 4.4, 0.15, length - 3.3, -WATER + 3.1, -1.4));
          for (const rx of [-2.1, 2.1]) {
            const top = box(rail, 0.04, 0.04, length - 3.5, -WATER + 3.95, -1.4);
            top.position.x = rx;
            boat.add(top);
          }
          for (let z = -length / 2 + 2; z < length / 2 - 3; z += 1.4 + random() * 2) {
            const p = new Mesh(bush, plants);
            p.position.set((random() - 0.5) * 3, -WATER + 3.5, z);
            boat.add(p);
          }
          // Chairs and a table on the end deck.
          for (const cx of [-1, 0.9]) {
            const chair = box(rail, 0.5, 0.9, 0.5, -WATER + 0.6, length / 2 - 1.2);
            chair.position.x = cx;
            boat.add(chair);
          }
          boat.add(box(cabin, 0.8, 0.75, 0.8, -WATER + 0.6, length / 2 - 1.1));
          // Solar panels tilted to the sun on the roof's back half, and a parasol on the deck.
          for (let p = 0; p < 3; p++) {
            const panel = box(solar, 1.0, 0.04, 1.6, -WATER + 3.35, -length / 2 + 2.2 + p * 1.8);
            panel.rotation.x = -0.35;
            panel.position.x = 0.9;
          }
          const shade = new Mesh(parasol, sunshade);
          shade.position.set(0, -WATER + 2.4, length / 2 - 1.1);
          boat.add(shade);
        } else {
          // A converted barge: a black steel hull with a pointed bow, a long cabin with a
          // wheelhouse aft and a mast at the bow.
          const hull = new Mesh(bargeHull(length), hulls[Math.floor(random() * hulls.length)]!);
          hull.position.y = -WATER - 0.6;
          boat.add(hull);
          boat.add(box(concrete, 4.25, 0.12, length - 3, -WATER + 0.75));
          boat.add(box(cabin, 3.4, 1.7, length - 7, -WATER + 0.85, 0.5));
          boat.add(box(roofs, 3.6, 0.12, length - 6.8, -WATER + 2.55, 0.5));
          boat.add(box(cabin, 2.4, 1.6, 2.2, -WATER + 2.6, length / 2 - 3));
          boat.add(box(glass, 2.5, 0.7, 2.3, -WATER + 3.4, length / 2 - 3));
          boat.add(box(roofs, 2.7, 0.1, 2.5, -WATER + 4.2, length / 2 - 3));
          const mast = box(rail, 0.12, 4, 0.12, -WATER + 0.8, -length / 2 + 2.5);
          boat.add(mast);
          for (let z = -length / 2 + 4; z < length / 2 - 5; z += 2 + random() * 2.5) {
            const p = new Mesh(bush, plants);
            p.position.set(side * 1.2, -WATER + 2.8, z);
            p.scale.setScalar(0.7);
            boat.add(p);
          }
        }
        boat.rotation.y = random() < 0.5 ? 0 : Math.PI;
        boat.children.forEach((m) => (m.castShadow = true));
        this.group.add(boat);
        this.props.push({ mesh: boat, offset, x });
        // Its landing on the quay: a gangway down to the deck, a little gate in a low fence,
        // the letterbox on its post and a pot or two of plants.
        const landing = new Group();
        const edgeX = side * 2.6;
        const plank = new Mesh(this.unit, deck);
        plank.scale.set(0.7, 0.06, 2.6);
        plank.position.set(edgeX - side * 0.45, (KERB - WATER + 0.9) / 2, 1.2);
        plank.rotation.x = Math.atan2(KERB + WATER - 0.9, 2.6);
        landing.add(plank);
        const mail = new Mesh(this.unit, letterbox);
        mail.scale.set(0.3, 0.38, 0.22);
        mail.position.set(edgeX + side * 0.35, KERB + 1.0, 0);
        const post = new Mesh(this.unit, rail);
        post.scale.set(0.06, 0.85, 0.06);
        post.position.set(edgeX + side * 0.35, KERB + 0.42, 0);
        landing.add(mail, post);
        for (const dz of [-0.6, 2.8]) {
          const fence = new Mesh(this.unit, rail);
          fence.scale.set(0.04, 0.7, 1.2);
          fence.position.set(edgeX + side * 0.15, KERB + 0.35, dz);
          landing.add(fence);
        }
        const pot = new Mesh(bush, plants);
        pot.scale.setScalar(0.8);
        pot.position.set(edgeX + side * 0.5, KERB + 0.3, 1.2);
        landing.add(pot);
        landing.children.forEach((m) => (m.castShadow = true));
        this.group.add(landing);
        this.props.push({ mesh: landing, offset, x });
      }
    }
    // Glass-roofed canal cruisers gliding along mid-canal, one coming towards the rider and one
    // going the same way, each keeping to its own side of the water.
    for (const [lane, offset, speed] of [
      [-CANAL / 2 + 2.6, 150, -2.4],
      [-CANAL / 2 - 2.6, 262, 1.6],
    ] as const) {
      const tour = this.tourBoat(glass, seeded(613 + offset));
      tour.position.x = edge + lane;
      tour.rotation.y = speed < 0 ? Math.PI : 0;
      tour.add(this.wake(10, -WATER + 0.03, 1.4));
      this.group.add(tour);
      this.boats.push({ mesh: tour, offset, speed });
    }
    // Open sloepen out for the afternoon, friends sitting round the gunwales with drinks, one
    // at the tiller: two under way and three moored against the far wall's houseboats.
    for (const [x, offset, speed] of [
      [edge - CANAL / 2 - 0.6, 175, -1.4],
      [edge - CANAL / 2 + 1.2, 228, 1.1],
      [edge - CANAL + 5.6, 96, 0],
      [edge - CANAL + 5.6, 188, 0],
      [edge - 5.6, 140, 0],
    ] as const) {
      const sloep = this.sloep(seeded(719 + offset));
      sloep.position.x = x;
      sloep.rotation.y = speed < 0 ? Math.PI : 0;
      if (speed !== 0) sloep.add(this.wake(3.25, 0.03, 0.8));
      this.group.add(sloep);
      this.boats.push({ mesh: sloep, offset, speed, float: -WATER });
    }
    // Visitors pedalling canal bikes, the bright twin-hulled pedalos hired by the hour, and an
    // old varnished saloon boat with its white canopy rolled back.
    const pedalo = this.pedalo();
    pedalo.position.x = edge - 6.5;
    this.group.add(pedalo);
    this.boats.push({ mesh: pedalo, offset: 158, speed: 0.6, float: -WATER });
    const second = this.pedalo();
    second.position.x = edge - CANAL + 7;
    second.rotation.y = Math.PI;
    this.group.add(second);
    this.boats.push({ mesh: second, offset: 248, speed: -0.5, float: -WATER });
    const saloon = this.saloonBoat();
    saloon.position.x = edge - CANAL / 2 + 3.5;
    saloon.rotation.y = Math.PI;
    saloon.add(this.wake(6, 0.03, 0.9));
    this.group.add(saloon);
    this.boats.push({ mesh: saloon, offset: 320, speed: -1.8, float: -WATER });
  }

  /**
   * A boat's wake: two arms of white foam spreading back from its stern at `from` metres along
   * +z, at height `y`, fading as they widen, and a churned patch behind the stern; `size` scales
   * it to the boat.
   */
  private wake(from: number, y: number, size: number): Group {
    this.foam ??= this.material({
      map: this.track(foamTexture()),
      transparent: true,
      depthWrite: false,
      roughness: 0.6,
    });
    const wake = new Group();
    for (const side of [-1, 1]) {
      const arm = new Mesh(this.unit, this.foam);
      arm.scale.set(0.9 * size, 0.01, 12 * size);
      arm.position.set(side * 3 * size, y, from + 6 * size);
      arm.rotation.y = side * 0.42;
      wake.add(arm);
    }
    const churn = new Mesh(this.unit, this.foam);
    churn.scale.set(2.2 * size, 0.01, 5 * size);
    churn.position.set(0, y, from + 2.5 * size);
    wake.add(churn);
    return wake;
  }

  /** A canal bike: two yellow floats under a white seat bench for two, a paddle wheel aft. */
  private pedalo(): Group {
    const boat = new Group();
    const yellow = this.material({ color: 0xf2c418, roughness: 0.45 });
    const white = this.material({ color: 0xf2f2ee, roughness: 0.5 });
    for (const x of [-0.7, 0.7]) {
      const float = new Mesh(new CapsuleGeometry(0.3, 2.6, 4, 10), yellow);
      this.disposables.push(float.geometry);
      float.rotation.x = Math.PI / 2;
      float.position.set(x, 0.05, 0);
      boat.add(float);
    }
    const deck = new Mesh(this.unit, white);
    deck.scale.set(1.7, 0.1, 2.0);
    deck.position.y = 0.35;
    const bench = new Mesh(this.unit, white);
    bench.scale.set(1.4, 0.4, 0.5);
    bench.position.set(0, 0.6, 0.3);
    boat.add(deck, bench);
    const riders = this.material({ vertexColors: true, roughness: 0.85 });
    const random = seeded(853);
    for (const x of [-0.35, 0.35]) {
      const rider = new Mesh(sitterGeometry(random), riders);
      this.disposables.push(rider.geometry);
      rider.position.set(x, 0.38, 0.25);
      boat.add(rider);
    }
    boat.children.forEach((m) => (m.castShadow = true));
    return boat;
  }

  /**
   * An old saloon boat, 12 m with its bow towards -z: a varnished mahogany hull with a white
   * strake, its white canopy rolled back on its hoops, passengers on the benches and the
   * skipper at the wheel aft.
   */
  private saloonBoat(): Group {
    const boat = new Group();
    const mahogany = this.material({ color: 0x6a3418, roughness: 0.3, metalness: 0.1 });
    const white = this.material({ color: 0xf2f2ee, roughness: 0.6 });
    const brass = this.material({ color: 0xc8a040, metalness: 0.6, roughness: 0.35 });
    const hull = new Mesh(bargeHull(12), mahogany);
    hull.scale.set(0.62, 0.6, 1);
    hull.position.y = -0.4;
    const strake = new Mesh(this.unit, white);
    strake.scale.set(2.7, 0.08, 9);
    strake.position.set(0, 0.42, 0.8);
    boat.add(hull, strake);
    for (let z = -2; z <= 4; z += 1.5) {
      const hoop = new Mesh(new TorusGeometry(1.15, 0.03, 4, 16, Math.PI), brass);
      this.disposables.push(hoop.geometry);
      hoop.position.set(0, 0.5, z);
      boat.add(hoop);
    }
    const canopy = new Mesh(this.unit, white);
    canopy.scale.set(2.3, 0.35, 1.2);
    canopy.position.set(0, 1.5, 4.6);
    boat.add(canopy);
    const people = this.material({ vertexColors: true, roughness: 0.85 });
    const random = seeded(857);
    for (let z = -2.5; z < 4; z += 1.1) {
      for (const x of [-0.8, 0.8]) {
        if (random() < 0.3) continue;
        const sitter = new Mesh(sitterGeometry(random), people);
        this.disposables.push(sitter.geometry);
        sitter.position.set(x, -0.05, z);
        sitter.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
        boat.add(sitter);
      }
    }
    const skipper = new Mesh(standerGeometry(random, false), people);
    this.disposables.push(skipper.geometry);
    skipper.position.set(0, 0.1, 5.2);
    boat.add(skipper);
    boat.children.forEach((m) => (m.castShadow = true));
    return boat;
  }

  /**
   * A sloep, 6.5 m long with its bow towards -z: a varnished or white open hull, cushioned
   * benches round the gunwales, four to six people sitting on them with a drink in hand, one at
   * the outboard's tiller, and a small flag at the stern.
   */
  private sloep(random: () => number): Group {
    const boat = new Group();
    const hullColour = random() < 0.5 ? 0x8a5a2e : 0xf2f2ee;
    const hull = new Mesh(bargeHull(6.5), this.material({ color: hullColour, roughness: 0.4 }));
    hull.scale.set(0.5, 0.55, 1);
    hull.position.y = -0.35;
    const floor = new Mesh(this.unit, this.material({ color: 0x6a4a2e, roughness: 0.8 }));
    floor.scale.set(1.8, 0.05, 5.2);
    floor.position.set(0, 0.35, 0.4);
    const cushion = this.material({
      color: [0x2a3a5c, 0xe8dcc0, 0xb8242a][Math.floor(random() * 3)]!,
      roughness: 0.9,
    });
    boat.add(hull, floor);
    for (const x of [-0.75, 0.75]) {
      const bench = new Mesh(this.unit, cushion);
      bench.scale.set(0.4, 0.12, 4.2);
      bench.position.set(x, 0.45, 0.6);
      boat.add(bench);
    }
    const people = 4 + Math.floor(random() * 3);
    const sitters = this.material({ vertexColors: true, roughness: 0.85 });
    for (let p = 0; p < people; p++) {
      const side = p % 2 ? 1 : -1;
      const person = new Mesh(sitterGeometry(random), sitters);
      this.disposables.push(person.geometry);
      person.position.set(side * 0.75, -0.02, -1 + Math.floor(p / 2) * 1.2);
      person.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      boat.add(person);
    }
    const skipper = new Mesh(sitterGeometry(random), sitters);
    this.disposables.push(skipper.geometry);
    skipper.position.set(0, -0.02, 2.9);
    boat.add(skipper);
    const motor = new Mesh(this.unit, this.material({ color: 0x1b1b1f, roughness: 0.5 }));
    motor.scale.set(0.3, 0.6, 0.35);
    motor.position.set(0, 0.55, 3.35);
    const flag = new Mesh(this.unit, this.material({ color: 0xd2191e, roughness: 0.9 }));
    flag.scale.set(0.02, 0.3, 0.45);
    flag.position.set(0.5, 1.3, 3.4);
    boat.add(motor, flag);
    boat.children.forEach((m) => (m.castShadow = true));
    return boat;
  }

  /**
   * A rondvaartboot, 20 m long with its bow towards -z: a low dark-blue steel hull with a white
   * rubbing strake and a rounded bow, a glass-sided saloon under a curved glass roof with rows
   * of passengers seated inside, and the skipper standing at the open stern.
   */
  private tourBoat(glass: MeshStandardMaterial, random: () => number): Group {
    const boat = new Group();
    const length = 20;
    const blue = this.material({ color: 0x1c2a4a, metalness: 0.3, roughness: 0.5 });
    const white = this.material({ color: 0xf2f2ee, roughness: 0.6 });
    const hull = new Mesh(bargeHull(length), blue);
    hull.scale.set(1, 0.75, 1);
    hull.position.y = -WATER - 0.5;
    const strake = new Mesh(this.unit, white);
    strake.scale.set(4.3, 0.12, length - 3);
    strake.position.set(0, -WATER + 0.5, 1.2);
    const sides = new Mesh(this.unit, glass);
    sides.scale.set(3.9, 0.9, length - 6);
    sides.position.set(0, -WATER + 1.0, 0.6);
    const roof = new Mesh(
      new CylinderGeometry(1.95, 1.95, length - 6, 16, 1, true, -Math.PI / 2, Math.PI),
      glass,
    );
    roof.geometry.rotateX(Math.PI / 2);
    roof.scale.set(1, 0.35, 1);
    roof.position.set(0, -WATER + 1.45, 0.6);
    this.disposables.push(roof.geometry);
    boat.add(hull, strake, sides, roof);
    // Passengers in rows of four, seen through the glass.
    const seat = new CapsuleGeometry(0.16, 0.3, 3, 6);
    const head = new SphereGeometry(0.11, 8, 6);
    this.disposables.push(seat, head);
    const skin = [0xf0c8a0, 0xc48a5f, 0x8d5a3b, 0xf5d3b5].map((hex) =>
      this.material({ color: hex, roughness: 0.7 }),
    );
    const tops = COMMUTER_WEAR.tops.map((hex) => this.material({ color: hex, roughness: 0.85 }));
    for (let z = -length / 2 + 4.5; z < length / 2 - 3; z += 1.1) {
      for (const x of [-1.3, -0.5, 0.5, 1.3]) {
        if (random() < 0.25) continue;
        const body = new Mesh(seat, tops[Math.floor(random() * tops.length)]!);
        body.position.set(x, -WATER + 0.95, z);
        const face = new Mesh(head, skin[Math.floor(random() * skin.length)]!);
        face.position.set(x, -WATER + 1.38, z);
        boat.add(body, face);
      }
    }
    const skipper = new Mesh(seat, tops[1]!);
    skipper.position.set(0, -WATER + 1.1, length / 2 - 1.6);
    const cap = new Mesh(head, skin[0]!);
    cap.position.set(0, -WATER + 1.6, length / 2 - 1.6);
    boat.add(skipper, cap);
    boat.children.forEach((m) => (m.castShadow = true));
    return boat;
  }

  /**
   * A commuter's own bike: an upright frame in its own colour with a rear rack, and now and then
   * a passenger riding side-saddle on the rack, the Amsterdam way, or a backpack on the rider.
   */
  private commuterBike(bike: BufferGeometry, random: () => number): Group {
    this.bikePaints ??= [0x16181b, 0x16181b, 0x2a3a5c, 0x6a1a1a, 0x8fc0b0, 0xe8dcc0, 0x2f4a34].map(
      (hex) => this.material({ color: hex, metalness: 0.35, roughness: 0.5 }),
    );
    this.sitters ??= this.material({ vertexColors: true, roughness: 0.85 });
    const group = new Group();
    const paint = this.bikePaints[Math.floor(random() * this.bikePaints.length)]!;
    const rack = new Mesh(this.unit, paint);
    rack.scale.set(0.3, 0.03, 0.42);
    rack.position.set(0, 0.82, 0.5);
    group.add(new Mesh(bike, paint), rack);
    const roll = random();
    if (roll < 0.2) {
      const passenger = new Mesh(sitterGeometry(random), this.sitters);
      this.disposables.push(passenger.geometry);
      passenger.rotation.y = random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
      passenger.position.set(0, 0.36, 0.52);
      group.add(passenger);
    } else if (roll < 0.45) {
      const pack = new Mesh(
        this.unit,
        this.material({
          color: [0x1d1f24, 0x2c7be5, 0xc8102e, 0x6a6e70][Math.floor(random() * 4)]!,
          roughness: 0.85,
        }),
      );
      pack.scale.set(0.3, 0.4, 0.16);
      pack.position.set(0, 1.42, 0.42);
      pack.rotation.x = -0.12;
      group.add(pack);
    } else if (roll < 0.6) {
      // A child in a moulded seat on the front tube, between the rider's arms, as Dutch
      // parents carry their toddlers.
      const seat = new Mesh(
        this.unit,
        this.material({
          color: [0x2c7be5, 0xd8282e, 0x3a6b4a][Math.floor(random() * 3)]!,
          roughness: 0.5,
        }),
      );
      seat.scale.set(0.3, 0.32, 0.28);
      seat.position.set(0, 1.0, -0.18);
      const child = new Mesh(sitterGeometry(random), this.sitters);
      this.disposables.push(child.geometry);
      child.scale.setScalar(0.5);
      child.position.set(0, 0.82, -0.12);
      group.add(seat, child);
    } else if (roll < 0.7) {
      // A courier: a big insulated delivery box strapped to the front carrier.
      const crate = new Mesh(
        this.unit,
        this.material({
          color: [0xf2f2ee, 0x2a3a5c, 0x3a6b4a][Math.floor(random() * 3)]!,
          roughness: 0.6,
        }),
      );
      crate.scale.set(0.5, 0.45, 0.5);
      crate.position.set(0, 1.12, -0.72);
      const carrier = new Mesh(this.unit, paint);
      carrier.scale.set(0.45, 0.03, 0.45);
      carrier.position.set(0, 0.88, -0.72);
      group.add(crate, carrier);
    }
    group.children.forEach((m) => (m.castShadow = true));
    return group;
  }

  /**
   * Herring gulls wheeling over the canal ahead, white with grey backs and black wingtips, and
   * a flock of grey pigeons pecking about the pavement by the café and the benches.
   */
  private addBirds(roadHalf: number): void {
    const random = seeded(739);
    const white = this.material({ color: 0xf2f2ee, roughness: 0.8 });
    const grey = this.material({ color: 0x9aa0a8, roughness: 0.8 });
    const body = new CapsuleGeometry(0.1, 0.35, 3, 8);
    body.rotateX(Math.PI / 2);
    const wing = new BoxGeometry(0.75, 0.02, 0.24);
    wing.translate(0.38, 0, 0);
    this.disposables.push(body, wing);
    for (let i = 0; i < 6; i++) {
      const gull = new Group();
      const left = new Mesh(wing, grey);
      left.rotation.y = Math.PI;
      const leftWing = new Group();
      leftWing.add(left);
      const rightWing = new Group();
      rightWing.add(new Mesh(wing, grey));
      gull.add(new Mesh(body, white), leftWing, rightWing);
      this.group.add(gull);
      this.gulls.push({
        mesh: gull,
        radius: 8 + random() * 14,
        height: 16 + random() * 12,
        phase: random() * 6.3,
      });
    }
    // Pigeons.
    const plump = new SphereGeometry(0.1, 8, 6);
    plump.scale(0.8, 0.8, 1.2);
    plump.translate(0, 0.1, 0);
    const head = new SphereGeometry(0.045, 6, 5);
    head.translate(0, 0.2, -0.1);
    const pigeon = mergeGeometries([plump.toNonIndexed(), head.toNonIndexed()])!;
    plump.dispose();
    head.dispose();
    const slate = this.material({ color: 0x7a7e88, roughness: 0.85 });
    this.disposables.push(pigeon);
    const flock = new Group();
    for (let i = 0; i < 9; i++) {
      const bird = new Mesh(pigeon, slate);
      bird.position.set((random() - 0.5) * 1.4, KERB, (random() - 0.5) * 3);
      bird.rotation.set(random() < 0.5 ? 0.5 : 0, random() * Math.PI * 2, 0);
      bird.castShadow = true;
      flock.add(bird);
    }
    this.group.add(flock);
    this.props.push({ mesh: flock, offset: START + BEHIND + 9, x: roadHalf + 0.6 });
  }

  /**
   * A grey heron standing motionless on the quay's edge by the first bridge, next to an angler
   * fishing from his stool, as Amsterdam's herons wait by anglers, stalls and fishmongers.
   */
  private addHeron(roadHalf: number): void {
    const grey = this.material({ color: 0x9aa0a6, roughness: 0.8 });
    const white = this.material({ color: 0xeeeeea, roughness: 0.8 });
    const black = this.material({ color: 0x1b1b1f, roughness: 0.7 });
    const yellow = this.material({ color: 0xd8b030, roughness: 0.6 });
    const heron = new Group();
    const body = new Mesh(new CapsuleGeometry(0.16, 0.45, 4, 8), grey);
    body.rotation.x = Math.PI / 2 - 0.5;
    body.position.set(0, 0.95, 0);
    const neck = new Mesh(new CylinderGeometry(0.045, 0.06, 0.6, 6), white);
    neck.position.set(0, 1.35, -0.22);
    neck.rotation.x = -0.35;
    const head = new Mesh(new SphereGeometry(0.075, 8, 6), white);
    head.position.set(0, 1.66, -0.33);
    const crest = new Mesh(this.unit, black);
    crest.scale.set(0.03, 0.03, 0.18);
    crest.position.set(0, 1.7, -0.24);
    const bill = new Mesh(new ConeGeometry(0.03, 0.26, 6), yellow);
    bill.rotation.x = -Math.PI / 2;
    bill.position.set(0, 1.64, -0.5);
    heron.add(body, neck, head, crest, bill);
    for (const x of [-0.06, 0.06]) {
      const leg = new Mesh(this.unit, yellow);
      leg.scale.set(0.025, 0.72, 0.025);
      leg.position.set(x, 0.36, 0.05);
      heron.add(leg);
    }
    heron.children.forEach((m) => {
      m.castShadow = true;
      if (m instanceof Mesh && m.geometry !== this.unit) this.disposables.push(m.geometry);
    });
    heron.rotation.y = 0.9;
    heron.position.y = KERB;
    const spot = new Group();
    spot.add(heron);
    // The angler it is waiting on: sitting on a folding stool at the quay's edge, rod out over
    // the water, a bucket at his side.
    const angler = new Mesh(
      sitterGeometry(seeded(919)),
      this.material({ vertexColors: true, roughness: 0.85 }),
    );
    this.disposables.push(angler.geometry);
    angler.rotation.y = Math.PI / 2;
    angler.position.set(0.15, KERB, 1.3);
    const stool = new Mesh(this.unit, this.material({ color: 0x3a4a3a, roughness: 0.8 }));
    stool.scale.set(0.35, 0.42, 0.35);
    stool.position.set(0.35, KERB + 0.21, 1.3);
    const rod = new Mesh(new CylinderGeometry(0.008, 0.02, 3.6, 5), black);
    this.disposables.push(rod.geometry);
    rod.position.set(-1.1, KERB + 1.5, 1.2);
    rod.rotation.z = -1.0;
    const line = new Mesh(this.unit, white);
    line.scale.set(0.006, 2.6, 0.006);
    line.position.set(-2.6, KERB + 1.0 - WATER / 2, 1.2);
    const pail = new Mesh(
      new CylinderGeometry(0.15, 0.12, 0.3, 10),
      this.material({ color: 0x2c7be5, roughness: 0.5 }),
    );
    this.disposables.push(pail.geometry);
    pail.position.set(0.3, KERB + 0.15, 1.85);
    spot.add(angler, stool, rod, line, pail);
    spot.children.forEach((m) => (m.castShadow = true));
    this.group.add(spot);
    this.props.push({ mesh: spot, offset: BRIDGE - 1.2, x: -roadHalf - QUAY + 0.6 });
  }

  /**
   * Waterfowl on the canal: pairs of mute swans, mallards (the drakes' heads bottle green) and
   * black coots with their white bills, paddling slowly along near the walls and the boats.
   */
  private addWaterfowl(roadHalf: number): void {
    const random = seeded(631);
    const edge = -roadHalf - QUAY;
    const mat = (hex: number) => this.material({ color: hex, roughness: 0.8 });
    const kinds = [
      { body: mat(0xf4f2ec), head: mat(0xf4f2ec), bill: mat(0xe0782a), size: 1.0, neck: true },
      { body: mat(0x8a6a4a), head: mat(0x1f5a32), bill: mat(0xd8b030), size: 0.45, neck: false },
      { body: mat(0x6a5038), head: mat(0x6a5038), bill: mat(0xc08a30), size: 0.42, neck: false },
      { body: mat(0x1b1b1d), head: mat(0x1b1b1d), bill: mat(0xf2f2ee), size: 0.36, neck: false },
    ];
    const body = new SphereGeometry(0.5, 10, 8);
    body.scale(0.55, 0.42, 1);
    const neck = new TorusGeometry(0.28, 0.06, 5, 10, Math.PI * 0.9);
    neck.rotateY(Math.PI / 2);
    neck.translate(0, 0.32, -0.3);
    const head = new SphereGeometry(0.11, 8, 6);
    const bill = new ConeGeometry(0.04, 0.14, 5);
    bill.rotateX(-Math.PI / 2);
    this.disposables.push(body, neck, head, bill);
    for (let i = 0; i < 16; i++) {
      const k = i < 4 ? 0 : i < 8 ? 1 : i < 11 ? 2 : 3;
      const kind = kinds[k]!;
      const bird = new Group();
      const torso = new Mesh(body, kind.body);
      torso.position.y = 0.08;
      bird.add(torso);
      const headY = kind.neck ? 0.78 : 0.32;
      const headZ = kind.neck ? -0.42 : -0.42;
      if (kind.neck) bird.add(new Mesh(neck, kind.body));
      const face = new Mesh(head, kind.head);
      face.position.set(0, headY, headZ);
      const beak = new Mesh(bill, kind.bill);
      beak.position.set(0, headY - 0.02, headZ - 0.13);
      bird.add(face, beak);
      bird.scale.setScalar(kind.size);
      bird.children.forEach((m) => (m.castShadow = true));
      const pair = Math.floor(i / 2);
      const nearWall = pair % 2 === 0;
      const swim = new Group();
      swim.add(bird);
      bird.position.set((random() - 0.5) * 1.2, 0, (i % 2) * 1.4);
      const speed = (random() < 0.5 ? 1 : -1) * (0.2 + random() * 0.3);
      bird.rotation.y = speed < 0 ? Math.PI : 0;
      swim.position.x = nearWall ? edge - 6 - random() * 3 : edge - CANAL + 6 + random() * 3;
      this.group.add(swim);
      this.boats.push({ mesh: swim, offset: 95 + pair * 41 + random() * 20, speed, float: -WATER });
    }
    // A mallard pair and a coot waddling along the quay among the bikes.
    for (const [k, along, across] of [
      [1, 9, -3.0],
      [2, 9.8, -3.3],
      [3, 14, -2.8],
    ] as const) {
      const kind = kinds[k]!;
      const bird = new Group();
      const torso = new Mesh(body, kind.body);
      torso.position.y = 0.32;
      const face = new Mesh(head, kind.head);
      face.position.set(0, 0.6, -0.42);
      const beak = new Mesh(bill, kind.bill);
      beak.position.set(0, 0.58, -0.55);
      bird.add(torso, face, beak);
      for (const x of [-0.12, 0.12]) {
        const leg = new Mesh(this.unit, kind.bill);
        leg.scale.set(0.04, 0.22, 0.04);
        leg.position.set(x, 0.11, 0);
        bird.add(leg);
      }
      bird.scale.setScalar(kind.size);
      bird.rotation.y = 0.6;
      bird.children.forEach((m) => (m.castShadow = true));
      const walk = new Group();
      walk.add(bird);
      walk.position.x = -roadHalf + across;
      this.group.add(walk);
      this.boats.push({ mesh: walk, offset: START + BEHIND + along, speed: 0.05, float: KERB });
    }
  }

  /** Commuters cycling the street both ways on upright bikes, and people on the pavements. */
  private addCommuters(roadHalf: number): void {
    const random = seeded(449);
    const frame = this.material({ color: 0x1d1f24, metalness: 0.4, roughness: 0.5 });
    const bike = bikeGeometry();
    const cargo = bakfietsGeometry();
    this.disposables.push(bike, cargo.frame, cargo.box);
    const wood = this.material({ color: 0x9a6a3a, roughness: 0.8 });
    const kids = [0xf0c8a0, 0xc48a5f, 0x8d5a3b].map((hex) =>
      this.material({ color: hex, roughness: 0.7 }),
    );
    const head = new SphereGeometry(0.09, 8, 6);
    this.disposables.push(head);
    // A bakfiets: the cargo bike, its wooden box up front carrying a child or two.
    const bakfiets = () => {
      const group = new Group();
      group.add(new Mesh(cargo.frame, frame), new Mesh(cargo.box, wood));
      const children = 1 + Math.floor(random() * 2);
      for (let c = 0; c < children; c++) {
        const child = new Mesh(head, kids[Math.floor(random() * kids.length)]!);
        child.position.set(c === 0 ? 0 : 0.18, 0.98, -0.75 - c * 0.3);
        group.add(child);
      }
      group.children.forEach((m) => (m.castShadow = true));
      return group;
    };
    for (const [along, x] of [
      [6, roadHalf + 1.2],
      [19, roadHalf + 1.1],
    ] as const) {
      const parked = new Group();
      const cargoBike = bakfiets();
      cargoBike.rotation.y = 0.15;
      parked.add(cargoBike);
      parked.position.y = KERB;
      this.group.add(parked);
      this.props.push({ mesh: parked, offset: START + BEHIND + along, x });
    }
    const extras = seeded(727);
    for (let offset = 10; offset < LOOP; offset += 14 + random() * 18) {
      const towards = random() < 0.5;
      const mesh = random() < 0.25 ? bakfiets() : this.commuterBike(bike, extras);
      this.group.add(mesh);
      this.riders.push({
        bike: mesh,
        offset,
        x: towards ? -roadHalf + 0.9 : roadHalf - 0.7 - random() * 0.6,
        speed: towards ? -(3.5 + random()) : 3.2 + random(),
        phase: random() * 6.3,
      });
    }
    // Across the canal, cyclists ride the far quay's street both ways too.
    const farLane = seeded(863);
    for (let offset = 20; offset < LOOP; offset += 40 + farLane() * 30) {
      const towards = farLane() < 0.5;
      const mesh = this.commuterBike(bike, extras);
      this.group.add(mesh);
      this.riders.push({
        bike: mesh,
        offset,
        x: -roadHalf - QUAY - CANAL - (towards ? 1.6 : 3.4),
        speed: towards ? -(3.4 + farLane()) : 3.2 + farLane(),
        phase: farLane() * 6.3,
      });
    }
    this.cyclists = new SeatedRiders(this.group, this.disposables, this.riders.length, 457);
    for (let offset = 0; offset < LOOP; offset += 6 + random() * 10) {
      const nearSide = random() < 0.5;
      this.walkers.push({
        offset,
        // On the pavement's open strip outside the stoops, or on the quay between the parked
        // cars and the elms.
        x: nearSide
          ? roadHalf + 0.6 + random() * 0.5
          : random() < 0.6
            ? -roadHalf - 2.5 - random() * 1.1
            : -roadHalf - QUAY - CANAL - 3 - random() * 1.2,
        speed: (random() < 0.5 ? 1 : -1) * (1 + random() * 0.4),
        scale: 0.9 + random() * 0.15,
        phase: random() * 6.3,
      });
    }
    // Joggers on the quay in running kit, at three times a walker's pace.
    const joggers = this.walkers.length;
    for (const [offset, speed, x] of [
      [START + BEHIND + 18, -2.9, -roadHalf - 3.0],
      [140, 3.1, -roadHalf - 3.3],
      [230, -2.7, -roadHalf - QUAY - CANAL - 3.4],
      [300, 2.8, -roadHalf - 2.9],
    ] as const) {
      this.walkers.push({ offset, x, speed, scale: 0.98, phase: offset });
    }
    this.pedestrians = new Walkers(this.group, this.disposables, this.walkers.length, 461);
    const kit = ['#ff3a7a', '#1d1f24', '#2c7be5', '#c8f040'];
    for (let j = joggers; j < this.walkers.length; j++) {
      this.pedestrians.kit(j, kit[j % kit.length]!, '#1d1f24');
    }
    const dog = dogGeometry();
    const fur = new MeshStandardMaterial({ roughness: 0.95 });
    this.dogs = new InstancedMesh(dog, fur, Math.ceil(this.walkers.length / 5));
    this.dogs.frustumCulled = false;
    this.dogs.castShadow = true;
    const coats = ['#3a2a1e', '#1b1b1b', '#c89a5a', '#efe8dc', '#7a5a3a'];
    const coat = new Color();
    for (let i = 0; i < this.dogs.count; i++) {
      this.dogs.setColorAt(i, coat.set(coats[Math.floor(random() * coats.length)]!));
    }
    this.group.add(this.dogs);
    this.disposables.push(dog, fur, this.dogs);
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
 * A stoop against a front at x 0, facing -x, its landing centred on z 0 before the raised ground
 * floor's door: a stone landing 1 m deep and three steps running down sideways along the front
 * towards +z, so the pavement stays clear, with a black iron railing round the landing's open
 * end and down the outer edge of the steps.
 */
function stoopGeometry(): { steps: BufferGeometry; railings: BufferGeometry } {
  const stone: BufferGeometry[] = [];
  const iron: BufferGeometry[] = [];
  const rise = 0.28;
  const top = 4 * rise;
  const landing = new BoxGeometry(1.0, top, 1.3);
  landing.translate(-0.5, top / 2, 0);
  stone.push(landing);
  for (let i = 0; i < 3; i++) {
    const height = (3 - i) * rise;
    const step = new BoxGeometry(0.95, height, 0.3);
    step.translate(-0.475, height / 2, 0.65 + i * 0.3 + 0.15);
    stone.push(step);
  }
  const rail = (a: Vector3, b: Vector3) => iron.push(limb(a, b, 0.022));
  const hand = top + 0.9;
  const x = -0.97;
  rail(new Vector3(0, hand, -0.63), new Vector3(x, hand, -0.63));
  rail(new Vector3(x, hand, -0.63), new Vector3(x, hand, 0.65));
  rail(new Vector3(x, hand, 0.65), new Vector3(x, rise + 0.9, 1.55));
  for (let u = 0.05; u < 0.97; u += 0.14) {
    const post = new BoxGeometry(0.02, 0.9, 0.02);
    post.translate(-u, top + 0.45, -0.63);
    iron.push(post);
  }
  for (let z = -0.6; z < 1.55; z += 0.14) {
    const foot = z < 0.65 ? top : (3 - Math.min(2, Math.floor((z - 0.65) / 0.3))) * rise;
    const head = z < 0.65 ? hand : hand - ((z - 0.65) / 0.9) * 3 * rise;
    const post = new BoxGeometry(0.02, head - foot, 0.02);
    post.translate(x, (head + foot) / 2, z);
    iron.push(post);
  }
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  return { steps: merge(stone), railings: merge(iron) };
}

/**
 * One of the canals' cast-iron lamps, 4.6 m tall: a fluted post on a stepped, flared base with
 * collars up its shaft and the lamplighter's ladder bar under the head, carrying a four-sided
 * lantern that widens upward under a crowned cap with a finial.
 */
function canalLamp(): { post: BufferGeometry; lantern: BufferGeometry } {
  const profile = [
    [0, 0],
    [0.2, 0],
    [0.2, 0.12],
    [0.16, 0.16],
    [0.16, 0.3],
    [0.11, 0.5],
    [0.09, 0.9],
    [0.11, 0.95],
    [0.08, 1.0],
    [0.065, 2.6],
    [0.085, 2.65],
    [0.06, 2.7],
    [0.05, 3.85],
    [0.075, 3.9],
    [0.05, 3.95],
    [0.05, 4.0],
    [0.13, 4.05],
    [0, 4.06],
  ].map(([x, y]) => new Vector2(x, y));
  const parts: BufferGeometry[] = [new LatheGeometry(profile, 12).toNonIndexed()];
  const bar = new BoxGeometry(0.7, 0.04, 0.04);
  bar.translate(0, 3.7, 0);
  parts.push(bar.toNonIndexed());
  for (const x of [-0.35, 0.35]) {
    const knob = new SphereGeometry(0.035, 6, 4);
    knob.translate(x, 3.7, 0);
    parts.push(knob.toNonIndexed());
  }
  const cap = new CylinderGeometry(0.05, 0.3, 0.22, 4);
  cap.rotateY(Math.PI / 4);
  cap.translate(0, 4.71, 0);
  const crown = new CylinderGeometry(0.02, 0.06, 0.28, 6);
  crown.translate(0, 4.95, 0);
  const finial = new SphereGeometry(0.04, 6, 4);
  finial.translate(0, 5.1, 0);
  const frame = new CylinderGeometry(0.26, 0.15, 0.06, 4);
  frame.rotateY(Math.PI / 4);
  frame.translate(0, 4.08, 0);
  parts.push(cap.toNonIndexed(), crown.toNonIndexed(), finial.toNonIndexed(), frame.toNonIndexed());
  const post = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  const lantern = new CylinderGeometry(0.25, 0.15, 0.5, 4);
  lantern.rotateY(Math.PI / 4);
  lantern.translate(0, 4.36, 0);
  return { post, lantern };
}

/**
 * An Amsterdammertje: a slender cast-iron post 0.9 m tall on a flared foot, with a collar and a
 * rounded cap, and its three St Andrew's crosses in relief, one above another, towards the road.
 */
function amsterdammertje(): BufferGeometry {
  const profile = [
    [0, 0],
    [0.09, 0],
    [0.085, 0.05],
    [0.065, 0.1],
    [0.055, 0.7],
    [0.07, 0.74],
    [0.07, 0.78],
    [0.055, 0.8],
    [0.058, 0.86],
    [0.04, 0.9],
    [0, 0.92],
  ].map(([x, y]) => new Vector2(x, y));
  const parts: BufferGeometry[] = [new LatheGeometry(profile, 10).toNonIndexed()];
  for (const side of [-1, 1]) {
    for (const y of [0.3, 0.42, 0.54]) {
      for (const tilt of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new BoxGeometry(0.012, 0.09, 0.012);
        bar.rotateX(tilt);
        bar.translate(0, y, 0);
        bar.translate(side * 0.058, 0, 0);
        parts.push(bar.toNonIndexed());
      }
    }
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Ivy up an elm's trunk: clumps of dark leaves wrapped round it from the ground to 3 m, thick at
 * the foot and thinning upward.
 */
function ivyGeometry(): BufferGeometry {
  const random = seeded(823);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 70; i++) {
    const y = Math.pow(random(), 1.6) * 3.2;
    const a = random() * Math.PI * 2;
    const r = 0.3 - y * 0.025 + random() * 0.05;
    const clump = new IcosahedronGeometry(0.09 + random() * 0.07, 0);
    clump.translate(Math.cos(a) * r, KERB + 0.1 + y, Math.sin(a) * r);
    parts.push(clump);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Grass and weeds in a tree bed: clumps of blades over 1.5 m square. */
function tuftGeometry(): BufferGeometry {
  const random = seeded(673);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 26; i++) {
    const clump = new ConeGeometry(0.06 + random() * 0.08, 0.12 + random() * 0.25, 5);
    const a = random() * Math.PI * 2;
    const r = 0.35 + random() * 0.4;
    clump.translate(Math.cos(a) * r, 0.08 + random() * 0.05, Math.sin(a) * r);
    parts.push(clump.toNonIndexed());
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A dog of middling size, along z, its nose towards -z: body, head and muzzle, legs, ears and tail. */
function dogGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const body = new CapsuleGeometry(0.13, 0.42, 4, 8);
  body.rotateX(Math.PI / 2);
  body.translate(0, 0.42, 0);
  const head = new SphereGeometry(0.11, 8, 6);
  head.translate(0, 0.58, -0.36);
  const muzzle = new BoxGeometry(0.08, 0.07, 0.12);
  muzzle.translate(0, 0.55, -0.47);
  parts.push(body, head, muzzle);
  for (const x of [-0.08, 0.08]) {
    for (const z of [-0.2, 0.2]) {
      const leg = new CylinderGeometry(0.03, 0.025, 0.36, 5);
      leg.translate(x, 0.18, z);
      parts.push(leg);
    }
    const ear = new BoxGeometry(0.04, 0.09, 0.05);
    ear.translate(x * 0.9, 0.64, -0.33);
    parts.push(ear);
  }
  parts.push(limb(new Vector3(0, 0.45, 0.33), new Vector3(0, 0.6, 0.5), 0.02));
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** A limb from `a` to `b`, `radius` thick. */
function limb(a: Vector3, b: Vector3, radius: number): BufferGeometry {
  const length = a.distanceTo(b);
  const geometry = new CylinderGeometry(radius, radius * 0.85, length, 6);
  geometry.translate(0, length / 2, 0);
  geometry.applyQuaternion(
    new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize()),
  );
  geometry.translate(a.x, a.y, a.z);
  return geometry.toNonIndexed();
}

/**
 * People walking the pavements and the quay, 1.72 m tall at scale 1, as instanced meshes:
 * trousers or skirts on two legs that swing with their stride, a coat or jacket with arms
 * swinging against the legs, a head, hair in its own colour (or a cap), and a tote bag or
 * backpack on some.
 */
class Walkers {
  private readonly legs: InstancedMesh[];
  private readonly body: InstancedMesh;
  private readonly arms: InstancedMesh[];
  private readonly head: InstancedMesh;
  private readonly hair: InstancedMesh;
  private readonly bag: InstancedMesh;
  private readonly bags: boolean[] = [];
  private readonly matrix = new Matrix4();
  private readonly part = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly size = new Vector3();
  private readonly swing = new Quaternion();
  private readonly up = new Vector3(0, 1, 0);
  private readonly side = new Vector3(1, 0, 0);

  constructor(group: Group, disposables: { dispose(): void }[], count: number, seed: number) {
    const leg = new CapsuleGeometry(0.075, 0.72, 3, 8);
    leg.translate(0, -0.42, 0);
    const torso = new CapsuleGeometry(0.19, 0.42, 4, 10);
    const arm = new CapsuleGeometry(0.045, 0.55, 3, 6);
    arm.translate(0, -0.3, 0);
    const head = new SphereGeometry(0.115, 12, 10);
    const hair = new SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const bag = new BoxGeometry(0.3, 0.36, 0.1);
    const make = (geometry: BufferGeometry, roughness: number) => {
      const material = new MeshStandardMaterial({ roughness });
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      group.add(mesh);
      disposables.push(material, mesh);
      return mesh;
    };
    disposables.push(leg, torso, arm, head, hair, bag);
    this.legs = [make(leg, 0.9), make(leg, 0.9)];
    this.body = make(torso, 0.85);
    this.arms = [make(arm, 0.85), make(arm, 0.85)];
    this.head = make(head, 0.7);
    this.hair = make(hair, 0.9);
    this.bag = make(bag, 0.8);
    const random = seeded(seed);
    const pick = (list: readonly string[]) => list[Math.floor(random() * list.length)]!;
    const c = new Color();
    const hairs = ['#1b1410', '#3a2a1e', '#6a4a2a', '#c8a060', '#9a9a96', '#2a1a12', '#b05a2a'];
    const totes = ['#e8dcc0', '#1d1f24', '#2c7be5', '#c8102e', '#3a6b4a'];
    for (let i = 0; i < count; i++) {
      const top = pick(COMMUTER_WEAR.tops);
      const bottom = pick(COMMUTER_WEAR.bottoms);
      this.body.setColorAt(i, c.set(top));
      this.arms.forEach((a) => a.setColorAt(i, c.set(top)));
      this.legs.forEach((l) => l.setColorAt(i, c.set(bottom)));
      this.head.setColorAt(i, c.set(pick(COMMUTER_WEAR.skins)));
      this.hair.setColorAt(i, c.set(pick(hairs)));
      this.bag.setColorAt(i, c.set(pick(totes)));
      this.bags.push(random() < 0.35);
    }
  }

  /**
   * Stands walker `i` at (x, y, z), turned `heading`, `scale` tall, lifted `bob`, at `stride`
   * through its step cycle (radians).
   */
  set(
    i: number,
    x: number,
    y: number,
    z: number,
    heading: number,
    scale: number,
    bob: number,
    stride: number,
  ): void {
    this.turn.setFromAxisAngle(this.up, heading);
    this.size.setScalar(scale);
    this.matrix.compose(this.spot.set(x, y + bob, z), this.turn, this.size);
    const at = (mesh: InstancedMesh, px: number, py: number, pz: number, angle = 0) => {
      this.swing.setFromAxisAngle(this.side, angle);
      this.part.compose(this.spot.set(px, py, pz), this.swing, this.size.setScalar(1));
      mesh.setMatrixAt(i, this.part.premultiply(this.matrix));
    };
    const a = Math.sin(stride) * 0.35;
    at(this.legs[0]!, -0.1, 0.9, 0, a);
    at(this.legs[1]!, 0.1, 0.9, 0, -a);
    at(this.body, 0, 1.15, 0);
    at(this.arms[0]!, -0.24, 1.4, 0, -a * 0.8);
    at(this.arms[1]!, 0.24, 1.4, 0, a * 0.8);
    at(this.head, 0, 1.6, 0);
    at(this.hair, 0, 1.63, 0.01);
    if (this.bags[i]) at(this.bag, 0.3, 1.0, 0.02, a * 0.5);
    else this.bag.setMatrixAt(i, this.part.makeScale(0, 0, 0));
    this.size.setScalar(scale);
  }

  /** Dresses walker `i` in running kit: a bright top and dark tights, with no bag. */
  kit(i: number, top: string, tights: string): void {
    const c = new Color(top);
    this.body.setColorAt(i, c);
    this.arms.forEach((a) => a.setColorAt(i, c));
    c.set(tights);
    this.legs.forEach((l) => l.setColorAt(i, c));
    this.bags[i] = false;
  }

  /** Uploads the walkers set this frame. */
  commit(): void {
    for (const mesh of [...this.legs, this.body, ...this.arms, this.head, this.hair, this.bag]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/**
 * Commuters sitting up on their Dutch bikes, as three instanced meshes: their tops (a torso held
 * upright and arms reaching to the swept-back bars), their trousers (one leg up, one down on the
 * pedals) and their skin (head and hands), each rider dressed from the commuters' wardrobe.
 */
class SeatedRiders {
  private readonly meshes: InstancedMesh[];
  private readonly matrix = new Matrix4();
  private readonly spot = new Vector3();
  private readonly turn = new Quaternion();
  private readonly one = new Vector3(1, 1, 1);
  private readonly up = new Vector3(0, 1, 0);

  constructor(group: Group, disposables: { dispose(): void }[], count: number, seed: number) {
    const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
    const torso = new CapsuleGeometry(0.17, 0.42, 4, 8);
    torso.rotateX(-0.12);
    torso.translate(0, 1.38, 0.2);
    const tops = [torso.toNonIndexed()];
    const legs: BufferGeometry[] = [];
    const skin: BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      const shoulder = v(side * 0.19, 1.6, 0.15);
      const hand = v(side * 0.25, 1.06, -0.46);
      const elbow = v(side * 0.24, 1.3, -0.12);
      tops.push(limb(shoulder, elbow, 0.05), limb(elbow, hand, 0.045));
      const palm = new SphereGeometry(0.045, 6, 4);
      palm.translate(hand.x, hand.y, hand.z);
      skin.push(palm.toNonIndexed());
      const hip = v(side * 0.1, 1.02, 0.22);
      const pedal = side < 0 ? v(-0.1, 0.52, -0.08) : v(0.1, 0.2, 0.08);
      const knee = side < 0 ? v(-0.11, 0.98, -0.2) : v(0.11, 0.66, -0.12);
      legs.push(limb(hip, knee, 0.075), limb(knee, pedal, 0.06));
      const shoe = new BoxGeometry(0.09, 0.07, 0.24);
      shoe.translate(pedal.x, pedal.y - 0.02, pedal.z - 0.05);
      legs.push(shoe.toNonIndexed());
    }
    const head = new SphereGeometry(0.115, 12, 10);
    head.translate(0, 1.82, 0.12);
    skin.push(head.toNonIndexed());
    const merge = (parts: BufferGeometry[]) => {
      const merged = mergeGeometries(parts)!;
      parts.forEach((p) => p.dispose());
      return merged;
    };
    // Hair (or a beanie) over the head, and a collar of scarf at the neck.
    const hair = new SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hair.translate(0, 1.84, 0.13);
    const scarf = new TorusGeometry(0.1, 0.045, 6, 12);
    scarf.rotateX(Math.PI / 2);
    scarf.translate(0, 1.66, 0.14);
    this.meshes = [
      merge(tops),
      merge(legs),
      merge(skin),
      merge([hair.toNonIndexed(), scarf.toNonIndexed()]),
    ].map((geometry) => {
      const material = new MeshStandardMaterial({ roughness: 0.85 });
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      group.add(mesh);
      disposables.push(geometry, material, mesh);
      return mesh;
    });
    const random = seeded(seed);
    const pick = (list: readonly string[]) => list[Math.floor(random() * list.length)]!;
    const c = new Color();
    for (let i = 0; i < count; i++) {
      this.meshes[0]!.setColorAt(i, c.set(pick(COMMUTER_WEAR.tops)));
      this.meshes[1]!.setColorAt(i, c.set(pick(COMMUTER_WEAR.bottoms)));
      this.meshes[2]!.setColorAt(i, c.set(pick(COMMUTER_WEAR.skins)));
      this.meshes[3]!.setColorAt(
        i,
        c.set(pick(['#1b1410', '#3a2a1e', '#6a4a2a', '#c8a060', '#9a9a96', '#b05a2a', '#2c3a5c'])),
      );
    }
  }

  /** Seats rider `i` on a bike at (x, y, z), turned `heading` radians, lifted `bob`. */
  set(i: number, x: number, y: number, z: number, heading: number, bob: number): void {
    this.turn.setFromAxisAngle(this.up, heading);
    this.spot.set(x, y + bob, z);
    this.matrix.compose(this.spot, this.turn, this.one);
    for (const mesh of this.meshes) mesh.setMatrixAt(i, this.matrix);
    for (const mesh of this.meshes) mesh.instanceMatrix.needsUpdate = true;
  }
}

/**
 * A parked car along z, its nose towards -z, centred on z 0: the body extruded from its side
 * profile, a band of dark glass round the cabin and four wheels. A hatchback, a rounded city car
 * or a tall delivery van.
 */
function carGeometry(kind: 'hatch' | 'city' | 'van'): {
  body: BufferGeometry;
  glass: BufferGeometry;
  wheels: BufferGeometry;
  plates: BufferGeometry;
  heads: BufferGeometry;
  tails: BufferGeometry;
  length: number;
} {
  const profiles = {
    hatch: {
      body: [
        [0, 0.28],
        [0, 0.72],
        [0.15, 0.86],
        [0.95, 0.94],
        [1.6, 1.42],
        [3.2, 1.45],
        [3.75, 1.0],
        [3.92, 0.88],
        [3.95, 0.28],
      ],
      glass: [
        [1.05, 0.96],
        [1.62, 1.38],
        [3.15, 1.4],
        [3.62, 1.0],
      ],
      wheels: [0.72, 3.25],
      width: 1.76,
    },
    city: {
      body: [
        [0, 0.28],
        [0, 0.7],
        [0.2, 0.86],
        [0.75, 0.96],
        [1.2, 1.42],
        [2.6, 1.48],
        [3.3, 1.05],
        [3.5, 0.8],
        [3.52, 0.28],
      ],
      glass: [
        [0.85, 0.98],
        [1.25, 1.38],
        [2.58, 1.42],
        [3.18, 1.04],
      ],
      wheels: [0.62, 2.9],
      width: 1.62,
    },
    van: {
      body: [
        [0, 0.3],
        [0, 0.82],
        [0.25, 1.0],
        [0.9, 1.25],
        [1.25, 1.98],
        [4.8, 2.02],
        [4.85, 0.3],
      ],
      glass: [
        [1.0, 1.3],
        [1.3, 1.9],
        [2.0, 1.92],
        [2.0, 1.28],
      ],
      wheels: [0.85, 3.9],
      width: 1.9,
    },
  }[kind];
  // The profile is smoothed through its points, so the bonnet, screen and roof flow into one
  // another, and closed straight along the sills.
  const shape = (points: number[][], smooth = true) => {
    const outline = new Shape();
    outline.moveTo(points[0]![0]!, points[0]![1]!);
    const rest = points.slice(1).map(([x, y]) => new Vector2(x!, y!));
    if (smooth) {
      outline.splineThru(rest.slice(0, -1));
      outline.lineTo(rest.at(-1)!.x, rest.at(-1)!.y);
    } else {
      for (const p of rest) outline.lineTo(p.x, p.y);
    }
    outline.closePath();
    return outline;
  };
  const length = profiles.body.at(-1)![0]!;
  const place = (geometry: BufferGeometry, width: number) => {
    geometry.translate(-length / 2, 0, -width / 2);
    geometry.rotateY(Math.PI / 2);
    return geometry;
  };
  const body = place(
    new ExtrudeGeometry(shape(profiles.body), {
      depth: profiles.width - 0.16,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      bevelSegments: 4,
      curveSegments: 18,
    }),
    profiles.width,
  );
  const glass = place(
    new ExtrudeGeometry(shape(profiles.glass), {
      depth: profiles.width + 0.1,
      bevelEnabled: false,
    }),
    profiles.width + 0.1,
  );
  const parts: BufferGeometry[] = [];
  for (const x of profiles.wheels) {
    for (const side of [-1, 1]) {
      const wheel = new CylinderGeometry(0.31, 0.31, 0.22, 14);
      wheel.rotateX(Math.PI / 2);
      wheel.translate(x - length / 2, 0.31, side * (profiles.width / 2 - 0.02));
      wheel.rotateY(Math.PI / 2);
      parts.push(wheel);
    }
  }
  const wheels = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  // Silver hubs on the wheels, and the door pillar dividing the side windows.
  const hubs: BufferGeometry[] = [];
  for (const x of profiles.wheels) {
    for (const side of [-1, 1]) {
      const hub = new CylinderGeometry(0.17, 0.17, 0.24, 12);
      hub.rotateX(Math.PI / 2);
      hub.translate(x - length / 2, 0.31, side * (profiles.width / 2 - 0.02));
      hub.rotateY(Math.PI / 2);
      hubs.push(hub);
    }
  }
  const pillar = new BoxGeometry(profiles.width + 0.14, 0.5, 0.12);
  pillar.translate(
    0,
    kind === 'van' ? 1.6 : 1.2,
    -length / 2 + (profiles.glass[0]![0]! + profiles.glass[2]![0]!) / 2,
  );
  const pair = (make: (z: number, side: number) => BufferGeometry | null) => {
    const pieces: BufferGeometry[] = [];
    for (const z of [-1, 1]) {
      for (const side of [-1, 1]) {
        const piece = make(z, side);
        if (piece) pieces.push(piece);
      }
    }
    const merged = mergeGeometries(pieces)!;
    pieces.forEach((p) => p.dispose());
    return merged;
  };
  const half = length / 2 + 0.07;
  const plates = pair((z, side) => {
    if (side > 0) return null;
    const plate = new BoxGeometry(0.52, 0.11, 0.02);
    plate.translate(0, z < 0 ? 0.42 : 0.55, z * half);
    return plate;
  });
  const heads = pair((z, side) => {
    if (z > 0) return null;
    const head = new BoxGeometry(0.26, 0.12, 0.03);
    head.translate(side * (profiles.width / 2 - 0.2), kind === 'van' ? 0.8 : 0.7, -half);
    return head;
  });
  const tails = pair((z, side) => {
    if (z < 0) return null;
    const tail = new BoxGeometry(0.16, kind === 'van' ? 0.4 : 0.18, 0.03);
    tail.translate(side * (profiles.width / 2 - 0.1), kind === 'van' ? 1.0 : 0.82, half);
    return tail;
  });
  const bright = mergeGeometries([heads, ...hubs])!;
  heads.dispose();
  hubs.forEach((h) => h.dispose());
  const shell = mergeGeometries([body.index ? body.toNonIndexed() : body, pillar.toNonIndexed()])!;
  body.dispose();
  pillar.dispose();
  return { body: shell, glass, wheels, plates, heads: bright, tails, length };
}

/**
 * A bakfiets along z, its box towards -z: the rider's half of an upright bike (rear wheel,
 * saddle and swept-back bars) on a long low frame running forward to a small front wheel, with
 * a varnished wooden box slung between, open at the top.
 */
function bakfietsGeometry(): { frame: BufferGeometry; box: BufferGeometry } {
  const parts: BufferGeometry[] = [];
  const wheel = (z: number, radius: number) => {
    const ring = new TorusGeometry(radius, 0.025, 4, 18);
    ring.rotateY(Math.PI / 2);
    ring.translate(0, radius + 0.02, z);
    parts.push(ring.toNonIndexed());
  };
  wheel(0.55, 0.34);
  wheel(-1.55, 0.25);
  parts.push(limb(new Vector3(0, 0.36, 0.55), new Vector3(0, 0.95, 0.25), 0.025));
  parts.push(limb(new Vector3(0, 0.36, 0.55), new Vector3(0, 0.3, -0.35), 0.03));
  parts.push(limb(new Vector3(0, 0.3, -0.35), new Vector3(0, 0.28, -1.55), 0.03));
  parts.push(limb(new Vector3(0, 0.95, 0.25), new Vector3(0, 0.3, -0.35), 0.025));
  parts.push(limb(new Vector3(0, 0.3, -0.35), new Vector3(0, 1.0, -0.42), 0.025));
  const saddle = new BoxGeometry(0.14, 0.05, 0.26);
  saddle.translate(0, 0.98, 0.25);
  const bars = new BoxGeometry(0.5, 0.03, 0.03);
  bars.translate(0, 1.05, -0.48);
  parts.push(saddle.toNonIndexed(), bars.toNonIndexed());
  const frame = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  const sides: BufferGeometry[] = [];
  const panel = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const board = new BoxGeometry(w, h, d);
    board.translate(x, y, z);
    sides.push(board.toNonIndexed());
  };
  panel(0.62, 0.04, 0.9, 0, 0.36, -0.95);
  panel(0.03, 0.5, 0.9, -0.3, 0.6, -0.95);
  panel(0.03, 0.5, 0.9, 0.3, 0.6, -0.95);
  panel(0.62, 0.5, 0.03, 0, 0.6, -1.4);
  panel(0.62, 0.42, 0.03, 0, 0.56, -0.5);
  const box = mergeGeometries(sides)!;
  sides.forEach((p) => p.dispose());
  return { frame, box };
}

/**
 * A roof 1 wide (x), 1 tall and 1 deep (z): a prism whose ridge runs back along z from the
 * front's gable, or, with `alongFront`, a ridge running along x, hipped at both ends.
 */
function roofGeometry(alongFront: boolean): BufferGeometry {
  const shape = new Shape();
  if (alongFront) {
    shape.moveTo(0, 0);
    shape.lineTo(1, 0);
    shape.lineTo(0.5, 1);
    shape.closePath();
    const roof = new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
    // Turn the triangle to stand across z, so the ridge runs along x.
    roof.rotateY(-Math.PI / 2);
    roof.translate(1, 0, 0);
    return roof;
  }
  shape.moveTo(0, 0);
  shape.lineTo(1, 0);
  shape.lineTo(0.5, 1);
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
}

/** Roof tiles: dark red-brown and slate-grey pantiles in courses, weathered. */
function roofTexture(): CanvasTexture {
  return canvasTexture(128, 128, (g) => {
    speckle(g, 128, 128, '#4a3430', 601);
    const random = seeded(607);
    for (let y = 0; y < 128; y += 8) {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(0, y, 128, 2);
      for (let x = (y / 8) % 2 ? 0 : 6; x < 128; x += 12) {
        g.fillStyle = `rgba(${random() < 0.5 ? '255,255,255' : '0,0,0'},${random() * 0.1})`;
        g.fillRect(x, y + 2, 11, 6);
      }
    }
  });
}

/**
 * A flag's cloth for a pole up the y axis from its bracket: 1.5 m by 1 m, its hoist along the
 * pole's top metre, flying out towards -x in soft folds and drooping a little.
 */
function flagGeometry(): BufferGeometry {
  const cloth = new PlaneGeometry(1.5, 1, 12, 4);
  const position = cloth.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const fly = position.getX(i) + 0.75;
    position.setXYZ(i, -fly, position.getY(i) + 1.9 - fly * 0.12, Math.sin(fly * 4.2) * 0.08 * fly);
  }
  cloth.computeVertexNormals();
  return cloth;
}

/** Amsterdam's flag (red, black, red, three white crosses on the black) or the Dutch tricolour. */
function flagTexture(amsterdam: boolean): CanvasTexture {
  return canvasTexture(192, 128, (g) => {
    if (amsterdam) {
      g.fillStyle = '#d2191e';
      g.fillRect(0, 0, 192, 128);
      g.fillStyle = '#111111';
      g.fillRect(0, 43, 192, 42);
      g.strokeStyle = '#ffffff';
      g.lineWidth = 6;
      for (const x of [56, 96, 136]) {
        g.beginPath();
        g.moveTo(x - 13, 51);
        g.lineTo(x + 13, 77);
        g.moveTo(x + 13, 51);
        g.lineTo(x - 13, 77);
        g.stroke();
      }
    } else {
      for (const [i, colour] of ['#ae1c28', '#ffffff', '#21468b'].entries()) {
        g.fillStyle = colour;
        g.fillRect(0, i * 43, 192, 43);
      }
    }
  });
}

/**
 * Someone sitting on a chair at a table, facing -z, dressed at random from the commuters'
 * wardrobe in vertex colours: legs bent at the knee, a torso upright, forearms on the table.
 */
function sitterGeometry(random: () => number): BufferGeometry {
  const pick = (list: readonly string[]) => new Color(list[Math.floor(random() * list.length)]!);
  const top = pick(COMMUTER_WEAR.tops);
  const bottom = pick(COMMUTER_WEAR.bottoms);
  const skin = pick(COMMUTER_WEAR.skins);
  const parts: [BufferGeometry, Color][] = [];
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  for (const side of [-0.1, 0.1]) {
    parts.push([limb(v(side, 0.5, 0.05), v(side, 0.52, -0.38), 0.075), bottom]);
    parts.push([limb(v(side, 0.52, -0.38), v(side, 0.05, -0.42), 0.06), bottom]);
    parts.push([limb(v(side * 2, 1.12, 0.02), v(side * 2.2, 0.82, -0.18), 0.045), top]);
    parts.push([limb(v(side * 2.2, 0.82, -0.18), v(side * 1.2, 0.8, -0.42), 0.04), top]);
  }
  const torso = new CapsuleGeometry(0.18, 0.4, 4, 8);
  torso.translate(0, 0.92, 0.04);
  const head = new SphereGeometry(0.11, 10, 8);
  head.translate(0, 1.36, 0.02);
  parts.push([torso.toNonIndexed(), top], [head.toNonIndexed(), skin]);
  const painted = parts.map(([geometry, colour]) => {
    const count = geometry.getAttribute('position').count;
    const colours = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colour.toArray(colours, i * 3);
    geometry.setAttribute('color', new BufferAttribute(colours, 3));
    return geometry;
  });
  const merged = mergeGeometries(painted)!;
  painted.forEach((p) => p.dispose());
  return merged;
}

/**
 * Someone standing, facing -z, dressed at random from the commuters' wardrobe in vertex
 * colours, arms hanging or, with `phone`, one forearm raised holding a phone up.
 */
function standerGeometry(random: () => number, phone: boolean): BufferGeometry {
  const pick = (list: readonly string[]) => new Color(list[Math.floor(random() * list.length)]!);
  const top = pick(COMMUTER_WEAR.tops);
  const bottom = pick(COMMUTER_WEAR.bottoms);
  const skin = pick(COMMUTER_WEAR.skins);
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const parts: [BufferGeometry, Color][] = [];
  for (const side of [-0.1, 0.1]) parts.push([limb(v(side, 0, 0), v(side, 0.9, 0), 0.075), bottom]);
  const torso = new CapsuleGeometry(0.19, 0.42, 4, 8);
  torso.translate(0, 1.15, 0);
  const head = new SphereGeometry(0.115, 10, 8);
  head.translate(0, 1.6, 0);
  parts.push([torso.toNonIndexed(), top], [head.toNonIndexed(), skin]);
  parts.push([limb(v(-0.24, 1.4, 0), v(-0.27, 0.85, 0.02), 0.045), top]);
  if (phone) {
    parts.push([limb(v(0.24, 1.4, 0), v(0.26, 1.18, -0.12), 0.045), top]);
    parts.push([limb(v(0.26, 1.18, -0.12), v(0.12, 1.45, -0.38), 0.04), top]);
    const handset = new BoxGeometry(0.08, 0.15, 0.015);
    handset.translate(0.1, 1.5, -0.4);
    parts.push([handset.toNonIndexed(), new Color('#1b1b1f')]);
  } else {
    parts.push([limb(v(0.24, 1.4, 0), v(0.27, 0.85, 0.02), 0.045), top]);
  }
  const painted = parts.map(([geometry, colour]) => {
    const count = geometry.getAttribute('position').count;
    const colours = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colour.toArray(colours, i * 3);
    geometry.setAttribute('color', new BufferAttribute(colours, 3));
    return geometry;
  });
  const merged = mergeGeometries(painted)!;
  painted.forEach((p) => p.dispose());
  return merged;
}

/** An awning's canvas: broad stripes of bottle green and cream. */
function awningTexture(): CanvasTexture {
  return canvasTexture(256, 64, (g) => {
    for (let x = 0; x < 256; x += 32) {
      g.fillStyle = (x / 32) % 2 ? '#f0e8d4' : '#1f4a32';
      g.fillRect(x, 0, 32, 64);
    }
  });
}

/** The antiques shop's board: its name in cream capitals on oxblood. */
function shopBoardTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = '#5a1a1a';
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#f0e8d4';
    g.font = 'bold 32px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ANTIEK &CURIOSA', 256, 34);
  });
}

/** A café's chalkboard: the day's soup, apple pie and drinks in chalk, in a wooden frame. */
function menuBoardTexture(): CanvasTexture {
  return canvasTexture(128, 192, (g) => {
    g.fillStyle = '#6a4a2e';
    g.fillRect(0, 0, 128, 192);
    g.fillStyle = '#1e2420';
    g.fillRect(8, 8, 112, 176);
    g.fillStyle = '#f2f2ea';
    g.textAlign = 'center';
    g.font = 'bold 16px serif';
    g.fillText('VANDAAG', 64, 34);
    g.font = '13px serif';
    g.fillText('erwtensoep', 64, 62);
    g.fillText('appeltaart', 64, 84);
    g.fillText('koffie', 64, 106);
    g.fillText('bier van de tap', 64, 128);
    g.fillStyle = '#e8c820';
    g.fillText('welkom!', 64, 162);
  });
}

/** A brown café's name board: gilt letters on dark green, in a gilt frame. */
function cafeBoardTexture(): CanvasTexture {
  return canvasTexture(512, 64, (g) => {
    g.fillStyle = '#1f3a2c';
    g.fillRect(0, 0, 512, 64);
    g.strokeStyle = '#c8a040';
    g.lineWidth = 4;
    g.strokeRect(6, 6, 500, 52);
    g.fillStyle = '#d8b050';
    g.font = 'bold 34px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('CAFÉ DE GRACHT', 256, 34);
  });
}

/**
 * A scooter along z, its front towards -z: small wheels, a rounded body over the rear wheel,
 * a floorboard, a leg shield rising to the headset and handlebars, and a dual seat.
 */
function scooterGeometry(): { body: BufferGeometry; wheels: BufferGeometry; seat: BufferGeometry } {
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  const rear = new CapsuleGeometry(0.22, 0.45, 4, 10);
  rear.rotateX(Math.PI / 2);
  rear.scale(1, 0.9, 1);
  rear.translate(0, 0.48, 0.38);
  const board = new BoxGeometry(0.3, 0.06, 0.6);
  board.translate(0, 0.26, -0.15);
  const shield = new BoxGeometry(0.42, 0.62, 0.08);
  shield.rotateX(0.2);
  shield.translate(0, 0.6, -0.5);
  const fender = new SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  fender.scale(0.8, 0.9, 1.2);
  fender.translate(0, 0.28, -0.62);
  const stem = new CylinderGeometry(0.03, 0.03, 0.5, 6);
  stem.translate(0, 0.95, -0.5);
  const bars = new BoxGeometry(0.62, 0.05, 0.08);
  bars.translate(0, 1.18, -0.48);
  const lamp = new SphereGeometry(0.07, 8, 6);
  lamp.translate(0, 1.15, -0.56);
  const body = merge([rear, board, shield, fender, stem, bars, lamp]);
  const wheels = merge(
    [0.48, -0.62].map((z) => {
      const wheel = new CylinderGeometry(0.2, 0.2, 0.1, 14);
      wheel.rotateZ(Math.PI / 2);
      wheel.translate(0, 0.2, z);
      return wheel;
    }),
  );
  const cushion = new CapsuleGeometry(0.13, 0.5, 3, 8);
  cushion.rotateX(Math.PI / 2);
  cushion.scale(1, 0.5, 1);
  cushion.translate(0, 0.74, 0.3);
  return { body, wheels, seat: merge([cushion]) };
}

/** An upright Dutch bike, along z: two wheels, its frame, saddle and swept-back bars. */
function bikeGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  for (const z of [-0.55, 0.55]) {
    const wheel = new TorusGeometry(0.34, 0.025, 4, 18);
    wheel.rotateY(Math.PI / 2);
    wheel.translate(0, 0.36, z);
    parts.push(wheel);
  }
  const tube = (length: number, x: number, y: number, z: number, tilt: number) => {
    const t = new CylinderGeometry(0.025, 0.025, length, 5);
    t.rotateX(tilt);
    t.translate(x, y, z);
    parts.push(t);
  };
  tube(0.95, 0, 0.62, 0, Math.PI / 2 - 0.35);
  tube(0.6, 0, 0.62, -0.05, 0.25);
  tube(0.7, 0, 0.7, 0.45, -0.2);
  tube(0.55, 0, 0.75, -0.52, 0.2);
  const saddle = new BoxGeometry(0.14, 0.05, 0.26);
  saddle.translate(0, 0.98, 0.25);
  const bars = new BoxGeometry(0.5, 0.03, 0.03);
  bars.translate(0, 1.05, -0.5);
  parts.push(saddle, bars);
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * A humpback bridge's arch in the x-y plane, spanning the canal from the quay at x 0 to the far
 * quay at x CANAL, extruded 7 m along z.
 */
function bridgeGeometry(): BufferGeometry {
  const steps = 24;
  const top = (u: number) => KERB + 1.4 * Math.sin((Math.PI * u) / CANAL);
  const shape = new Shape();
  shape.moveTo(0, -WATER);
  shape.lineTo(0, top(0));
  for (let k = 1; k <= steps; k++) shape.lineTo((k / steps) * CANAL, top((k / steps) * CANAL));
  shape.lineTo(CANAL, -WATER);
  const span = CANAL - 8;
  for (let k = 0; k <= steps; k++) {
    const u = CANAL - 4 - (k / steps) * span;
    shape.lineTo(u, -WATER + 2.9 * Math.sin((Math.PI * (CANAL - 4 - u)) / span));
  }
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: 7, bevelEnabled: false });
  geometry.translate(0, 0, -3.5);
  return geometry;
}

/**
 * The stone ring round a bridge's arch on both faces: a band of voussoirs 0.45 m deep following
 * the opening's curve, standing a little proud, with a taller keystone at the crown, and the
 * coping along the deck's two edges.
 */
function archRing(): BufferGeometry {
  const span = CANAL - 8;
  const opening = (u: number) => -WATER + 2.9 * Math.sin((Math.PI * (u - 4)) / span);
  const shape = new Shape();
  const steps = 24;
  shape.moveTo(4 - 0.45, -WATER);
  for (let k = 0; k <= steps; k++) {
    const u = 4 + (k / steps) * span;
    const y = opening(u) + 0.45;
    if (k === 0) shape.lineTo(4 - 0.45, y);
    shape.lineTo(u, y);
  }
  shape.lineTo(CANAL - 4 + 0.45, -WATER);
  shape.lineTo(CANAL - 4, -WATER);
  for (let k = steps; k >= 0; k--) {
    const u = 4 + (k / steps) * span;
    shape.lineTo(u, opening(u));
  }
  shape.closePath();
  const parts: BufferGeometry[] = [];
  for (const z of [-3.62, 3.52]) {
    const ring = new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
    ring.translate(0, 0, z);
    parts.push(ring.toNonIndexed());
    const key = new BoxGeometry(0.5, 0.75, 0.14);
    key.translate(CANAL / 2, opening(CANAL / 2) + 0.3, z + 0.05);
    parts.push(key.toNonIndexed());
  }
  const top = (u: number) => KERB + 1.4 * Math.sin((Math.PI * u) / CANAL);
  for (const z of [-3.5, 3.5]) {
    for (let k = 0; k < 20; k++) {
      const u0 = (k / 20) * CANAL;
      const u1 = ((k + 1) / 20) * CANAL;
      parts.push(limb(new Vector3(u0, top(u0), z), new Vector3(u1, top(u1), z), 0.12));
    }
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** Bulbs along both faces of a bridge's arch, following the opening's curve. */
function archBulbs(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const span = CANAL - 8;
  for (let k = 0; k <= 30; k++) {
    const u = 4 + (k / 30) * span;
    const y = -WATER + 2.9 * Math.sin((Math.PI * (u - 4)) / span) + 0.1;
    for (const z of [-3.55, 3.55]) {
      const bulb = new SphereGeometry(0.05, 5, 4);
      bulb.translate(u, y, z);
      parts.push(bulb);
    }
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * A bridge's iron railing along the arch's top, from x 0 to CANAL: a handrail and a bottom rail
 * following the hump, with balusters between them and a ring in every bay.
 */
function bridgeRailing(): BufferGeometry {
  const top = (u: number) => KERB + 1.4 * Math.sin((Math.PI * u) / CANAL);
  const parts: BufferGeometry[] = [];
  const steps = 40;
  for (let k = 0; k < steps; k++) {
    const u0 = (k / steps) * CANAL;
    const u1 = ((k + 1) / steps) * CANAL;
    for (const lift of [0.15, 1.0]) {
      const a = new Vector3(u0, top(u0) + lift, 0);
      const b = new Vector3(u1, top(u1) + lift, 0);
      parts.push(limb(a, b, lift > 0.5 ? 0.04 : 0.025));
    }
  }
  for (let u = 0.6; u < CANAL - 0.5; u += 0.22) {
    const post = new BoxGeometry(0.022, 0.85, 0.022);
    post.translate(u, top(u) + 0.575, 0);
    parts.push(post.toNonIndexed());
  }
  for (let u = 1.2; u < CANAL - 1; u += 1.5) {
    const ring = new TorusGeometry(0.2, 0.015, 4, 12);
    ring.translate(u, top(u) + 0.58, 0);
    parts.push(ring.toNonIndexed());
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * An elm: a grey-brown trunk forking at 3.5 m into limbs that arch up and out, and an airy,
 * vase-shaped crown of leaf sprays, crossed cards of foliage, clustered at the limbs' ends.
 */
function elmGeometry(seed: number): { wood: BufferGeometry; leaves: BufferGeometry } {
  const random = seeded(seed);
  const wood: BufferGeometry[] = [];
  const sprays: BufferGeometry[] = [];
  const trunk = new CylinderGeometry(0.22, 0.32, 3.8, 8);
  trunk.translate(0, 1.9, 0);
  wood.push(trunk);
  const limbs = 4 + Math.floor(random() * 2);
  for (let l = 0; l < limbs; l++) {
    const a = (l / limbs) * Math.PI * 2 + random() * 0.6;
    const lean = 0.35 + random() * 0.3;
    const length = 5 + random() * 1.5;
    const limb = new CylinderGeometry(0.08, 0.17, length, 6);
    limb.translate(0, length / 2, 0);
    limb.rotateZ(lean);
    limb.rotateY(a);
    limb.translate(0, 3.5, 0);
    wood.push(limb);
    // The limb's end, where its spray of leaves gathers.
    const reach = Math.sin(lean) * length;
    const tipX = -Math.cos(a) * reach;
    const tipZ = Math.sin(a) * reach;
    const tipY = 3.5 + Math.cos(lean) * length;
    for (let c = 0; c < 9; c++) {
      const card = new PlaneGeometry(2.2, 2.2);
      card.rotateY(random() * Math.PI);
      card.rotateX((random() - 0.5) * 0.9);
      card.translate(
        tipX * (0.55 + random() * 0.6) + (random() - 0.5) * 2.2,
        tipY - 1.2 + random() * 3,
        tipZ * (0.55 + random() * 0.6) + (random() - 0.5) * 2.2,
      );
      sprays.push(card);
    }
  }
  // The crown's top, filling in over the limbs.
  for (let c = 0; c < 10; c++) {
    const card = new PlaneGeometry(2.4, 2.4);
    card.rotateY(random() * Math.PI);
    card.rotateX((random() - 0.5) * 0.8);
    card.translate((random() - 0.5) * 4, 9.5 + random() * 2, (random() - 0.5) * 4);
    sprays.push(card);
  }
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  return { wood: merge(wood), leaves: merge(sprays) };
}

/** A spray of spring elm leaves, fresh green with lighter tips, on clear ground. */
function leafTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.clearRect(0, 0, 512, 512);
    g.scale(2, 2);
    const random = seeded(471);
    // The twigs first, so the leaves hide most of them.
    g.strokeStyle = '#3a3428';
    for (let i = 0; i < 9; i++) {
      g.lineWidth = 1 + random() * 1.5;
      g.beginPath();
      g.moveTo(128 + (random() - 0.5) * 30, 250);
      g.quadraticCurveTo(
        128 + (random() - 0.5) * 120,
        150,
        128 + (random() - 0.5) * 220,
        30 + random() * 120,
      );
      g.stroke();
    }
    // Leaves in clusters: shaded deep green where the spray turns in on itself, fresh yellow-
    // green where it catches the light from above, each leaf a pointed oval with its midrib.
    for (let c = 0; c < 34; c++) {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * 100;
      const cx = 128 + Math.cos(a) * r;
      const cy = 128 + Math.sin(a) * r * 0.9;
      for (let i = 0; i < 26; i++) {
        const x = cx + (random() - 0.5) * 34;
        const y = cy + (random() - 0.5) * 30;
        const lit = (cy - y) / 30 + 0.5 + (128 - y) / 300;
        const light = Math.max(0, Math.min(1, lit + (random() - 0.5) * 0.5));
        const shade = Math.round(70 + light * 90);
        g.fillStyle = `rgb(${Math.round(shade * 0.62)},${shade + 20},${Math.round(shade * 0.38)})`;
        const turn = random() * Math.PI;
        const length = 6 + random() * 4;
        g.beginPath();
        g.ellipse(x, y, length, length * 0.5, turn, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(30,40,20,0.35)';
        g.lineWidth = 0.6;
        g.beginPath();
        g.moveTo(x - Math.cos(turn) * length, y - Math.sin(turn) * length);
        g.lineTo(x + Math.cos(turn) * length, y + Math.sin(turn) * length);
        g.stroke();
      }
    }
    // May's elm seeds still hang in pale yellow-green clusters among the new leaves.
    for (let c = 0; c < 14; c++) {
      const cx = 128 + (random() - 0.5) * 190;
      const cy = 128 + (random() - 0.5) * 170;
      for (let i = 0; i < 14; i++) {
        g.fillStyle = `rgba(${170 + random() * 25},${195 + random() * 20},${110 + random() * 30},0.95)`;
        g.beginPath();
        g.arc(
          cx + (random() - 0.5) * 14,
          cy + (random() - 0.5) * 12,
          2.2 + random() * 1.2,
          0,
          Math.PI * 2,
        );
        g.fill();
      }
    }
  });
}

/** Elm bark: grey-brown, in long ridges. */
function barkTexture(): CanvasTexture {
  return canvasTexture(64, 128, (g) => {
    speckle(g, 64, 128, '#4e463d', 473);
    const random = seeded(477);
    g.fillStyle = 'rgba(20,16,12,0.45)';
    for (let i = 0; i < 18; i++) g.fillRect(random() * 64, 0, 1 + random() * 2, 128);
  });
}

/**
 * The pavement before the houses: grey concrete tiles 30 cm square, each its own shade, a few
 * stained or cracked, in dark joints.
 */
function pavementTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    const random = seeded(541);
    g.fillStyle = '#4a4a48';
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 64) {
      for (let x = 0; x < 256; x += 64) {
        const v = 128 + Math.floor(random() * 30);
        g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
        g.fillRect(x + 2, y + 2, 60, 60);
        for (let k = 0; k < 40; k++) {
          g.fillStyle = `rgba(0,0,0,${random() * 0.08})`;
          g.fillRect(x + 2 + random() * 58, y + 2 + random() * 58, 2, 2);
        }
        if (random() < 0.15) {
          g.fillStyle = 'rgba(40,34,28,0.18)';
          g.beginPath();
          g.ellipse(
            x + 32,
            y + 32,
            10 + random() * 14,
            8 + random() * 10,
            random(),
            0,
            Math.PI * 2,
          );
          g.fill();
        }
        if (random() < 0.1) {
          g.strokeStyle = 'rgba(30,30,30,0.5)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x + 2, y + 10 + random() * 40);
          g.lineTo(x + 62, y + 10 + random() * 40);
          g.stroke();
        }
      }
    }
  });
}

/**
 * A gutter's strip 0.6 m across and 12 m along: elm seeds, pale green-gold paper discs, drifted
 * thickest against the kerb (at u 0, or at u 1 unless `kerbFirst`), and with `grates` a cast-iron
 * gully grate at the kerb, on clear ground.
 */
function gutterTexture(kerbFirst: boolean, grates: boolean): CanvasTexture {
  return canvasTexture(64, 1024, (g) => {
    g.clearRect(0, 0, 64, 1024);
    if (!kerbFirst) g.setTransform(-1, 0, 0, 1, 64, 0);
    const random = seeded(grates ? 661 : 667);
    const seeds = ['#e8e4b0', '#d8d8a0', '#c8c888', '#f0e8c0', '#b8b878'];
    for (let i = 0; i < 4200; i++) {
      const u = Math.pow(random(), 2.6) * 64;
      g.fillStyle = seeds[Math.floor(random() * seeds.length)]!;
      g.globalAlpha = 0.65 + random() * 0.35;
      g.beginPath();
      g.ellipse(
        u,
        random() * 1024,
        1.6 + random(),
        1.3 + random() * 0.8,
        random() * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    g.globalAlpha = 1;
    if (grates) {
      g.fillStyle = '#262422';
      g.fillRect(2, 470, 26, 42);
      g.fillStyle = '#0e0e0e';
      for (let y = 474; y < 508; y += 6) g.fillRect(5, y, 20, 3);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  });
}

/**
 * A Dutch traffic sign's face: the blue one-way sign with its white arrow over the plate
 * excepting cyclists, the zone sign for 30 km/h, or the blue parking sign for permit holders.
 */
function signTexture(kind: 'oneway' | 'thirty' | 'parking'): CanvasTexture {
  return canvasTexture(128, kind === 'parking' ? 192 : 128, (g) => {
    const h = kind === 'parking' ? 192 : 128;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, h);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (kind === 'oneway') {
      g.fillStyle = '#1d4f9c';
      g.fillRect(6, 6, 116, 80);
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.moveTo(20, 40);
      g.lineTo(80, 40);
      g.lineTo(80, 26);
      g.lineTo(108, 46);
      g.lineTo(80, 66);
      g.lineTo(80, 52);
      g.lineTo(20, 52);
      g.closePath();
      g.fill();
      g.fillStyle = '#111111';
      g.font = 'bold 15px sans-serif';
      g.fillText('uitgezonderd', 64, 100);
      // A bicycle, drawn as the plate shows it.
      g.strokeStyle = '#111111';
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(50, 117, 6, 0, Math.PI * 2);
      g.arc(78, 117, 6, 0, Math.PI * 2);
      g.moveTo(50, 117);
      g.lineTo(60, 108);
      g.lineTo(72, 108);
      g.lineTo(78, 117);
      g.moveTo(60, 108);
      g.lineTo(64, 117);
      g.lineTo(72, 108);
      g.stroke();
    } else if (kind === 'thirty') {
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(64, 64, 58, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#d2191e';
      g.lineWidth = 12;
      g.beginPath();
      g.arc(64, 64, 52, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#111111';
      g.font = 'bold 54px sans-serif';
      g.fillText('30', 64, 68);
    } else {
      g.fillStyle = '#1d4f9c';
      g.fillRect(6, 6, 116, 110);
      g.fillStyle = '#ffffff';
      g.font = 'bold 84px sans-serif';
      g.fillText('P', 64, 66);
      g.fillStyle = '#111111';
      g.font = 'bold 15px sans-serif';
      g.fillText('vergunning-', 64, 140);
      g.fillText('houders', 64, 162);
    }
  });
}

/** Foam on clear ground, thick at one end and breaking up and fading towards the other. */
function foamTexture(): CanvasTexture {
  return canvasTexture(64, 512, (g) => {
    g.clearRect(0, 0, 64, 512);
    const random = seeded(761);
    for (let i = 0; i < 1600; i++) {
      const y = Math.pow(random(), 1.6) * 512;
      const fade = 1 - y / 512;
      g.fillStyle = `rgba(240,246,248,${(0.25 + random() * 0.5) * fade})`;
      g.beginPath();
      g.ellipse(random() * 64, y, 1 + random() * 3, 1 + random() * 5, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** A utility cabinet's door: grey-green steel, its seams and lock, and stickers slapped on. */
function cabinetTexture(): CanvasTexture {
  return canvasTexture(128, 160, (g) => {
    speckle(g, 128, 160, '#6e7a72', 791);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(63, 0, 2, 160);
    g.fillRect(4, 4, 120, 2);
    g.fillStyle = '#2a2a2a';
    g.fillRect(70, 76, 6, 10);
    const random = seeded(797);
    const colours = ['#f2f2ee', '#e8c820', '#d8282e', '#2c7be5', '#1b1b1f', '#7ac04a'];
    for (let i = 0; i < 14; i++) {
      g.fillStyle = colours[Math.floor(random() * colours.length)]!;
      const w = 10 + random() * 22;
      const h = 8 + random() * 16;
      g.save();
      g.translate(10 + random() * 100, 20 + random() * 120);
      g.rotate((random() - 0.5) * 0.6);
      g.fillRect(-w / 2, -h / 2, w, h);
      g.restore();
    }
    g.strokeStyle = 'rgba(20,20,20,0.7)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(20, 130);
    g.bezierCurveTo(40, 100, 60, 150, 90, 118);
    g.stroke();
  });
}

/** A taxi's roof sign: TAXI in black on yellow. */
function taxiTexture(): CanvasTexture {
  return canvasTexture(128, 32, (g) => {
    g.fillStyle = '#f2c418';
    g.fillRect(0, 0, 128, 32);
    g.fillStyle = '#111111';
    g.font = 'bold 24px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('TAXI', 64, 17);
  });
}

/** An estate agent's board: TE KOOP in white capitals on orange, the agent's line below. */
function saleBoardTexture(): CanvasTexture {
  return canvasTexture(128, 96, (g) => {
    g.fillStyle = '#f07a1a';
    g.fillRect(0, 0, 128, 96);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 30px sans-serif';
    g.fillText('TE KOOP', 64, 40);
    g.fillRect(14, 64, 100, 3);
    g.font = '12px sans-serif';
    g.fillText('makelaardij', 64, 80);
  });
}

/** Granite kerbstones: speckled grey, laid in lengths with fine joints. */
function kerbTexture(): CanvasTexture {
  return canvasTexture(64, 256, (g) => {
    speckle(g, 64, 256, '#9a9894', 547);
    g.fillStyle = 'rgba(30,30,30,0.5)';
    for (let y = 0; y < 256; y += 128) g.fillRect(0, y, 64, 2);
  });
}

/** A cumulus cloud on clear ground: billowing white heads over a flat, grey-shaded base. */
function cloudTexture(seed: number): CanvasTexture {
  return canvasTexture(512, 256, (g) => {
    g.clearRect(0, 0, 512, 256);
    const random = seeded(seed);
    for (let i = 0; i < 90; i++) {
      const x = 60 + random() * 392;
      const rise = Math.sin(((x - 60) / 392) * Math.PI);
      const y = 190 - random() * 120 * rise;
      const r = 18 + random() * 34 * (0.5 + rise);
      const puff = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
      const shade = Math.min(250, Math.round(228 + (190 - y) * 0.25));
      puff.addColorStop(0, 'rgba(255,255,255,0.95)');
      puff.addColorStop(0.6, `rgba(${shade},${shade},${Math.min(255, shade + 6)},0.7)`);
      puff.addColorStop(1, 'rgba(220,226,234,0)');
      g.fillStyle = puff;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // The flat base, shaded grey.
    const base = g.createLinearGradient(0, 170, 0, 215);
    base.addColorStop(0, 'rgba(170,180,194,0)');
    base.addColorStop(1, 'rgba(160,170,186,0.35)');
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = base;
    g.fillRect(0, 170, 512, 50);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = 'rgba(0,0,0,1)';
    g.fillRect(0, 212, 512, 44);
    g.globalCompositeOperation = 'source-over';
  });
}

/**
 * A canal house's flank, 11.5 m deep and up to its eaves, as a cross street sees it: dark brick
 * courses with a few small-paned windows in white frames, staggered up the wall as the stairs
 * and back rooms need them, and iron wall anchors.
 */
function flankTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    speckle(g, 512, 512, '#5a3326', 683);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < 512; y += 5) g.fillRect(0, y, 512, 1);
    const random = seeded(691);
    for (let row = 0; row < 4; row++) {
      for (const x of [70, 230, 390]) {
        if (random() < 0.35) continue;
        const y = 40 + row * 112 + (random() - 0.5) * 20;
        sashWindow(g, x, y, 48, 70, random);
      }
      g.fillStyle = '#16181b';
      g.fillRect(14, 30 + row * 112, 6, 18);
      g.fillRect(492, 30 + row * 112, 6, 18);
    }
  });
}

/** Cirrus on clear ground: fine combed streaks, brightest along the middle, frayed at the ends. */
function cirrusTexture(): CanvasTexture {
  return canvasTexture(512, 96, (g) => {
    g.clearRect(0, 0, 512, 96);
    const random = seeded(877);
    for (let i = 0; i < 160; i++) {
      const y = 48 + (random() - 0.5) * 50;
      const x = random() * 380;
      const length = 60 + random() * 160;
      const fade = 1 - Math.abs(y - 48) / 30;
      const stroke = g.createLinearGradient(x, 0, x + length, 0);
      stroke.addColorStop(0, 'rgba(255,255,255,0)');
      stroke.addColorStop(0.5, `rgba(255,255,255,${0.18 * Math.max(0, fade)})`);
      stroke.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = stroke;
      g.lineWidth = 1 + random() * 3;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(
        x + length / 2,
        y - 6 + random() * 12,
        x + length,
        y + (random() - 0.5) * 10,
      );
      g.stroke();
    }
  });
}

/** Dark red-brown canal-wall brick in stretcher bond. */
function brickTexture(): CanvasTexture {
  return canvasTexture(256, 256, (g) => {
    speckle(g, 256, 256, '#6a3a2a', 487);
    g.fillStyle = 'rgba(40,30,24,0.5)';
    for (let y = 0; y < 256; y += 16) {
      g.fillRect(0, y, 256, 2);
      for (let x = (y / 16) % 2 ? 0 : 16; x < 256; x += 32) g.fillRect(x, y, 2, 16);
    }
  });
}

/**
 * The canal's olive-green water, ruffled by the breeze: small wavelets catching the sky on their
 * near faces and dark in their troughs, in patches calmer and rougher.
 */
function waterTexture(): CanvasTexture {
  return canvasTexture(512, 512, (g) => {
    g.fillStyle = '#3a4636';
    g.fillRect(0, 0, 512, 512);
    const random = seeded(491);
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(${random() < 0.5 ? '20,30,24' : '90,110,100'},0.12)`;
      g.beginPath();
      g.ellipse(
        random() * 512,
        random() * 512,
        40 + random() * 90,
        60 + random() * 120,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    g.lineCap = 'round';
    for (let i = 0; i < 2600; i++) {
      const x = random() * 512;
      const y = random() * 512;
      const length = 4 + random() * 10;
      g.strokeStyle = `rgba(205,222,236,${0.06 + random() * 0.2})`;
      g.lineWidth = 1 + random();
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 1.5, y + length / 2, x, y + length);
      g.stroke();
      g.strokeStyle = 'rgba(12,18,14,0.18)';
      g.beginPath();
      g.moveTo(x + 2, y);
      g.lineTo(x + 2, y + length);
      g.stroke();
    }
  });
}

/**
 * A canal wall's face, across from the quay down to the water (or, with `waterFirst`, up from
 * it): dark red-brown brick courses, wet and darkening downward into a band of green algae and
 * black slime at the waterline, with lime streaks running down from the joints.
 */
function canalWallTexture(waterFirst: boolean): CanvasTexture {
  return canvasTexture(128, 256, (g) => {
    if (waterFirst) g.setTransform(-1, 0, 0, 1, 128, 0);
    speckle(g, 128, 256, '#6a3a2a', 493);
    const random = seeded(497);
    g.fillStyle = 'rgba(40,30,24,0.55)';
    for (let x = 0; x < 128; x += 10) {
      g.fillRect(x, 0, 2, 256);
      for (let y = (x / 10) % 2 ? 0 : 12; y < 256; y += 24) g.fillRect(x, y, 10, 2);
    }
    g.fillStyle = 'rgba(232,228,214,0.18)';
    for (let i = 0; i < 14; i++) g.fillRect(random() * 60, random() * 256, 30 + random() * 40, 2);
    const wet = g.createLinearGradient(0, 0, 128, 0);
    wet.addColorStop(0, 'rgba(0,0,0,0)');
    wet.addColorStop(0.55, 'rgba(10,12,8,0.25)');
    wet.addColorStop(0.75, 'rgba(46,70,30,0.7)');
    wet.addColorStop(0.9, 'rgba(30,44,20,0.85)');
    wet.addColorStop(1, 'rgba(12,16,10,0.95)');
    g.fillStyle = wet;
    g.fillRect(0, 0, 128, 256);
    g.setTransform(1, 0, 0, 1, 0, 0);
  });
}

/**
 * A houseboat cabin's side: weatherboarding, painted over by the material's colour, and a row of
 * wide windows in white frames with the sky in their glass.
 */
function cabinTexture(): CanvasTexture {
  return canvasTexture(512, 128, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 512, 2);
    for (let x = 24; x < 512; x += 84) {
      g.fillStyle = '#f6f4ee';
      g.fillRect(x - 4, 26, 60, 60);
      const glass = g.createLinearGradient(0, 30, 0, 82);
      glass.addColorStop(0, '#9ab4c8');
      glass.addColorStop(1, '#1e2830');
      g.fillStyle = glass;
      g.fillRect(x, 30, 52, 52);
      g.fillStyle = '#f6f4ee';
      g.fillRect(x + 25, 30, 3, 52);
    }
  });
}

/** A barge's steel hull, 4.2 m wide and `length` long on z, its bow pointed towards -z. */
function bargeHull(length: number): BufferGeometry {
  const shape = new Shape();
  shape.moveTo(-2.1, length / 2);
  shape.lineTo(2.1, length / 2);
  shape.lineTo(2.1, -length / 2 + 3);
  shape.quadraticCurveTo(1.6, -length / 2 + 0.6, 0, -length / 2);
  shape.quadraticCurveTo(-1.6, -length / 2 + 0.6, -2.1, -length / 2 + 3);
  shape.closePath();
  const hull = new ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: false });
  hull.rotateX(Math.PI / 2);
  hull.translate(0, 1.4, 0);
  return hull;
}

/** The width of the cross street that runs off the gracht at each bridge. */
const CROSS = 9;

/** The metres along the loop at which the cross street at metre `m` ends, or null if none. */
function bridgeGap(m: number): number | null {
  for (let b = 0; b <= LOOP; b += BRIDGE) {
    if (m >= b + 2 - CROSS / 2 && m < b + 2 + CROSS / 2) return b + 2 + CROSS / 2;
  }
  return null;
}

/** Where the next cross street after metre `m` begins (or the loop ends). */
function nextGap(m: number): number {
  for (let b = 0; b <= LOOP; b += BRIDGE) {
    if (b + 2 - CROSS / 2 > m) return Math.min(b + 2 - CROSS / 2, LOOP);
  }
  return LOOP;
}

/** The house kinds: four gables, then the Herengracht's wide houses with a straight cornice. */
const GABLES = ['step', 'bell', 'neck', 'spout', 'cornice'] as const;
type Gable = (typeof GABLES)[number];
/** Dark brick, oxblood, soot-black, red-brown, painted render, sandstone and green-grey fronts. */
const FRONTS = [
  '#3a2a24',
  '#5a3326',
  '#2a2a2e',
  '#6b4030',
  '#e8e2d4',
  '#4a3a30',
  '#c9b79a',
  '#2f3a34',
  '#7a4a36',
];
/** The sandstone and limestone of the Herengracht's mansions, and one in grey render. */
const STONE = ['#d9cfb8', '#cfc4a8', '#e6dccb', '#b8b4ac', '#c8bca2'];
/** How many fronts are drawn for each kind of house. */
const VARIANTS = 5;
/** Where the front's eaves (or cornice) line sits, as a share of the house's height. */
const EAVES = 0.74;

/**
 * Where a gable's sandstone ornaments sit on its 1 × 1 outline (matching traceFront), and
 * whether each is an urn rather than a ball finial.
 */
const FINIALS: Record<Gable, readonly (readonly [number, number, boolean])[]> = {
  step: [0, 1, 2, 3].flatMap((s) => {
    const y = EAVES + ((s + 1) * (1 - EAVES)) / 5;
    return [
      [s * 0.085, y, false],
      [1 - s * 0.085, y, false],
    ] as const;
  }),
  bell: [
    [0.5, 1, true],
    [0.03, EAVES, false],
    [0.97, EAVES, false],
  ],
  neck: [
    [0.18, EAVES + 0.035, true],
    [0.82, EAVES + 0.035, true],
    [0.5, 0.99, true],
  ],
  spout: [[0.5, 1, false]],
  cornice: [
    [0.08, EAVES + 0.07, true],
    [0.92, EAVES + 0.07, true],
    [0.5, EAVES + 0.105, true],
  ],
};

/** Anything that can trace an outline: a Shape or a canvas. */
interface Pen {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
}

/**
 * Traces a house's front, 1 wide and 1 tall with y up, up its left side, over its gable and down
 * its right side; the caller closes it along the ground.
 */
function traceFront(pen: Pen, kind: Gable): void {
  const e = EAVES;
  pen.moveTo(0, 0);
  pen.lineTo(0, e);
  if (kind === 'step') {
    const rise = (1 - e) / 5;
    let x = 0;
    let y = e;
    for (let s = 0; s < 4; s++) {
      pen.lineTo(x, y + rise);
      x += 0.085;
      y += rise;
      pen.lineTo(x, y);
    }
    pen.lineTo(x, 1);
    pen.lineTo(1 - x, 1);
    for (let s = 0; s < 4; s++) {
      pen.lineTo(1 - x, y);
      y -= rise;
      x -= 0.085;
      pen.lineTo(1 - x, y + rise);
    }
    pen.lineTo(1, e);
  } else if (kind === 'bell') {
    pen.bezierCurveTo(0.08, e + 0.02, 0.24, e + 0.06, 0.26, e + 0.13);
    pen.bezierCurveTo(0.27, e + 0.22, 0.38, 0.99, 0.5, 1);
    pen.bezierCurveTo(0.62, 0.99, 0.73, e + 0.22, 0.74, e + 0.13);
    pen.bezierCurveTo(0.76, e + 0.06, 0.92, e + 0.02, 1, e);
  } else if (kind === 'neck') {
    pen.quadraticCurveTo(0.2, e + 0.01, 0.28, e + 0.08);
    pen.lineTo(0.3, 0.95);
    pen.quadraticCurveTo(0.5, 1.04, 0.7, 0.95);
    pen.lineTo(0.72, e + 0.08);
    pen.quadraticCurveTo(0.8, e + 0.01, 1, e);
  } else if (kind === 'spout') {
    pen.lineTo(0.42, 0.97);
    pen.lineTo(0.5, 1);
    pen.lineTo(0.58, 0.97);
    pen.lineTo(1, e);
  } else {
    const top = e + 0.07;
    pen.lineTo(0, top);
    pen.lineTo(0.36, top);
    pen.quadraticCurveTo(0.5, top + 0.1, 0.64, top);
    pen.lineTo(1, top);
  }
  pen.lineTo(1, 0);
}

/**
 * A tall sash window in its white frame: the sky and the street's far side caught in the upper
 * panes, the room behind showing through the lower ones (a lamp, a bookcase, a plant on the sill
 * or a half net curtain), and glazing bars in the frame's paint dividing it into twelve lights.
 */
function sashWindow(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  tall: number,
  random: () => number,
  frame = '#f6f4ee',
): void {
  g.fillStyle = frame;
  g.fillRect(x - 4, y - 4, width + 8, tall + 8);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x - 4, y + tall + 4, width + 8, 3);
  // The room behind.
  const room = g.createLinearGradient(0, y, 0, y + tall);
  room.addColorStop(0, '#2a3138');
  room.addColorStop(1, '#161a1e');
  g.fillStyle = room;
  g.fillRect(x, y, width, tall);
  const inside = random();
  if (inside < 0.2) {
    g.fillStyle = 'rgba(255,214,150,0.55)';
    g.beginPath();
    g.arc(x + width * (0.3 + random() * 0.4), y + tall * 0.45, width * 0.16, 0, Math.PI * 2);
    g.fill();
  } else if (inside < 0.4) {
    for (let b = 0; b < 4; b++) {
      g.fillStyle = ['#5a3a2a', '#3a4a5a', '#6a5a3a', '#4a2a2a'][b]!;
      g.fillRect(x + 3 + b * (width / 4), y + tall * 0.55, width / 5, tall * 0.4);
    }
  } else if (inside < 0.6) {
    g.fillStyle = 'rgba(240,240,236,0.75)';
    g.fillRect(x, y + tall * 0.5, width, tall * 0.5);
  }
  if (random() < 0.35) {
    g.fillStyle = '#3f6a2a';
    g.beginPath();
    g.ellipse(x + width * (0.25 + random() * 0.5), y + tall - 6, 7, 7, 0, 0, Math.PI * 2);
    g.fill();
  }
  // The sky and the far side, caught in the glass, strongest high up.
  const sky = g.createLinearGradient(x, y, x + width * 0.6, y + tall * 0.7);
  sky.addColorStop(0, 'rgba(200,220,236,0.75)');
  sky.addColorStop(0.55, 'rgba(160,184,204,0.3)');
  sky.addColorStop(1, 'rgba(160,184,204,0)');
  g.fillStyle = sky;
  g.fillRect(x, y, width, tall);
  // The glazing bars: two sashes of six lights. Now and then the lower sash is pushed up to
  // let the spring in, the opening dark and a white curtain blowing out of it.
  const open = random() < 0.1;
  g.fillStyle = frame;
  if (open) {
    g.fillStyle = '#0e1114';
    g.fillRect(x, y + tall * 0.62, width, tall * 0.38);
    g.fillStyle = 'rgba(244,244,238,0.85)';
    g.beginPath();
    g.moveTo(x + 2, y + tall * 0.62);
    g.quadraticCurveTo(x + width * 0.3, y + tall * 0.85, x + width * 0.15, y + tall);
    g.lineTo(x + 2, y + tall);
    g.closePath();
    g.fill();
    g.fillStyle = frame;
    g.fillRect(x, y + tall * 0.6, width, 4);
  }
  g.fillRect(x, y + tall / 2 - 2, width, 4);
  g.fillRect(x + width / 2 - 1.2, y, 2.4, open ? tall * 0.62 : tall);
  g.fillRect(x, y + tall / 4 - 1, width, 2);
  if (!open) g.fillRect(x, y + (tall * 3) / 4 - 1, width, 2);
  // A cat sitting on the sill inside, watching the street.
  if (!open && random() < 0.05) {
    g.fillStyle = '#16120f';
    g.beginPath();
    g.ellipse(x + width * 0.7, y + tall - 7, 6, 8, 0, 0, Math.PI * 2);
    g.ellipse(x + width * 0.7, y + tall - 17, 4.5, 4.5, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(x + width * 0.7 - 4, y + tall - 19);
    g.lineTo(x + width * 0.7 - 3, y + tall - 25);
    g.lineTo(x + width * 0.7, y + tall - 20);
    g.lineTo(x + width * 0.7 + 3, y + tall - 25);
    g.lineTo(x + width * 0.7 + 4, y + tall - 19);
    g.fill();
  }
}

/**
 * The first-floor windows' sills, as shares of a front's width (`u`, the window's middle) and
 * height (`v`), with each window's width (`span`), matching facadeTexture.
 */
function sills(kind: Gable): { u: number; v: number; span: number }[] {
  const h = 640;
  const eaves = h * (1 - EAVES);
  const floor = (h - 175 - eaves - 20) / 4;
  const y = eaves + 24 + 3 * floor + (floor - 18) + 4;
  const pane = (256 - 30) / bays(kind);
  return Array.from({ length: bays(kind) }, (_, c) => ({
    u: (15 + c * pane + pane / 2) / 256,
    v: 1 - y / h,
    span: (pane * 0.76) / 256,
  }));
}

/**
 * A clump of a façade garden, 1.8 m tall at most: a mound of leaves, a hollyhock's stalks and a
 * climbing rose, with its flowers apart so they take their own colour.
 */
function gardenGeometry(seed: number): { leaves: BufferGeometry; flowers: BufferGeometry } {
  const random = seeded(seed);
  const leaves: BufferGeometry[] = [];
  const flowers: BufferGeometry[] = [];
  for (let b = 0; b < 3; b++) {
    const mound = new IcosahedronGeometry(0.22 + random() * 0.1, 1);
    mound.translate((random() - 0.5) * 0.3, 0.18, (random() - 0.5) * 0.4);
    leaves.push(mound);
  }
  for (let t = 0; t < 2 + Math.floor(random() * 2); t++) {
    const x = (random() - 0.5) * 0.25;
    const z = (random() - 0.5) * 0.4;
    const tall = 1.2 + random() * 0.7;
    const stalk = new CylinderGeometry(0.015, 0.02, tall, 4);
    stalk.translate(x, tall / 2, z);
    leaves.push(stalk.toNonIndexed());
    for (let y = tall * 0.45; y < tall; y += 0.09) {
      const flower = new SphereGeometry(0.045 + (tall - y) * 0.02, 5, 4);
      flower.translate(x + (random() - 0.5) * 0.06, y, z + (random() - 0.5) * 0.06);
      flowers.push(flower.toNonIndexed());
    }
  }
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  return { leaves: merge(leaves), flowers: merge(flowers) };
}

/**
 * A wisteria trained up a front at x 0 facing -x, from its foot at z 0 along -z: a twisting
 * trunk rising 3 m, then trained branches running along the front under the windows, with
 * leaves and hanging lilac racemes along them; 9 m tall and 6 m wide at full size.
 */
function wisteriaGeometry(seed: number): {
  stems: BufferGeometry;
  leaves: BufferGeometry;
  flowers: BufferGeometry;
} {
  const random = seeded(seed);
  const stems: BufferGeometry[] = [];
  const leaves: BufferGeometry[] = [];
  const flowers: BufferGeometry[] = [];
  let at = new Vector3(-0.1, 0, 0);
  for (let y = 0.6; y <= 3; y += 0.6) {
    const next = new Vector3(-0.1, y, -(random() - 0.3) * 0.3);
    stems.push(limb(at, next, 0.07));
    at = next;
  }
  for (const level of [3, 5.6, 8.2]) {
    let from = new Vector3(-0.08, level, at.z);
    stems.push(limb(at, from, 0.05));
    for (let z = -0.6; z > -6; z -= 0.6) {
      const to = new Vector3(-0.08, level + (random() - 0.5) * 0.3, z);
      stems.push(limb(from, to, 0.035));
      from = to;
      for (let k = 0; k < 2; k++) {
        const leaf = new IcosahedronGeometry(0.22 + random() * 0.12, 0);
        leaf.translate(-0.2, level + random() * 0.4, z + (random() - 0.5) * 0.5);
        leaves.push(leaf);
      }
      for (let k = 0; k < 3; k++) {
        // Each raceme a drooping chain of florets, broad at the top and tapering, swinging
        // a little out of true.
        const length = 0.25 + random() * 0.3;
        const x0 = -0.25;
        const y0 = level - 0.12 - random() * 0.2;
        const z0 = z + (random() - 0.5) * 0.5;
        const sway = (random() - 0.5) * 0.08;
        for (let t = 0; t < 1; t += 0.14) {
          const floret = new IcosahedronGeometry(0.05 * (1.15 - t * 0.7), 0);
          floret.translate(x0 + sway * t, y0 - t * length, z0 + sway * t * 0.5);
          flowers.push(floret);
        }
      }
    }
  }
  const merge = (parts: BufferGeometry[]) => {
    const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
    parts.forEach((p) => p.dispose());
    return merged;
  };
  return { stems: merge(stems), leaves: merge(leaves), flowers: merge(flowers) };
}

/**
 * A wall lantern on a front at x 0 facing -x: a scrolled iron bracket holding a four-sided
 * glazed lantern under a little roof, 0.5 m out from the wall.
 */
function wallLantern(): { frame: BufferGeometry; glass: BufferGeometry } {
  const parts: BufferGeometry[] = [];
  const arm = new BoxGeometry(0.5, 0.03, 0.03);
  arm.translate(-0.25, 0.35, 0);
  const brace = limb(new Vector3(0, 0.05, 0), new Vector3(-0.35, 0.35, 0), 0.015);
  const back = new BoxGeometry(0.02, 0.4, 0.1);
  back.translate(-0.01, 0.2, 0);
  const roof = new ConeGeometry(0.15, 0.14, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(-0.45, 0.22, 0);
  const base = new BoxGeometry(0.16, 0.03, 0.16);
  base.translate(-0.45, -0.12, 0);
  parts.push(
    arm.toNonIndexed(),
    brace,
    back.toNonIndexed(),
    roof.toNonIndexed(),
    base.toNonIndexed(),
  );
  const frame = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  const glass = new BoxGeometry(0.14, 0.26, 0.14);
  glass.translate(-0.45, 0.02, 0);
  return { frame, glass };
}

/** Geraniums along a window box 1 m long (scaled to the box), on z. */
function geraniumGeometry(): BufferGeometry {
  const random = seeded(527);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const bloom = new IcosahedronGeometry(0.07 + random() * 0.03, 0);
    bloom.translate((random() - 0.5) * 0.12, 0.06 + random() * 0.08, -0.45 + (i / 8) * 0.9);
    parts.push(bloom);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * A front's relief, in its 1 × 1 outline with depth in halves of a metre towards -z (the front
 * is drawn 0.5 m thick): a stone sill under and a lintel over every upper window, matching
 * facadeTexture, and the cornice along the eaves (and, on a mansion, along its top).
 */
function reliefGeometry(kind: Gable, doorRight: boolean): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const h = 640;
  const eaves = h * (1 - EAVES);
  const floor = (h - 175 - eaves - 20) / 4;
  const pane = (256 - 30) / bays(kind);
  const ledge = (u: number, v: number, span: number, thick: number, depth: number) => {
    const box = new BoxGeometry(span, thick, depth);
    box.translate(u, v, -depth / 2);
    parts.push(box);
  };
  for (let f = 0; f < 4; f++) {
    const y = eaves + 24 + f * floor;
    const tall = floor - 18 - (3 - f) * 5;
    for (let c = 0; c < bays(kind); c++) {
      const u = (15 + c * pane + pane / 2) / 256;
      const span = (pane * 0.68 + 14) / 256;
      ledge(u, 1 - (y + tall + 6) / h, span, 0.011, 0.36);
      ledge(u, 1 - (y - 6) / h, span, 0.008, 0.2);
    }
  }
  ledge(0.5, EAVES + 0.004, 1.02, 0.016, 0.6);
  if (kind === 'cornice') ledge(0.5, EAVES + 0.07, 1.04, 0.012, 0.7);
  // The doorway's surround: pilasters either side of the door and fanlight, a cornice over
  // them, and on a mansion a pediment above that.
  const door = doorAt(kind, doorRight);
  const span = ((pane * 0.72) / 256) * 1.0;
  const foot = 40 / h;
  const head = 1 - (h - 175 + 6) / h;
  for (const side of [-1, 1])
    ledge(door + side * (span / 2 + 0.012), (foot + head) / 2, 0.022, head - foot, 0.24);
  ledge(door, head + 0.006, span + 0.07, 0.012, 0.36);
  if (kind === 'cornice') {
    const pediment = new Shape();
    pediment.moveTo(-span / 2 - 0.04, 0);
    pediment.lineTo(span / 2 + 0.04, 0);
    pediment.lineTo(0, 0.03);
    pediment.closePath();
    const gablet = new ExtrudeGeometry(pediment, { depth: 0.3, bevelEnabled: false });
    gablet.translate(door, head + 0.012, -0.3);
    parts.push(gablet.toNonIndexed());
  }
  const merged = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/** How many window bays a house of this kind has across its front. */
function bays(kind: Gable): number {
  return kind === 'cornice' ? 5 : 3;
}

/** Where a house's door stands across its front, as a share of its width. */
function doorAt(kind: Gable, doorRight: boolean): number {
  const pane = (256 - 30) / bays(kind);
  return (15 + (doorRight ? bays(kind) - 1 : 0) * pane + pane / 2) / 256;
}

/** A house's front as a shape to extrude, 1 wide and 1 tall. */
function gableShape(kind: Gable): Shape {
  const shape = new Shape();
  traceFront(shape, kind);
  shape.closePath();
  return shape;
}

/**
 * A house's front, drawn to fit its 1 × 1 outline: brick or painted render, a white cornice at
 * the eaves, tall white-framed sash windows on four floors, the door with its fanlight at the
 * foot, and in the gable a hoist beam over a loft window, trimmed in sandstone.
 */
function facadeTexture(
  kind: Gable,
  front: string,
  seed: number,
  doorRight: boolean,
): CanvasTexture {
  const w = 256;
  const h = 640;
  return canvasTexture(w * 2, h * 2, (g) => {
    g.scale(2, 2);
    const random = seeded(seed);
    speckle(g, w, h, front, seed);
    if (parseInt(front.slice(1, 3), 16) <= 0x90) {
      // The mortar behind the bricks.
      g.fillStyle = 'rgba(70,64,58,0.9)';
      g.fillRect(0, 0, w, h);
    }
    const light = parseInt(front.slice(1, 3), 16) > 0x90;
    if (!light) {
      // Brick by brick in stretcher bond: each brick its own shade, some darker headers burnt
      // nearly black, in recessed mortar joints.
      const brick = new Color(front);
      const shade = new Color();
      for (let y = 0, row = 0; y < h; y += 3.2, row++) {
        for (let x = row % 2 ? -3.6 : 0; x < w; x += 7.2) {
          shade.copy(brick).offsetHSL(0, (random() - 0.5) * 0.1, (random() - 0.5) * 0.07);
          if (random() < 0.06) shade.multiplyScalar(0.7);
          g.fillStyle = `#${shade.getHexString()}`;
          g.fillRect(x + 0.5, y + 0.5, 6.4, 2.4);
        }
      }
    } else {
      // Stone or render, lined out as ashlar: courses with staggered joints, and on a mansion
      // the ground floor rusticated in deep-cut bands.
      g.fillStyle = 'rgba(0,0,0,0.08)';
      for (let y = 0, row = 0; y < h; y += 14, row++) {
        g.fillRect(0, y, w, 0.8);
        for (let x = row % 2 ? 0 : 18; x < w; x += 36) g.fillRect(x, y, 0.8, 14);
      }
      if (kind === 'cornice') {
        g.fillStyle = 'rgba(0,0,0,0.22)';
        for (let y = h - 175; y < h - 40; y += 12) g.fillRect(0, y, w, 2.5);
      }
    }
    // The outline, trimmed in sandstone.
    g.save();
    g.setTransform(w, 0, 0, -h, 0, h);
    g.beginPath();
    traceFront(g, kind);
    g.strokeStyle = '#efe8d8';
    g.lineWidth = 0.035;
    g.stroke();
    g.restore();
    const eaves = h * (1 - EAVES);
    g.fillStyle = '#f2efe6';
    g.fillRect(0, eaves - 6, w, 10);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(0, eaves + 4, w, 3);
    // The hoist beam and loft window in the gable, or a balustrade over a cornice.
    if (kind === 'cornice') {
      g.fillStyle = '#efe8d8';
      for (let x = 10; x < w - 10; x += 14) g.fillRect(x, eaves - 34, 6, 26);
      g.fillRect(0, eaves - 40, w, 6);
    } else {
      g.fillStyle = '#f6f4ee';
      g.fillRect(w / 2 - 22, eaves - 70, 44, 52);
      g.fillStyle = '#22303c';
      g.fillRect(w / 2 - 17, eaves - 65, 34, 42);
      g.fillStyle = '#1b1b1f';
      g.fillRect(w / 2 - 4, eaves - 108, 8, 30);
    }
    // Sandstone scrolls in the shoulders of a neck or bell gable, and a stone crest on top.
    if (kind === 'neck' || kind === 'bell') {
      g.strokeStyle = '#e8dfc8';
      g.fillStyle = '#e8dfc8';
      g.lineWidth = 5;
      for (const side of [-1, 1]) {
        const cx = w / 2 + side * w * 0.3;
        g.beginPath();
        g.arc(
          cx,
          eaves - 14,
          16,
          side > 0 ? Math.PI : 0,
          side > 0 ? Math.PI * 1.9 : Math.PI * 0.9,
          side > 0,
        );
        g.stroke();
        g.beginPath();
        g.arc(cx + side * 10, eaves - 6, 5, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.arc(w / 2, h * (1 - 0.985), 10, 0, Math.PI, true);
      g.fill();
    }
    // Pilasters framing a mansion's front, in stone.
    if (kind === 'cornice') {
      g.fillStyle = 'rgba(232,223,200,0.85)';
      g.fillRect(0, eaves, 10, h - eaves - 40);
      g.fillRect(w - 10, eaves, 10, h - eaves - 40);
    }
    // Four floors of sash windows over the ground floor.
    const columns = bays(kind);
    // Most frames are painted white; older houses keep the dark canal green or a cream.
    const frame = (['#f6f4ee', '#f6f4ee', '#f6f4ee', '#1f3a2c', '#e8dcc0'] as const)[seed % 5]!;
    const pane = (w - 30) / columns;
    const floors = 4;
    const ground = h - 175;
    const floor = (ground - eaves - 20) / floors;
    for (let f = 0; f < floors; f++) {
      const y = eaves + 24 + f * floor;
      const tall = floor - 18 - (3 - f) * 5;
      for (let c = 0; c < columns; c++) {
        const x = 15 + c * pane + pane * 0.16;
        const width = pane * 0.68;
        sashWindow(g, x, y, width, tall, random, frame);
      }
      // Iron wall anchors tying the floor's beams, at either end of the front.
      g.fillStyle = '#16181b';
      for (const ax of [6, w - 12]) {
        const ay = y + floor - 22;
        g.fillRect(ax, ay - 7, 5, 14);
        g.fillRect(ax - 3, ay - 2, 11, 4);
      }
    }
    // A carved gable stone over the door on some houses: a framed relief, painted.
    if (random() < 0.45) {
      const sx = doorRight ? 15 + (columns - 1) * pane + pane / 2 : 15 + pane / 2;
      g.fillStyle = '#e8dfc8';
      g.fillRect(sx - 18, h - 210, 36, 28);
      g.fillStyle = ['#2a5a8a', '#8a2a2a', '#3a6a3a', '#c8a040'][Math.floor(random() * 4)]!;
      g.beginPath();
      g.ellipse(sx, h - 196, 11, 9, 0, 0, Math.PI * 2);
      g.fill();
    }
    // The raised ground floor over a stone plinth: the door with its fanlight to one side at
    // the top of the stoop, tall windows beside it, and barred basement windows below them.
    g.fillStyle = '#8f8a82';
    g.fillRect(0, h - 40, w, 40);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(0, h - 40, w, 3);
    const door = doorRight ? columns - 1 : 0;
    const shutters =
      kind !== 'cornice' && random() < 0.4
        ? (
            [
              ['#1f3a2c', '#f2efe6'],
              ['#7a1f1f', '#f2efe6'],
              ['#1b1b1f', '#c8a040'],
            ] as const
          )[Math.floor(random() * 3)]!
        : null;
    for (let c = 0; c < columns; c++) {
      const x = 15 + c * pane + pane * 0.14;
      const width = pane * 0.72;
      g.fillStyle = '#f6f4ee';
      g.fillRect(x - 4, ground + 6, width + 8, h - 40 - ground - 4);
      if (c === door) {
        g.fillStyle = '#c9d6dc';
        g.fillRect(x, ground + 10, width, 24);
        g.fillStyle = '#f6f4ee';
        for (let r = 1; r < 4; r++) g.fillRect(x + (width * r) / 4 - 1, ground + 10, 2, 24);
        g.fillStyle = ['#1f3a2c', '#1b1b1f', '#6a1a1a', '#1b3a5c'][Math.floor(random() * 4)]!;
        g.fillRect(x, ground + 38, width, h - 40 - ground - 38);
        g.fillStyle = 'rgba(255,255,255,0.12)';
        g.fillRect(x + 4, ground + 44, width / 2 - 6, 34);
        g.fillRect(x + width / 2 + 2, ground + 44, width / 2 - 6, 34);
        g.fillStyle = '#c8a040';
        g.fillRect(x + width / 2 - 2, ground + 90, 4, 4);
      } else {
        g.fillStyle = '#22303c';
        g.fillRect(x, ground + 10, width, h - 40 - ground - 16);
        g.fillStyle = '#f6f4ee';
        g.fillRect(x + width / 2 - 1.5, ground + 10, 3, h - 40 - ground - 16);
        g.fillRect(x, ground + 10 + (h - 40 - ground - 16) / 2, width, 3);
        if (shutters) {
          // Folded-back shutters in the house's colours, with their diagonal bands.
          for (const sx of [x - 4 - width * 0.3, x + width + 4]) {
            g.fillStyle = shutters[0];
            g.fillRect(sx, ground + 8, width * 0.3, h - 40 - ground - 12);
            g.strokeStyle = shutters[1];
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(sx, ground + 8);
            g.lineTo(sx + width * 0.3, ground + 8 + width * 0.3);
            g.moveTo(sx + width * 0.3, ground + 8 + width * 0.3);
            g.lineTo(sx, ground + 8 + width * 0.6);
            g.stroke();
          }
        }
        // The basement window under it, behind bars.
        g.fillStyle = '#1a1e22';
        g.fillRect(x + 4, h - 32, width - 8, 24);
        g.fillStyle = '#3a3a3a';
        for (let b = x + 8; b < x + width - 6; b += 7) g.fillRect(b, h - 32, 2, 24);
      }
    }
  });
}
