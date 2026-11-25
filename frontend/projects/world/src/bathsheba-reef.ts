import {
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Sprite,
  SpriteMaterial,
} from 'three/webgpu';
import type { Course, CoursePlace } from './course';
import { canvasTexture } from './world-kit';

/** A crest travels from the outer shelf to the beach, dividing around exposed coral. */
export class BathshebaReef {
  readonly group = new Group();
  private readonly foam = canvasTexture(256, 64, (g) => {
    for (let x = 0; x < 256; x++) {
      const y = 18 + 6 * Math.sin(x * 0.054) + 3 * Math.sin(x * 0.17);
      for (let j = 0; j < 20; j++) {
        const noise = (1 + Math.sin(x * 153.7 + j * 39.7)) * 0.5;
        const alpha = Math.sin((Math.PI * x) / 256) * Math.exp(-j * 0.13) * (0.3 + 0.65 * noise);
        g.fillStyle = 'rgba(245,250,239,' + alpha + ')';
        g.fillRect(x, y + j + noise * 1.6, 1, 2.2);
      }
    }
  });
  private readonly material = new MeshBasicMaterial({
    map: this.foam,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly geometry = new PlaneGeometry(1, 1);
  private readonly waves = new InstancedMesh(this.geometry, this.material, 96);
  private readonly reefColour = canvasTexture(96, 96, (g) => {
    const bed = g.createRadialGradient(47, 49, 2, 47, 49, 46);
    bed.addColorStop(0, 'rgba(96,196,179,.85)');
    bed.addColorStop(0.67, 'rgba(108,201,178,.60)');
    bed.addColorStop(1, 'rgba(126,207,190,0)');
    g.fillStyle = bed;
    g.fillRect(0, 0, 96, 96);
  });
  private readonly water = new MeshBasicMaterial({
    map: this.reefColour,
    transparent: true,
    opacity: 0.47,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly pools = new InstancedMesh(this.geometry, this.water, 12);
  private readonly vapour = canvasTexture(128, 64, (g) => {
    for (const [x, y, r] of [
      [30, 37, 22],
      [50, 29, 26],
      [73, 31, 26],
      [93, 39, 19],
    ] as const) {
      const fade = g.createRadialGradient(x, y, 0, x, y, r);
      fade.addColorStop(0, 'rgba(255,253,237,.86)');
      fade.addColorStop(0.55, 'rgba(245,250,239,.55)');
      fade.addColorStop(1, 'rgba(255,255,250,0)');
      g.fillStyle = fade;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  private readonly clouds = new SpriteMaterial({
    map: this.vapour,
    transparent: true,
    depthWrite: false,
  });
  private readonly banks = [
    new Sprite(this.clouds),
    new Sprite(this.clouds),
    new Sprite(this.clouds),
  ];
  private readonly at: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  private readonly part = new Object3D();
  crest = 0;

  constructor(private readonly course: Course) {
    this.waves.frustumCulled = this.pools.frustumCulled = false;
    this.group.add(this.pools, this.waves, ...this.banks);
    this.update(0, 0);
  }

  update(metres: number, time: number): void {
    const first = Math.floor((metres - 75) / 37);
    let index = 0;
    for (let row = 0; row < 12; row++) {
      const anchor = (first + row) * 37;
      const shore = 23 + 7.3 * Math.sin(anchor / 211) + 5.2 * Math.cos(anchor / 146);
      this.course.place(anchor, shore + 12, this.at);
      this.part.position.set(this.at.x, 0.034, this.at.z);
      this.part.rotation.set(-Math.PI / 2, 0, -this.at.heading);
      this.part.scale.set(15.2, 32.8, 1);
      this.part.updateMatrix();
      this.pools.setMatrixAt(row, this.part.matrix);
      for (let band = 0; band < 2; band++) {
        for (let piece = 0; piece < 4; piece++) {
          const d = anchor + piece * 9;
          const pulse = time * 0.146 + band * 0.5 + 0.047 * Math.sin(d / 49);
          const phase = pulse - Math.floor(pulse);
          const rise = Math.sin(Math.PI * phase);
          const reef = 8 * Math.exp(-(((d - 1262) / 13) ** 2));
          const lane = shore + 3 + (1 - phase) * 31 + reef + 2.7 * Math.sin(d / 16 + band);
          this.course.place(d, lane, this.at);
          this.part.position.set(this.at.x, 0.12 + 0.61 * rise, this.at.z);
          this.part.rotation.set(
            -Math.PI / 2 + 0.26 * rise,
            0,
            Math.PI / 2 - this.at.heading + 0.13 * Math.sin(d / 15),
          );
          this.part.scale.set(14 * rise + 0.001, 4.4 * rise + 0.001, 1);
          this.part.updateMatrix();
          this.waves.setMatrixAt(index++, this.part.matrix);
          if (row === 3 && band === 0 && piece === 0) this.crest = lane;
        }
      }
    }
    this.waves.instanceMatrix.needsUpdate = this.pools.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < this.banks.length; i++) {
      const j = Math.floor((metres - i * 360) / 1080);
      const d = (j + 1) * 1080 + i * 360;
      const bank = this.banks[i]!;
      this.course.place(d, 275 + 22 * Math.sin(time * 0.014 + i), this.at);
      bank.position.set(this.at.x, 99 + i * 17, this.at.z);
      bank.scale.set(168 + i * 21, 38 + i * 4, 1);
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const resource of [
      this.waves,
      this.pools,
      this.geometry,
      this.material,
      this.water,
      this.reefColour,
      this.foam,
      this.vapour,
      this.clouds,
    ])
      resource.dispose();
  }
}
