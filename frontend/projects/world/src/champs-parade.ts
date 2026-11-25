import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshStandardNodeMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  type DirectionalLight,
} from 'three/webgpu';
import { positionWorld, texture } from 'three/tsl';
import type { Course } from './course';
import type { CourseCyclistKit, RiderModel } from './course-cyclist';
import type { RiderBatch } from './rider-batch';
import { seeded } from './world-kit';

/** A four-metre tile of laid granite setts. Mipmaps preserve the joints in the distance. */
export function parisPave() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const g = canvas.getContext('2d')!;
  const rng = seeded(2096);
  g.fillStyle = '#766e62';
  g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 24; row++) {
    const dy = 512 / 24;
    const cols = row % 3 === 0 ? 17 : 18;
    const dx = 512 / cols;
    for (let col = -1; col <= cols; col++) {
      const x = (col + (row % 2) * 0.5) * dx,
        y = row * dy;
      const value = Math.round(151 + rng() * 36);
      g.fillStyle = 'rgb(' + value + ',' + (value - 6) + ',' + (value - 13) + ')';
      g.beginPath();
      g.roundRect(x + 1.15, y + 1.15, dx - 2.15, dy - 2.45, 2 + rng() * 2);
      g.fill();
      g.fillStyle = 'rgba(244,234,214,.26)';
      g.fillRect(x + 4, y + 2, dx - 10, 1);
      for (let speck = 0; speck < 34; speck++) {
        g.fillStyle = speck % 3 ? 'rgba(58,48,47,.14)' : 'rgba(244,240,231,.32)';
        g.fillRect(x + 2 + rng() * (dx - 4), y + 2 + rng() * (dy - 4), 1.5, 1.4);
      }
    }
  }
  const tile = new CanvasTexture(canvas);
  tile.colorSpace = SRGBColorSpace;
  tile.wrapS = tile.wrapT = RepeatWrapping;
  tile.anisotropy = 8;
  const material = new MeshStandardNodeMaterial({ roughness: 0.83 });
  material.colorNode = texture(tile, positionWorld.xz.mul(0.25)).rgb;
  return { tile, material };
}

