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

/** Pacific breakers, McWay Falls and the moving coastal marine layer. */
export class BigSurCoast {
  readonly group = new Group();
  private readonly foam = canvasTexture(256, 64, (g) => {
    for (let x = 0; x < 256; x++) {
      const y = 18 + 6 * Math.sin(x * 0.054) + 3 * Math.sin(x * 0.17);
      for (let j = 0; j < 20; j++) {
        const noise = (1 + Math.sin(x * 153.7 + j * 39.7)) * 0.5;
        const alpha = Math.sin((Math.PI * x) / 256) * Math.exp(-j * 0.13) * (0.3 + 0.65 * noise);
        g.fillStyle = 'rgba(232,247,244,' + alpha + ')';
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
  private readonly shallows = canvasTexture(96, 96, (g) => {
    const bed = g.createRadialGradient(47, 49, 2, 47, 49, 46);
    bed.addColorStop(0, 'rgba(96,196,179,.85)');
    bed.addColorStop(0.67, 'rgba(108,201,178,.60)');
    bed.addColorStop(1, 'rgba(126,207,190,0)');
    g.fillStyle = bed;
    g.fillRect(0, 0, 96, 96);
  });
  private readonly water = new MeshBasicMaterial({
    map: this.shallows,
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
      fade.addColorStop(0, 'rgba(220,229,228,.44)');
      fade.addColorStop(0.55, 'rgba(232,247,244,.55)');
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
  private readonly cascadeTexture = canvasTexture(32, 128, (g) => {
    const across = g.createLinearGradient(0, 0, 32, 0);
    across.addColorStop(0, 'rgba(236,247,244,0)');
    across.addColorStop(0.32, 'rgba(234,247,244,.78)');
    across.addColorStop(0.67, 'rgba(249,252,248,.91)');
    across.addColorStop(1, 'rgba(231,244,240,0)');
    g.fillStyle = across;
    g.fillRect(0, 0, 32, 128);
  });
  private readonly cascadeMaterial = new MeshBasicMaterial({
    map: this.cascadeTexture,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly cascade = new InstancedMesh(this.geometry, this.cascadeMaterial, 1);
  private readonly spray = new InstancedMesh(this.geometry, this.material, 40);
  private readonly fallsAnchor: CoursePlace = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  fallHeight: number | null = null;
  crest = 0;

  constructor(private readonly course: Course) {
    this.waves.frustumCulled = this.pools.frustumCulled = false;
    this.spray.frustumCulled = this.cascade.frustumCulled = false;
    this.course.place(5844.6, 73, this.fallsAnchor);
    this.group.add(this.pools, this.waves, this.spray, this.cascade, ...this.banks);
    this.update(0, 0);
  }

  update(metres: number, time: number): void {
    const first = Math.floor((metres - 75) / 37);
    let index = 0;
    for (let row = 0; row < 12; row++) {
      const anchor = (first + row) * 37;
      const shore = 73 + 18 * Math.sin(anchor / 289) + 13 * Math.sin(anchor / 106);
      this.course.place(anchor, shore + 12, this.at);
      this.part.position.set(this.at.x, 0.034, this.at.z);
      this.part.rotation.set(-Math.PI / 2, 0, -this.at.heading);
      this.part.scale.set(28.2, 43.8, 1);
      this.part.updateMatrix();
      this.pools.setMatrixAt(row, this.part.matrix);
      for (let band = 0; band < 2; band++) {
        for (let piece = 0; piece < 4; piece++) {
          const d = anchor + piece * 9;
          const pulse = time * 0.146 + band * 0.5 + 0.047 * Math.sin(d / 49);
          const phase = pulse - Math.floor(pulse);
          const rise = Math.sin(Math.PI * phase);
          const rock = 8 * Math.sin(d / 91);
          const lane = shore + 3 + (1 - phase) * 31 + rock + 2.7 * Math.sin(d / 16 + band);
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
    this.spray.visible = Math.abs(metres - 5845) < 530;
    this.cascade.visible = this.spray.visible;
    this.fallHeight = null;
    if (this.spray.visible) {
      const lip = this.fallsAnchor;
      this.part.position.set(
        lip.x + Math.sin(lip.heading) * 1.7,
        14,
        lip.z + Math.cos(lip.heading) * 1.7,
      );
      this.part.rotation.set(0.1, lip.heading, 0, 'YXZ');
      this.part.scale.set(2.05, 24, 1);
      this.part.updateMatrix();
      this.cascade.setMatrixAt(0, this.part.matrix);
      this.cascade.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 40; i++) {
        const f = (time * 0.52 + i / 40) % 1;
        const height = 2 + 24 * (1 - f * f);
        // A thin ribbon separates into strands as it falls; contact with the sand spreads the spray.
        const drift = 0.7 + 2.8 * f + 0.14 * Math.sin(i * 2.41);
        const spread = Math.sin(i * 12.13) * (0.38 + f * 0.62);
        this.part.position.set(
          lip.x + Math.sin(lip.heading) * drift + Math.cos(lip.heading) * spread,
          height,
          lip.z + Math.cos(lip.heading) * drift - Math.sin(lip.heading) * spread,
        );
        this.part.rotation.set(0, lip.heading, Math.PI / 2 + 0.07 * f);
        this.part.scale.set(4.8 + f, 2.9 + 2.6 * f, 1);
        this.part.updateMatrix();
        this.spray.setMatrixAt(i, this.part.matrix);
        if (i === 0) this.fallHeight = height;
      }
      this.spray.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < this.banks.length; i++) {
      const j = Math.round((metres - i * 230) / 740);
      const d = j * 740 + i * 230;
      const bank = this.banks[i]!;
      this.course.place(d, 122 + 53 * Math.sin(time * 0.046 + i), this.at);
      const fade = Math.max(0, Math.min(1, (372 - Math.abs(d - metres)) / 100));
      bank.position.set(this.at.x, this.at.y + 24 + 8 * Math.sin(time * 0.045 + i), this.at.z);
      bank.scale.set((181 + i * 73) * fade, (23 + i * 3) * fade, 1);
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const resource of [
      this.cascade,
      this.cascadeMaterial,
      this.cascadeTexture,
      this.spray,
      this.waves,
      this.pools,
      this.geometry,
      this.material,
      this.water,
      this.shallows,
      this.foam,
      this.vapour,
      this.clouds,
    ])
      resource.dispose();
  }
}
