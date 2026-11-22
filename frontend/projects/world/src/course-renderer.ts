// A course drawn with Three.js (ADR 0032, L2-166): the map built in Blender from the class it is modelled after,
// loaded as glTF, with the cyclist kit's riders on its road and a chase camera behind the rider. A class's clock
// places the rider, so each hill arrives with the resistance it was laid from; a race's riders are placed by the
// metres they have ridden. `main`'s scenes are drawn by
// world-renderer.ts; map-renderer.ts picks between the two.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import {
  AdditiveBlending,
  AgXToneMapping,
  BackSide,
  BufferAttribute,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Fog,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGPURenderer,
} from 'three/webgpu';
import type { Backend, SceneFrame, TimedSegment as Segment, World, WorldRenderer } from '@telo/api';
import {
  Course,
  type CoursePlace,
  courseLamps,
  courseLook,
  courseWet,
  parseCourse,
} from './course';
import { fenceMaterial } from './fence-material';
import { type GroundEye, groundMaterial, surfaceTexture } from './ground-material';
import { haloMaterial } from './halo-material';
import { LampGlow } from './lamp-glow';
import { lampLightMap } from './lamp-light-map';
import { mergeStillParts } from './merged-cyclist';
import { ridersOnRoad } from './race-riders';
import { skyMaterial } from './sky-material';
import { RiderShadows } from './rider-shadows';
import { wallMaterial } from './wall-material';
import { windowMaterial } from './window-material';
import { type Cyclist, CyclistKit } from './world-cyclist';
import { PROBE_KEY, readWorldRideProbe } from './world-ride-probe';

/** The chase camera: this far behind the rider and above the road, looking this far ahead. */
const CAMERA_BACK = 4.9;
const CAMERA_UP = 2.25;
const LOOK_AHEAD = 14;
const LOOK_UP = 1.35;
/** At the start line and the finish line the camera closes in to this, eased over these metres either side. */
const CLOSE_BACK = 3.5;
const CLOSE_UP = 1.8;
const CLOSE_START = 45;
const CLOSE_FINISH = 70;
/** Each rider's shadow: a dark blob on the road, this long down-sun and this wide, in metres. */
const SHADOW_LENGTH = 3.4;
const SHADOW_WIDTH = 0.8;
/**
 * How far from the camera, in metres, a chunk of each group of the map is drawn: the land keeps the island's shape to
 * the haze, and what stands on it is drawn nearer, the smallest things nearest.
 */
const DRAW_DISTANCE: Readonly<Record<string, number>> = {
  Land: 950,
  Ground: 420,
  Solid: 250,
  Walls: 220,
  Windows: 160,
  Fences: 120,
  Halos: 320,
  Glow: 400,
  Beams: 460,
  Leaves: 210,
  Confetti: 300,
};
/** The start lights are drawn until the rider is this many metres up the road. */
const START_LIGHTS = 150;
/** How often, in frames, the chunks to draw are chosen. */
const CHUNK_SWEEP = 12;
/** Riders further ahead than this are not drawn, and no more than this many of the nearest. */
const FAR_RIDERS = 120;
const MOST_RIDERS = 4;
/** The haze the distance fades into, from these metres to these; its colour is the course's (`courseLook`). */
const FOG: readonly [number, number] = [200, 1500];
const GHOST_OPACITY = 0.45;
/**
 * How bright the lamps' light is on what stands near the road, against the ground straight under a lamp: walls and
 * posts catch it side on, the land and the leaves as the ground does, the riders from above and beside.
 */
const LAMP_ON = { Solid: 1.5, Walls: 1.5, Land: 4.2, Leaves: 1.8, rider: 1.5 } as const;
/**
 * How the map is drawn, cheapest first: the most device pixels a CSS pixel, and whether the neon blooms. The ride
 * opens on `START`, so it never starts high and drops in front of the rider (L2-111 AC3); frames that keep the
 * display's pace step it up, and slow ones step it down, after which it never steps up again.
 */
