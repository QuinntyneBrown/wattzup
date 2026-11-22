// A course drawn with Three.js (ADR 0032, L2-166): the map built in Blender from the class it is modelled after,
// loaded as glTF, with the cyclist kit's riders on its road and a chase camera behind the rider. A class's clock
// places the rider, so each hill arrives with the resistance it was laid from; a race's riders are placed by the
// metres they have ridden. `main`'s scenes are drawn by
// world-renderer.ts; map-renderer.ts picks between the two.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import {
  AgXToneMapping,
  BackSide,
  BufferAttribute,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  RenderPipeline,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  WebGPURenderer,
} from 'three/webgpu';
import type { Backend, SceneFrame, TimedSegment as Segment, World, WorldRenderer } from '@telo/api';
import { Course, type CoursePlace, courseLook, parseCourse } from './course';
import { ridersOnRoad } from './race-riders';
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
/** The riders' shadows fall on the road within this many metres of the rider. */
const SHADOW_REACH = 16;
/** Meshes of the map that glow: drawn past the tone mapping, so neon stays neon. */
const GLOWS = /^(Neon|Beam|Bulb|Gold|Confetti|Glow|LampRed|EffortChevrons|Sun|Accent)/;
/** Meshes the riders' shadows fall on. */
const SHADOWED = /^(Road|RoadPaint|CentreLine|Promenade|Kerbs)$/;
/** Riders further ahead than this are not drawn. */
const FAR_RIDERS = 220;
const FOG: readonly [number, number] = [320, 4200];
const GHOST_OPACITY = 0.45;
/** The sharpest the map is drawn, in device pixels a CSS pixel; a slow device steps down this list. */
const PIXEL_RATIOS = [2, 1.5, 1, 0.75] as const;
/** Frames judged before a step down, and how much slower than the display they must run on average. */
const JUDGED_FRAMES = 90;
const TOO_SLOW = 1.6;

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
  /** The scene's pass with bloom over it, for the neon; null where it could not be built. */
  private pipeline: RenderPipeline | null = null;
  private map: Object3D | null = null;
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
  // The frame budget: the pixel ratio steps down when frames run slow (L2-166 AC6).
  private size: readonly [number, number, number] = [0, 0, 1];
  private ratio = 0;
  private period: number | null = null;
  private lastFrameAt: number | null = null;
  private judged = 0;
  private spent = 0;

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
      this.backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend
        ? 'webgpu'
        : 'webgl2';
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = AgXToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFShadowMap;

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
    this.renderer.setPixelRatio(Math.min(pixelRatio, PIXEL_RATIOS[this.ratio]!));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  draw(frame: SceneFrame): void {
    const { renderer, course, you } = this;
    if (!renderer || !course || !you) return;
    // A race is won by distance, so its riders are placed by the metres they have ridden and cross the map's finish
    // line as the race's; a class is ridden by its clock (L2-166 AC2).
    const metres = frame.riders
      ? Math.min(frame.s, course.end)
      : course.metresAt(frame.time * this.clockScale);
    this.ride(you, metres, 0);
    you.pose(frame.reducedMotion ? 0 : frame.crank);
    this.placeRiders(frame, metres);
    this.aim(metres);
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
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      for (const material of [mesh.material].flat()) material.dispose();
    });
    this.map = null;
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.riders.clear();
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
    map.traverse((part) => {
      const mesh = part as Mesh;
      if (!mesh.isMesh) return;
      // The map is set once and never moves: its matrices are worked out here, not every frame.
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.receiveShadow = SHADOWED.test(mesh.name);
      for (const material of [mesh.material].flat() as Material[]) {
        const standard = material as MeshStandardMaterial;
        // The sun and the island beside it stand beyond the haze; the beams are light, not solid.
        if (mesh.name === 'Sun' || mesh.name === 'Conillera') standard.fog = false;
        if (GLOWS.test(mesh.name)) standard.toneMapped = false;
        if (mesh.name.startsWith('Beam')) {
          standard.depthWrite = false;
          standard.fog = false;
        }
      }
    });
    this.map = map;
    this.scene.add(map);

    // The sky: bands of sunset from the horizon up, on a dome that rides with the camera.
    const dome = new SphereGeometry(9000, 32, 16);
    const position = dome.getAttribute('position');
    const colours = new Float32Array(position.count * 3);
    const band = new Color();
    const next = new Color();
    for (let i = 0; i < position.count; i++) {
      const up = Math.max(position.getY(i) / 9000, 0) ** 0.55 * (SKY.length - 1);
      const from = Math.min(Math.floor(up), SKY.length - 2);
      band.setHex(SKY[from]!).lerp(next.setHex(SKY[from + 1]!), up - from);
      colours.set([band.r, band.g, band.b], i * 3);
    }
    dome.setAttribute('color', new BufferAttribute(colours, 3));
    const air = new MeshBasicMaterial({
      vertexColors: true,
      side: BackSide,
      fog: false,
      depthWrite: false,
    });
    this.sky = new Mesh(dome, air);
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);
    this.disposables.push(dome, air);

    const fill = new HemisphereLight(look.fill[0], look.fill[1], 1.5);
    // The low sun throws the riders' shadows long across the road, and only the riders'.
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const reach = this.sun.shadow.camera;
    reach.left = reach.bottom = -SHADOW_REACH;
    reach.right = reach.top = SHADOW_REACH;
    reach.near = 1;
    reach.far = 160;
    this.sun.shadow.bias = -0.002;
    this.scene.add(fill, this.sun, this.sun.target);
    this.disposables.push(fill, this.sun);

    const kit = new CyclistKit(this.frameMaterial);
    this.kit = kit;
    // The rider wears the You jersey of the race board (L2-060).
    const you = kit.make(jerseyColour(canvas, 'you'), 4);
    this.you = you;
    this.shadow(you);
    this.scene.add(you.group);
    this.disposables.push(kit, you.jersey, you.bib, you.shell, this.frameMaterial);
  }

  /** Places the scene as the ride's first frame will, so what the start shows is what compiles. */
  private rehearse(): void {
    if (!this.you) return;
    this.ride(this.you, 0, 0);
    this.you.pose(0);
    this.aim(0);
  }

  /** Stands a cyclist on the road `metres` from the start line, `lane` metres right of its centre. */
  private ride(cyclist: Cyclist, metres: number, lane: number): void {
    const at = this.course!.place(metres, lane, this.here);
    cyclist.group.position.set(at.x, at.y + 0.02, at.z);
    cyclist.group.rotation.set(at.pitch, at.heading, 0, 'YXZ');
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
    const back = course.place(
      metres - (CAMERA_BACK + (CLOSE_BACK - CAMERA_BACK) * close),
      0,
      this.here,
    );
    this.camera.position.set(back.x, back.y + CAMERA_UP + (CLOSE_UP - CAMERA_UP) * close, back.z);
    const ahead = course.place(metres + LOOK_AHEAD, 0, this.there);
    this.camera.lookAt(ahead.x, ahead.y + LOOK_UP, ahead.z);
    this.sky?.position.copy(this.camera.position);
    const [x, , z] = course.file.sun;
    // The light stands a little higher than the sun, so shadows are long but stay on the road.
    this.sun.target.position.set(ahead.x, ahead.y, ahead.z);
    this.sun.position.set(ahead.x + x * 70, ahead.y + 34, ahead.z + z * 70);
    this.sun.target.updateMatrixWorld();
  }

  /** The race's other riders at their places, each on a line of their own (L2-064 AC3). */
  private placeRiders(frame: SceneFrame, metres: number): void {
    for (const rider of this.riders.values()) rider.group.visible = false;
    if (!frame.riders) return;
    for (const rider of ridersOnRoad(frame.riders, FAR_RIDERS)) {
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
    if (jersey !== 'ghost') this.shadow(cyclist);
    this.riders.set(jersey, cyclist);
    this.scene.add(cyclist.group);
    return cyclist;
  }

  /** Every part of a cyclist casts a shadow. */
  private shadow(cyclist: Cyclist): void {
    cyclist.group.traverse((part) => {
      part.castShadow = true;
    });
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

  /** Draws the frame: with the bloom at the two sharpest pixel ratios, plainly below them. */
  private render(): void {
    const renderer = this.renderer;
    if (!renderer) return;
    if (this.pipeline && this.ratio < 2) this.pipeline.render();
    else renderer.render(this.scene, this.camera);
  }

  /** Steps the pixel ratio down when the judged frames ran slower than the display allows. */
  private judge(): void {
    const now = performance.now();
    const last = this.lastFrameAt;
    this.lastFrameAt = now;
    if (this.period === null || last === null) return;
    this.spent += now - last;
    if (++this.judged < JUDGED_FRAMES) return;
    const slow = this.spent / this.judged > this.period * TOO_SLOW;
    this.judged = 0;
    this.spent = 0;
    if (slow && this.ratio < PIXEL_RATIOS.length - 1) {
      this.ratio++;
      this.resize(...this.size);
    }
  }
}