const TEAMS = [0xbed754, 0x3d717a, 0x527cbe, 0xb34649, 0xeac85b, 0x766b99, 0x4e9e9c, 0xd87653];
function cloth() {
  const vertices: number[] = [],
    colours: number[] = [],
    indices: number[] = [];
  for (let stripe = 0; stripe < 3; stripe++) {
    const tint = new Color([0x214ca4, 0xf8efda, 0xc43b42][stripe]);
    for (let j = 0; j <= 4; j++) {
      const u = (stripe + j / 4) / 3;
      for (const dy of [0, -1.12]) {
        vertices.push(u * 1.86, dy - 0.14 * u, 0.18 * Math.sin(u * 7));
        colours.push(tint.r, tint.g, tint.b);
      }
      if (j) {
        const n = vertices.length / 3 - 4;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colours, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export class ChampsParade {
  readonly root = new Group();
  private readonly owned: { dispose(): void }[] = [];
  private readonly cyclists: RiderModel[] = [];
  private readonly masts: { x: number; y: number; z: number; h: number }[] = [];
  private readonly flags: InstancedMesh;
  private readonly pose = new Object3D();
  private readonly lamps = new MeshBasicMaterial({
    color: 0xffbf79,
    toneMapped: false,
    transparent: true,
    opacity: 0.1,
  });
  private readonly arcLight = new MeshBasicMaterial({
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    vertexColors: true,
    opacity: 0,
    toneMapped: false,
  });
  private readonly at;
  private readonly dayStrength;
  flagAngle = 0;
  sprintLane = 0;
  constructor(
    private readonly course: Course,
    kit: CourseCyclistKit,
    batch: RiderBatch,
    private readonly sun: DirectionalLight,
  ) {
    this.at = course.place(0);
    this.dayStrength = sun.intensity;
    const lap = course.length / 3;
    for (let d = 0; d < lap; d += 25) {
      const at = course.place(d, 8.14);
      this.masts.push({ x: at.x, y: at.y, z: at.z, h: at.heading });
    }
    const fabric = cloth(),
      pole = new CylinderGeometry(0.045, 0.075, 6.4, 6),
      bulb = new BoxGeometry(0.45, 0.53, 0.45);
    const paint = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 1 });
    const iron = new MeshStandardMaterial({ color: 0x655e54, roughness: 0.84 });
    this.flags = new InstancedMesh(fabric, paint, this.masts.length);
    const poles = new InstancedMesh(pole, iron, this.masts.length),
      lights = new InstancedMesh(bulb, this.lamps, this.masts.length);
    this.masts.forEach((p, i) => {
      this.pose.position.set(p.x, p.y + 3.2, p.z);
      this.pose.updateMatrix();
      poles.setMatrixAt(i, this.pose.matrix);
      this.pose.position.y = p.y + 6.43;
      this.pose.updateMatrix();
      lights.setMatrixAt(i, this.pose.matrix);
    });
    this.root.add(this.flags, poles, lights);
    this.owned.push(fabric, pole, bulb, paint, iron, this.lamps, this.flags, poles, lights);
    for (const [i, colour] of TEAMS.entries()) {
      const rider = kit.make(new Color(colour), 21 + i, false, 0.44);
      this.cyclists.push(rider);
      this.root.add(rider.group);
      batch.add(rider);
    }
    const stone = new BufferGeometry();
    const lit: number[] = [],
      shades: number[] = [];
    const arcX = (lap - 2 * Math.PI * 31) / 2;
    // Grazing floodlights on the four outside pier faces; the open vault remains dark.
    for (const face of [-1, 1]) {
      for (const side of [-1, 1]) {
        const x = arcX + face * 10.63,
          z = side * 15;
        lit.push(
          x,
          33.8,
          z - 4.8,
          x,
          33.8,
          z + 4.8,
          x,
          49.5,
          z + 2.6,
          x,
          33.8,
          z - 4.8,
          x,
          49.5,
          z + 2.6,
          x,
          49.5,
          z - 2.6,
        );
        for (const v of [1, 1, 0.025, 1, 0.025, 0.025]) shades.push(v * 0.9, v * 0.53, v * 0.19);
      }
    }
    stone.setAttribute('position', new Float32BufferAttribute(lit, 3));
    stone.setAttribute('color', new Float32BufferAttribute(shades, 3));
    this.root.add(new Mesh(stone, this.arcLight));
    this.owned.push(stone, this.arcLight);
    this.update(0, 0, false);
  }
  update(seconds: number, ridden: number, reduced: boolean) {
    const t = reduced ? 0 : seconds;
    this.masts.forEach((p, i) => {
      this.pose.position.set(p.x, p.y + 6.05, p.z);
      this.pose.rotation.set(
        0.06 * Math.cos(t * 2.7 + i),
        p.h + 0.37 + 0.31 * Math.sin(t * 3.4 + i * 1.3),
        0,
        'YXZ',
      );
      this.pose.updateMatrix();
      this.flags.setMatrixAt(i, this.pose.matrix);
      if (!i) this.flagAngle = this.pose.rotation.y;
    });
    this.flags.instanceMatrix.needsUpdate = true;
    const twilight = Math.min(1, Math.max(ridden / this.course.length, seconds / 1500));
    this.sun.intensity = this.dayStrength * (1 - 0.47 * twilight);
    this.arcLight.opacity = twilight * twilight * 0.66;
    this.lamps.opacity = 0.13 + 0.84 * twilight;
    const sprint = Math.max(0, Math.min(1, (ridden - this.course.length + 300) / 235));
    this.cyclists.forEach((rider, i) => {
      const rank = Math.floor(i / 2),
        lane = ((i % 2) - 0.5) * 1.2 + (i - 3.5) * 0.77 * sprint + 0.13 * Math.sin(t * 0.92 + i);
      const d =
        (ridden + 30 - rank * 3.7 + Math.sin(t * 0.7 + i) * 0.85 + this.course.length) %
        this.course.length;
      const at = this.course.place(d, lane, this.at);
      rider.group.position.set(at.x, at.y + 0.02, at.z);
      rider.group.rotation.set(at.pitch, at.heading, 0, 'YXZ');
      rider.pose(t * (8.9 + 2.6 * sprint) + i * 0.51, sprint * 0.73);
      if (!i) this.sprintLane = lane;
    });
  }
  dispose() {
    this.root.clear();
    for (const rider of this.cyclists) for (const asset of rider.owned) asset.dispose();
    for (const asset of this.owned) asset.dispose();
  }
}