const TIERS = [
  { ratio: 0.75, bloom: false },
  { ratio: 1, bloom: false },
  { ratio: 1.5, bloom: false },
  { ratio: 1.5, bloom: true },
  { ratio: 2, bloom: true },
] as const;
const START = 1;
/** The tier the test-only hook pins (world-ride-probe.ts): the bench reads frame times at one known tier. */
const PINNED: Readonly<Record<string, number>> = { low: 0, medium: 1, high: 3, ultra: 4 };
/** Frames judged before a step, and how their average time must compare with the display's frame period. */
const JUDGED_FRAMES = 90;
const TOO_SLOW = 1.6;
const AT_PACE = 1.1;

/** A race rider's colour, the design system's `--jersey-<jersey>`, as world-renderer.ts reads it. */
function jerseyColour(element: Element, jersey: string): Color {
  const value = getComputedStyle(element).getPropertyValue(`--jersey-${jersey}`).trim();
  const colour = new Color(0xd7ff3a);
  if (value) colour.setStyle(value);
  return colour;
}

export class CourseRenderer implements WorldRenderer {
  backend: Backend = 'webgl2';
  private renderer: WebGPURenderer | null = null;
  private course: Course | null = null;
  private disposed = false;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(58, 16 / 9, 0.3, 14000);
  private readonly sun = new DirectionalLight(0xff9a5a, 2.6);
  private sky: Mesh | null = null;
  /** Moves the sky's cloud on to a second of the ride's clock. */
  private skyClock: ((seconds: number) => void) | null = null;
  /** Where the ground is seen from, for what wet ground mirrors (ground-material.ts). */
  private groundEye: GroundEye | null = null;
  /** The scene's pass with bloom over it, for the neon; null where it could not be built. */
  private pipeline: RenderPipeline | null = null;
  private map: Object3D | null = null;
  /** The map's chunks along the road, each with its centre and how near the camera must be to draw it. */
  private readonly chunks: {
    mesh: Mesh;
    x: number;
    y: number;
    z: number;
    reach: number;
  }[] = [];
  private frames = 0;
  private readonly chosenAt = new Vector3();
  /** The start lights: red until the ride's clock starts, green from then. */
  private startRed: Mesh | null = null;
  private startGreen: Mesh | null = null;
  private beams: MeshBasicMaterial | null = null;
  private readonly confetti: Mesh[] = [];
  /** The blob every rider's shadow is drawn with, and each rider's own. */
  private blob: { geometry: CircleGeometry; material: MeshBasicMaterial } | null = null;
  private readonly shadows = new Map<Cyclist, Mesh>();
  /** Under street lamps the riders' shadows are the lamps' instead (rider-shadows.ts), for these riders. */
  private lampShadows: RiderShadows | null = null;
  private readonly casting = new Set<Cyclist>();
  /** Draws every rider's plain-coloured still parts, merged into one mesh a rider (merged-cyclist.ts). */
  private readonly plain = new MeshLambertMaterial({ vertexColors: true });
  private kit: CyclistKit | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private you: Cyclist | null = null;
  private readonly riders = new Map<string, Cyclist>();
  private readonly disposables: { dispose(): void }[] = [];
  private readonly frameMaterial = new MeshPhysicalMaterial({
    color: 0x15171c,
    metalness: 0.6,
    roughness: 0.35,
  });
  /** The plan's seconds for each second of the course: 1 when the plan is the class the course was built from. */
  private clockScale = 1;
  private readonly here: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly there: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  // The frame budget: the tier follows what the device can draw at the display's pace (L2-166 AC6).
  private size: readonly [number, number, number] = [0, 0, 1];
  private tier = START;
  /** Set once slow frames have stepped the tier down: it steps up no more. */
  private settled = false;
  private period: number | null = null;
  private lastFrameAt: number | null = null;
  private judged = 0;
  private spent = 0;
  /** Set by the test-only hook: the tier never steps, and each frame's cost is written to the hook. */
  private pinned = false;
  /** Set by the test-only hook: the metres up the road the bench starts its ride from. */
  private benchFrom = 0;
  /** The street lamps' light on what stands near the road, where the course has lamps; and the riders' materials lit by it. */
  private lampGlow: LampGlow | null = null;
  private readonly lamplit = new Map<Material, Material>();

  /** `path` is where the app serves the course's `.glb` and `.course.json`. */
  constructor(private readonly path: string) {}

