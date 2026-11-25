import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import { color, mix, positionWorld, texture, vertexColor } from 'three/tsl';
import {
  DoubleSide,
  Group,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  RepeatWrapping,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Node,
  type Texture,
} from 'three/webgpu';
import type { Course } from './course';
import { canvasTexture } from './world-kit';

/** The sky retains the Kīlauea World Ride scattering parameters from rider feedback #936. */
export class KilaueaCaldera {
  readonly root = new Group();
  readonly sky = new SkyMesh();
  private readonly trees = new MeshBasicMaterial({
    side: DoubleSide,
    alphaTest: 0.43,
    color: 0xb3a9be,
  });
  private readonly basalt = new MeshBasicNodeMaterial({ side: DoubleSide });
  private readonly cliffs = new MeshBasicMaterial({ side: DoubleSide, vertexColors: true });
  private readonly walls = new MeshBasicMaterial({ side: DoubleSide, fog: false, color: 0xbbadb9 });
  readonly materials = {
    OhiaForest: this.trees,
    KilaueaBasalt: this.basalt,
    TubeBasalt: this.basalt,
    CalderaWalls: this.walls,
    MaunaLoaShield: this.cliffs,
  };
  private readonly flow = canvasTexture(512, 512, (g) => {
    let seed = 2147;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    g.fillStyle = '#746d72';
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 29000; i++) {
      g.fillStyle = i % 2 ? 'rgba(213,194,182,.25)' : 'rgba(36,32,39,.38)';
      g.fillRect(random() * 512, random() * 512, random() * 2 + 0.5, random() * 2 + 0.5);
    }
    for (let i = 0; i < 140; i++) {
      const x = random() * 512,
        y = random() * 512,
        angle = random() * 6.28,
        scale = 3 + random() * 18;
      for (let n = 0; n < 4; n++) {
        g.beginPath();
        g.ellipse(x, y, scale + n * 2.3, scale * 0.41 + n * 1.2, angle, 0.3, 3.6);
        g.lineWidth = 1.25;
        g.strokeStyle = n % 2 ? 'rgba(28,24,33,.48)' : 'rgba(172,158,160,.49)';
        g.stroke();
      }
    }
  });
  static async load(course: Course) {
    const forest = await new TextureLoader().loadAsync('courses/kilauea-forest.webp');
    const caldera = new KilaueaCaldera(course, forest);
    try {
      const walls = await new TextureLoader().loadAsync('courses/kilauea-walls.webp');
      walls.colorSpace = SRGBColorSpace;
      walls.flipY = false;
      walls.wrapS = MirroredRepeatWrapping;
      caldera.walls.map = walls;
      return caldera;
    } catch (error) {
      caldera.dispose();
      throw error;
    }
  }
  private constructor(
    course: Course,
    private readonly forest: Texture,
  ) {
    forest.flipY = false;
    forest.colorSpace = SRGBColorSpace;
    this.trees.map = forest;
    this.flow.wrapS = this.flow.wrapT = RepeatWrapping;
    this.basalt.colorNode = vertexColor().rgb.mul(
      texture(this.flow, positionWorld.xz.mul(0.09)).rgb.mul(1.8).add(color(0x666072)),
    );
    this.sky.scale.setScalar(4500);
    this.sky.turbidity.value = 4;
    this.sky.rayleigh.value = 0.3;
    this.sky.mieCoefficient.value = 0.003;
    const az = (-27 * Math.PI) / 180,
      elev = (-2 * Math.PI) / 180;
    this.sky.sunPosition.value.set(
      Math.sin(az) * Math.cos(elev),
      Math.sin(elev),
      -Math.cos(az) * Math.cos(elev),
    );
    this.sky.sunPosition.value.applyAxisAngle(new Vector3(0, 1, 0), course.place(0).heading);
    // Preserve the light scattered by the low sun while lifting the black cloud base into violet vog.
    this.sky.material.colorNode = mix(
      (this.sky.material.colorNode as Node<'vec4'>).rgb,
      color(0x756387),
      0.31,
    );
    this.sky.renderOrder = -1;
  }
  dispose() {
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.forest.dispose();
    this.flow.dispose();
    this.trees.dispose();
    this.basalt.dispose();
    this.cliffs.dispose();
    this.walls.map?.dispose();
    this.walls.dispose();
  }
}
