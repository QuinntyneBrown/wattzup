import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import type { Course } from './course';
import { seeded } from './world-kit';

function umbrella() {
  const position: number[] = [],
    tint: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5,
      b = ((i + 1) * Math.PI) / 5,
      m = (a + b) / 2;
    const crown = [0, 0.32, 0],
      edge = [Math.cos(a) * 0.66, 0, Math.sin(a) * 0.66],
      next = [Math.cos(b) * 0.66, 0, Math.sin(b) * 0.66],
      rib = [Math.cos(m) * 0.38, 0.22, Math.sin(m) * 0.38],
      lip = [Math.cos(m) * 0.64, 0.046, Math.sin(m) * 0.64];
    for (const tri of [
      [crown, rib, edge],
      [crown, next, rib],
      [edge, rib, lip],
      [rib, next, lip],
    ]) {
      position.push(...tri.flat());
      const f = i % 2 ? 0.77 : 1;
      for (let j = 0; j < 3; j++) tint.push(f, f, f);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(tint, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function glasgowCircuit(course: Course) {
  const group = new Group(),
    rng = seeded(2127),
    loader = new TextureLoader();
  const tenement = loader.load('courses/glasgow-tenements.webp'),
    chambers = loader.load('courses/glasgow-chambers.webp');
  tenement.colorSpace = chambers.colorSpace = SRGBColorSpace;
  tenement.anisotropy = 4;
  const wall = new MeshBasicMaterial({ map: tenement, side: DoubleSide });
  const civic = new MeshBasicMaterial({ map: chambers, side: DoubleSide, alphaTest: 0.55 });
  const faceGeometry = new PlaneGeometry(98, 44);
  const face = new Mesh(faceGeometry, civic);
  const start = course.place(0);
  face.position.set(start.x + 174.55, course.place(110).y + 22.14, -14);
  face.rotation.y = -Math.PI / 2;
  group.add(face);
  const geom = {
    body: new SphereGeometry(1, 9, 7),
    post: new CylinderGeometry(1, 1, 1, 7),
    hood: umbrella(),
  };
  const sizes = { body: 1700, post: 1300, hood: 350 };
  const lit = new MeshLambertMaterial(),
    cloth = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  const batches = {
    body: new InstancedMesh(geom.body, lit, sizes.body),
    post: new InstancedMesh(geom.post, lit, sizes.post),
    hood: new InstancedMesh(geom.hood, cloth, sizes.hood),
  };
  const scratch = new Object3D(),
    colour = new Color(),
    count = { body: 0, post: 0, hood: 0 };
  for (const batch of Object.values(batches)) {
    batch.frustumCulled = false;
    group.add(batch);
  }
  const people: {
    station: number;
    x: number;
    y: number;
    z: number;
    h: number;
    phase: number;
    height: number;
    cover: boolean;
    coat: number;
    shade: number;
    skin: number;
  }[] = [];
  for (const [from, to] of [
    [-190, 169],
    [1320, 1490],
    [3460, 3670],
    [6090, 6285],
    [9090, 9410],
    [12680, 12890],
  ]) {
    for (let d = from!; d < to!; d += 1.6 + rng() * 1.6) {
      for (const side of [-1, 1]) {
        const station = (d + course.length) % course.length,
          lane = side * (6.47 + rng() * 1.18);
        const at = course.place(station, lane);
        people.push({
          station,
          x: at.x,
          y: at.y + 0.14,
          z: at.z,
          h: at.heading + side * 1.51,
          phase: rng() * 6,
          height: 0.85 + 0.24 * rng(),
          cover: rng() > 0.25,
          coat: [0x314456, 0x9c543e, 0x64806a, 0xc39b39, 0x56676b][Math.floor(rng() * 5)]!,
          shade: [0x29364b, 0x833c49, 0xb8ad72, 0x486853, 0x52505a][Math.floor(rng() * 5)]!,
          skin: [0xb68668, 0xce9f81, 0x967157][Math.floor(rng() * 3)]!,
        });
      }
    }
  }
  function part(
    kind: keyof typeof batches,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    yaw: number,
    roll: number,
    tone: number,
  ) {
    const i = count[kind]++;
    scratch.position.set(x, y, z);
    scratch.rotation.set(0, yaw, roll, 'YXZ');
    scratch.scale.set(w, h, depth);
    scratch.updateMatrix();
    batches[kind].setMatrixAt(i, scratch.matrix);
    batches[kind].setColorAt(i, colour.setHex(tone));
  }
  const drops = new SphereGeometry(1, 5, 3),
    water = new MeshBasicMaterial({
      color: 0xc1cbd0,
      transparent: true,
      opacity: 0.39,
      depthWrite: false,
    });
  const spray = new InstancedMesh(drops, water, 28);
  spray.frustumCulled = false;
  group.add(spray);
  const state = { umbrellaHeight: 0, sprayHeight: 0 },
    wheel = course.place(0);
  function update(time: number, metres: number, speed: number, reduced: boolean) {
    count.body = count.post = count.hood = 0;
    const s = ((metres % course.length) + course.length) % course.length;
    let nearest = Infinity;
    for (const person of people) {
      const delta = Math.abs(person.station - s),
        gap = Math.min(delta, course.length - delta);
      if (gap > 123) continue;
      const { x, y, z, h, height: a, coat, skin, phase } = person;
      const move = reduced ? 0 : Math.sin(time * 2 + phase),
        cy = y + 1.99 * a + 0.038 * move;
      const dx = 0.105 * Math.cos(h),
        dz = -0.105 * Math.sin(h);
      for (const side of [-1, 1]) {
        part(
          'post',
          x + side * dx,
          y + 0.39 * a,
          z + side * dz,
          0.067,
          0.73 * a,
          0.08,
          h,
          0,
          0x3d4548,
        );
        part('body', x + side * dx, y + 0.09, z + side * dz, 0.092, 0.08, 0.15, h, 0, 0x333334);
      }
      part('body', x, y + 1.04 * a, z, 0.247, 0.41 * a, 0.158, h, 0.022 * move, coat);
      part('body', x, y + 1.53 * a, z, 0.145, 0.18, 0.135, h, 0, skin);
      part('body', x, y + 1.66 * a, z, 0.151, 0.085, 0.143, h, 0, coat);
      if (person.cover) {
        part('post', x + dx, y + 1.52 * a, z + dz, 0.017, 0.89, 0.017, h, 0.027 * move, 0x584e46);
        part('hood', x + dx, cy, z + dz, 1, 1, 1, h, 0.08 * move, person.shade);
        if (gap < nearest) {
          nearest = gap;
          state.umbrellaHeight = cy;
        }
      }
    }
    for (const kind of ['body', 'post', 'hood'] as const) {
      const batch = batches[kind];
      batch.count = count[kind];
      batch.instanceMatrix.needsUpdate = true;
      if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
    }
    spray.visible = !reduced && speed > 1;
    if (spray.visible) {
      course.place(metres - 0.55, 0, wheel);
      spray.position.set(wheel.x, wheel.y + 0.035, wheel.z);
      spray.rotation.y = wheel.heading;
      for (let i = 0; i < 28; i++) {
        const phase = (time * 3.3 + i * 0.618) % 1;
        scratch.position.set(
          Math.sin(i * 13.1) * phase * 0.17,
          0.06 + phase * (1 - phase) * 1.42,
          phase * (0.56 + Math.min(1, speed / 44) * 0.75),
        );
        scratch.scale.set(0.014 + phase * 0.011, 0.018 + 0.045 * (1 - phase), 0.02 + 0.027 * phase);
        scratch.rotation.set(0, 0, 0);
        scratch.updateMatrix();
        spray.setMatrixAt(i, scratch.matrix);
        if (i === 0) state.sprayHeight = scratch.position.y;
      }
      spray.instanceMatrix.needsUpdate = true;
    }
  }
  return {
    group,
    state,
    wall,
    update,
    dispose() {
      group.removeFromParent();
      for (const b of Object.values(batches)) b.dispose();
      spray.dispose();
      for (const g of Object.values(geom)) g.dispose();
      for (const owned of [drops, water, lit, cloth, faceGeometry, civic, wall, chambers, tenement])
        owned.dispose();
      group.clear();
    },
  };
}