  async start(
    canvas: HTMLCanvasElement,
    _world: World,
    nextFrame: () => Promise<void>,
    segments: readonly Segment[] = [],
  ): Promise<boolean> {
    try {
      const asked = readWorldRideProbe((globalThis as Record<string, unknown>)[PROBE_KEY]);
      const renderer = new WebGPURenderer({
        canvas,
        antialias: true,
        forceWebGL: asked?.forceWebGL ?? false,
      });
      await renderer.init();
      this.renderer = renderer;
      if (asked && !asked.judged) {
        this.pinned = true;
        const from = (globalThis as Record<string, unknown>)[PROBE_KEY] as { from?: unknown };
        if (typeof from.from === 'number') this.benchFrom = from.from;
        this.tier = PINNED[asked.tier] ?? START;
        renderer.info.autoReset = false;
      }
      this.backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
        ? 'webgpu'
        : 'webgl2';
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = AgXToneMapping;
      renderer.toneMappingExposure = 1.15;

      const [file, gltf] = await Promise.all([
        fetch(`${this.path}.course.json`).then((response) => {
          if (!response.ok) throw new Error(`The course file answered ${response.status}.`);
          return response.json() as Promise<unknown>;
        }),
        new GLTFLoader().loadAsync(`${this.path}.glb`),
      ]);
      if (this.disposed) return false;
      this.course = new Course(parseCourse(file));
      const planned = segments.reduce((sum, segment) => sum + segment.duration, 0);
      this.clockScale = planned > 0 ? this.course.duration / planned : 1;
      this.canvas = canvas;
      this.build(gltf.scene, canvas);

      // The map's programs compile while it loads, and its first picture is drawn before the ride's first frame.
      this.rehearse();
      await renderer.compileAsync(this.scene, this.camera);
      this.pipeline = this.glow(renderer);
      this.render();
      await nextFrame();
      return !this.disposed;
    } catch {
      return false;
    }
  }

  resize(width: number, height: number, pixelRatio: number): void {
    if (!this.renderer || width === 0 || height === 0) return;
    this.size = [width, height, pixelRatio];
    this.renderer.setPixelRatio(Math.min(pixelRatio, TIERS[this.tier]!.ratio));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  draw(frame: SceneFrame): void {
    const { renderer, course, you } = this;
    if (!renderer || !course || !you) return;
    // A race is won by distance, so its riders are placed by the metres they have ridden and cross the map's finish
    // line as the race's; a class is ridden by its clock (L2-166 AC2).
    const ridden = frame.riders
      ? Math.min(frame.s, course.end)
      : course.metresAt(frame.time * this.clockScale);
    const metres = Math.min(ridden + this.benchFrom, course.end);
    this.lampShadows?.begin();
    this.ride(you, metres, 0);
    you.pose(frame.reducedMotion ? 0 : frame.crank);
    this.placeRiders(frame, metres);
    this.lampShadows?.end();
    this.aim(metres);
    // Chosen every few frames, and at once when the camera has jumped (a ride resumed elsewhere on the road).
    const leapt = this.camera.position.distanceToSquared(this.chosenAt) > 60 * 60;
    if (this.frames++ % CHUNK_SWEEP === 0 || leapt) this.choose();
    // The start lights: red until the clock starts, green from then, and not drawn once they are far behind.
    const lights = metres < START_LIGHTS;
    if (this.startRed) this.startRed.visible = lights && frame.time <= 0;
    if (this.startGreen) this.startGreen.visible = lights && frame.time > 0;
    if (!frame.reducedMotion) this.animate(frame.time);
    this.render();
    this.judge();
  }

  setFramePeriod(ms: number): void {
    this.period = ms;
    this.lastFrameAt = null;
    this.judged = 0;
    this.spent = 0;
  }

  pauseBudget(): void {
    this.period = null;
    this.lastFrameAt = null;
  }

  /** A course follows no real place: there is nothing to stream beside it (L2-066). */
  stream(): void {
    // Nothing to stream.
  }

  dispose(): void {
    this.disposed = true;
    this.pipeline?.dispose();
    this.pipeline = null;
    this.map?.traverse((part) => {
      const mesh = part as Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    this.map = null;
    this.chunks.length = 0;
    this.confetti.length = 0;
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.riders.clear();
    this.lamplit.clear();
    this.lampGlow = null;
    this.groundEye = null;
    this.shadows.clear();
    this.casting.clear();
    this.lampShadows = null;
    this.blob = null;
    this.renderer?.dispose();
    this.renderer = null;
  }

  private build(map: Object3D, canvas: HTMLCanvasElement): void {
    // The course's world: its sky, its haze and its lights (a course that names none is Ibiza's sunset).
    const look = courseLook(this.course!.file);
    const SKY = look.sky;
    this.scene.fog = new Fog(look.haze, FOG[0], FOG[1]);
    this.scene.background = new Color(look.haze);
    this.sun.color.setHex(look.light.colour);
    this.sun.intensity = look.light.intensity;
    // The map comes as a few groups of meshes, coloured by vertex and cut into chunks along the road (ADR 0032).
    // Each group is drawn with one cheap material: no texture, no PBR, shaded flat.
    const lit = { vertexColors: true, flatShading: true } as const;
    const glow = { vertexColors: true, toneMapped: false } as const;
    const materials: Record<string, Material> = {
      Land: new MeshLambertMaterial(lit),
      Solid: new MeshLambertMaterial(lit),
      Leaves: new MeshLambertMaterial({ ...lit, side: DoubleSide }),
      Sea: new MeshLambertMaterial(lit),
      Conillera: new MeshLambertMaterial({ ...lit, fog: false }),
      Glow: new MeshBasicMaterial(glow),
      Confetti: new MeshBasicMaterial({ ...glow, side: DoubleSide }),
      Sun: new MeshBasicMaterial({ ...glow, fog: false }),
      StartRed: new MeshBasicMaterial(glow),
      StartGreen: new MeshBasicMaterial(glow),
      Beams: new MeshBasicMaterial({
        ...glow,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        fog: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    };
    // Where the course has street lamps, what stands near the road is lit by them (lamp-glow.ts).
    const lamps = courseLamps(this.course!.file);
    if (lamps) {
      const lampGlow = new LampGlow(lampLightMap(this.course!, lamps), lamps);
      this.lampGlow = lampGlow;
      // The riders' shadows fall away from the lamps: the rider, and the riders drawn with them.
      this.lampShadows = new RiderShadows(this.course!, lamps, MOST_RIDERS + 1);
      this.scene.add(this.lampShadows.mesh);
      this.disposables.push(lampGlow, this.lampShadows);
      for (const [group, material] of [
        ['Solid', lampGlow.scenery(LAMP_ON.Solid)],
        ['Land', lampGlow.scenery(LAMP_ON.Land)],
        ['Leaves', lampGlow.scenery(LAMP_ON.Leaves, true)],
      ] as const) {
        materials[group]!.dispose();
        materials[group] = material;
      }
    }
    this.disposables.push(...Object.values(materials));
    // The ground the road builds has its place on the road in its UV: its surface and the lamps' light are drawn
    // from that (ground-material.ts). A map built before it has no such group.
    const detail = surfaceTexture();
    const ground = groundMaterial(
      detail,
      this.course!.file.roadHalfWidth,
      lamps,
      courseWet(this.course!.file),
      new Color(look.haze),
    );
    materials['Ground'] = ground.material;
    this.groundEye = ground.eye;
    // Walls have their place on the wall in their UV: brick, steel and plaster are drawn from it (wall-material.ts).
    materials['Walls'] = wallMaterial(detail, this.lampGlow?.light ?? null, LAMP_ON.Walls);
    // The city on the horizon is walls too, never lit by the lamps: its windows shine (wall-material.ts).
    materials['Skyline'] = wallMaterial(detail, null, 0, new Color(look.haze));
    // Windows are panels with their place on the pane in their UV (window-material.ts).
    materials['Windows'] = windowMaterial(
      detail,
      new Color(look.haze),
      this.lampGlow?.light ?? null,
    );
    this.disposables.push(
      detail,
      materials['Ground'],
      materials['Walls'],
      materials['Skyline'],
      materials['Windows'],
    );
    // Railings are panels with their place along the railing in their UV (fence-material.ts).
    materials['Fences'] = fenceMaterial(this.lampGlow?.light ?? null, LAMP_ON.Solid);
    // The glow round each light: corners the material spreads to face the eye (halo-material.ts).
    materials['Halos'] = haloMaterial(DRAW_DISTANCE['Halos']! * 0.6, DRAW_DISTANCE['Halos']!);
    this.disposables.push(materials['Fences'], materials['Halos']);
    this.beams = materials['Beams'] as MeshBasicMaterial;
    map.traverse((part) => {
      const mesh = part as Mesh;
      if (!mesh.isMesh) return;
      // A chunk is named for its group and its place along the road: `Solid_012`.
      const [group = '', chunk] = mesh.name.split('_');
      const material = materials[group];
      if (!material) return;
      for (const loaded of [mesh.material].flat()) loaded.dispose();
      mesh.material = material;
      // The ground is lit smoothly: its normals are worked out here, so the map's file carries none.
      if (group === 'Ground') mesh.geometry.computeVertexNormals();
      // The map is set once and never moves: its matrices are worked out here, not every frame.
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      if (group === 'Confetti') this.confetti.push(mesh);
      if (group === 'StartRed') this.startRed = mesh;
      if (group === 'StartGreen') this.startGreen = mesh;
      if (chunk !== undefined) {
        mesh.geometry.computeBoundingSphere();
        const sphere = mesh.geometry.boundingSphere;
        if (sphere) {
          // A mesh's positions are steps of its own box, put back by its place and scale in the map (pack_glb.py):
          // its middle and its reach are worked out in the map's axes, not its own.
          mesh.updateMatrixWorld(true);
          const middle = sphere.center.clone().applyMatrix4(mesh.matrixWorld);
          this.chunks.push({
            mesh,
            x: middle.x,
            y: middle.y,
            z: middle.z,
            reach:
              (DRAW_DISTANCE[group] ?? 700) + sphere.radius * mesh.matrixWorld.getMaxScaleOnAxis(),
          });
        }
      }
    });
    this.map = map;
    this.scene.add(map);

    // The sky, worked out a pixel on a dome that rides with the camera (sky-material.ts).
    const dome = new SphereGeometry(9000, 24, 12);
    const sky = skyMaterial(look, this.course!.file.sun, detail);
    this.skyClock = sky.at;
    this.sky = new Mesh(dome, sky.material);
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);
    this.disposables.push(dome, sky.material);

    const fill = new HemisphereLight(look.fill[0], look.fill[1], 1.5);
    // The low sun throws each rider's shadow long across the road: a soft dark blob, with no shadow map to draw.
    const circle = new CircleGeometry(0.5, 20);
    circle.rotateX(-Math.PI / 2);
    const shade = new MeshBasicMaterial({
      color: 0x1a1024,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    this.blob = { geometry: circle, material: shade };
    this.disposables.push(circle, shade);
    this.scene.add(fill, this.sun, this.sun.target);
    this.disposables.push(fill, this.sun);

    const kit = new CyclistKit(this.frameMaterial);
    this.kit = kit;
    // The rider wears the You jersey of the race board (L2-060).
    const you = kit.make(jerseyColour(canvas, 'you'), 4);
    this.you = you;
    this.disposables.push(...mergeStillParts(you, this.plain));
    this.lamplight(you);
    this.shadow(you);
    this.scene.add(you.group);
    this.disposables.push(kit, you.jersey, you.bib, you.shell, this.frameMaterial, this.plain);
  }

  /** Places the scene as the ride's first frame will, so what the start shows is what compiles. */
  private rehearse(): void {
    if (!this.you) return;
    this.lampShadows?.begin();
    this.ride(this.you, 0, 0);
    this.lampShadows?.end();
    this.you.pose(0);
    this.aim(0);
    this.choose();
    if (this.startGreen) this.startGreen.visible = false;
  }

  /** Stands a cyclist on the road `metres` from the start line, `lane` metres right of its centre. */
  private ride(cyclist: Cyclist, metres: number, lane: number): void {
    const at = this.course!.place(metres, lane, this.here);
    cyclist.group.position.set(at.x, at.y + 0.02, at.z);
    cyclist.group.rotation.set(at.pitch, at.heading, 0, 'YXZ');
    if (this.casting.has(cyclist) && cyclist.group.visible) this.lampShadows?.add(metres, lane);
    // The shadow lies on the road, stretched away from the sun.
    const shadow = this.shadows.get(cyclist);
    if (shadow) {
      const [sx, , sz] = this.course!.file.sun;
      const far = SHADOW_LENGTH * 0.42;
      shadow.position.set(at.x - sx * far, at.y + 0.05, at.z - sz * far);
      shadow.rotation.set(at.pitch, Math.atan2(-sx, -sz), 0, 'YXZ');
      shadow.visible = cyclist.group.visible;
    }
  }

  /** The chase camera behind the rider, looking up the road, with the sky and the sun's light around it. */
  private aim(metres: number): void {
    const course = this.course!;
    // Close in on the rider at the start line and at the finish line.
    const near = Math.max(
      1 - Math.abs(metres) / CLOSE_START,
      1 - Math.abs(metres - course.length) / CLOSE_FINISH,
      0,
    );
    const close = near * near * (3 - 2 * near);
    const behind = CAMERA_BACK + (CLOSE_BACK - CAMERA_BACK) * close;
    const up = CAMERA_UP + (CLOSE_UP - CAMERA_UP) * close;
    const back = course.place(metres - behind, 0, this.here);
    this.camera.position.set(back.x, back.y + up, back.z);
    this.groundEye?.at(metres - behind, 0, up);
    const ahead = course.place(metres + LOOK_AHEAD, 0, this.there);
    this.camera.lookAt(ahead.x, ahead.y + LOOK_UP, ahead.z);
    this.sky?.position.copy(this.camera.position);
    const [x, , z] = course.file.sun;
    this.sun.target.position.set(ahead.x, ahead.y, ahead.z);
    this.sun.position.set(ahead.x + x * 70, ahead.y + 34, ahead.z + z * 70);
    this.sun.target.updateMatrixWorld();
  }

  /** The race's other riders at their places, each on a line of their own (L2-064 AC3). */
  private placeRiders(frame: SceneFrame, metres: number): void {
    for (const rider of this.riders.values()) {
      rider.group.visible = false;
      const shadow = this.shadows.get(rider);
      if (shadow) shadow.visible = false;
    }
    if (!frame.riders) return;
    const nearest = ridersOnRoad(frame.riders, FAR_RIDERS)
      .sort((a, b) => Math.abs(a.metres) - Math.abs(b.metres))
      .slice(0, MOST_RIDERS);
    for (const rider of nearest) {
      const cyclist = this.rider(rider.jersey);
      if (!cyclist) continue;
      cyclist.group.visible = true;
      this.ride(cyclist, metres + rider.metres, rider.lane);
      cyclist.pose(frame.reducedMotion ? 0 : frame.crank + rider.lane);
    }
  }

  /** A race rider in their jersey, made the first time they ride into view; the ghost in translucent gold. */
  private rider(jersey: string): Cyclist | null {
    const made = this.riders.get(jersey);
    if (made) return made;
    if (!this.kit || !this.canvas) return null;
    const colour = jerseyColour(this.canvas, jersey);
    const cyclist = this.kit.make(colour, this.riders.size + 1);
    this.disposables.push(cyclist.jersey, cyclist.bib, cyclist.shell);
    if (jersey === 'ghost') {
      const glass = new MeshStandardMaterial({
        color: colour,
        roughness: 0.4,
        transparent: true,
        opacity: GHOST_OPACITY,
        depthWrite: false,
      });
      this.disposables.push(glass);
      cyclist.group.traverse((part) => {
        const mesh = part as Mesh;
        if (mesh.isMesh) mesh.material = glass;
      });
    }
    this.disposables.push(...mergeStillParts(cyclist, this.plain));
    if (jersey !== 'ghost') this.lamplight(cyclist);
    if (jersey !== 'ghost') this.shadow(cyclist);
    this.riders.set(jersey, cyclist);
    this.scene.add(cyclist.group);
    return cyclist;
  }

  /** Where the course has street lamps, gives a rider's lit materials the lamps' light too. */
  private lamplight(cyclist: Cyclist): void {
    const lampGlow = this.lampGlow;
    if (!lampGlow) return;
    cyclist.group.traverse((part) => {
      const mesh = part as Mesh;
      const own = mesh.material as MeshStandardMaterial;
      if (
        !mesh.isMesh ||
        Array.isArray(own) ||
        !(own.isMeshStandardMaterial || (own as Material) === this.plain)
      )
        return;
      let lit = this.lamplit.get(own);
      if (!lit) {
        lit = lampGlow.rider(own, LAMP_ON.rider);
        this.lamplit.set(own, lit);
        this.disposables.push(lit);
      }
      mesh.material = lit;
    });
  }

  /** What moves on the map: the light beams breathe and the confetti flutters. Two numbers a frame. */
  private animate(time: number): void {
    if (this.beams) this.beams.opacity = 0.17 + 0.06 * Math.sin(time * 1.7);
    this.skyClock?.(time);
    for (const confetti of this.confetti) {
      confetti.position.y = 0.45 * Math.sin(time * 1.3);
      confetti.rotation.y = 0.012 * Math.sin(time * 0.9);
      confetti.updateMatrix();
    }
  }

  /** Draws only the chunks of the map near enough to the camera; the haze hides the rest. */
  private choose(): void {
    const { x, y, z } = this.camera.position;
    this.chosenAt.copy(this.camera.position);
    for (const chunk of this.chunks) {
      const dx = chunk.x - x;
      const dy = chunk.y - y;
      const dz = chunk.z - z;
      chunk.mesh.visible = dx * dx + dy * dy + dz * dz < chunk.reach * chunk.reach;
    }
  }

  /** Gives a cyclist their shadow on the road. */
  private shadow(cyclist: Cyclist): void {
    if (this.lampShadows) {
      this.casting.add(cyclist);
      return;
    }
    if (!this.blob) return;
    const mesh = new Mesh(this.blob.geometry, this.blob.material);
    mesh.scale.set(SHADOW_WIDTH, 1, SHADOW_LENGTH);
    mesh.renderOrder = 1;
    this.shadows.set(cyclist, mesh);
    this.scene.add(mesh);
  }

  /** The scene's pass with a soft bloom over it, so the neon, the bulbs and the sun glow. */
  private glow(renderer: WebGPURenderer): RenderPipeline | null {
    try {
      const scene = pass(this.scene, this.camera);
      const colour = scene.getTextureNode('output');
      const pipeline = new RenderPipeline(renderer);
      pipeline.outputNode = colour.add(bloom(colour, 0.16, 0.45, 0.9));
      return pipeline;
    } catch {
      return null;
    }
  }

  /** Draws the frame: through the bloom at the tiers that have it, plainly at the others. */
  private render(): void {
    const renderer = this.renderer;
    if (!renderer) return;
    if (this.pinned) renderer.info.reset();
    if (this.pipeline && TIERS[this.tier]!.bloom) this.pipeline.render();
    else renderer.render(this.scene, this.camera);
    if (this.pinned) this.report(renderer);
  }

  /** Writes what the frame cost to the test-only hook, for the bench (tools/course-bench). */
  private report(renderer: WebGPURenderer): void {
    const hook = (globalThis as Record<string, unknown>)[PROBE_KEY] as Record<string, unknown>;
    const { drawCalls, triangles } = renderer.info.render;
    // The chunks of each group in view: where the map's draw calls come from.
    const groups: Record<string, number> = {};
    for (const { mesh } of this.chunks) {
      const group = mesh.name.split('_')[0]!;
      if (mesh.visible) groups[group] = (groups[group] ?? 0) + 1;
    }
    hook['course'] = { tier: this.tier, backend: this.backend, drawCalls, triangles, groups };
  }

  /** Steps the tier down when the judged frames ran slower than the display allows, and up while they keep its pace. */
  private judge(): void {
    const now = performance.now();
    const last = this.lastFrameAt;
    this.lastFrameAt = now;
    if (this.pinned || this.period === null || last === null) return;
    this.spent += now - last;
    if (++this.judged < JUDGED_FRAMES) return;
    const average = this.spent / this.judged;
    this.judged = 0;
    this.spent = 0;
    if (average > this.period * TOO_SLOW) {
      this.settled = true;
      if (this.tier > 0) this.step(-1);
    } else if (!this.settled && average <= this.period * AT_PACE && this.tier < TIERS.length - 1) {
      this.step(1);
    }
  }

  private step(by: number): void {
    this.tier += by;
    this.resize(...this.size);
  }
}
