import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
} from 'three/webgpu';
import { positionWorld, texture } from 'three/tsl';
import type { Course } from './course';
import { seeded } from './world-kit';
import { chichenForest } from './chichen-forest';
import { limestoneTexture, steleTexture, textileTexture } from './chichen-textures';

export function causewaySurface() {
  const tile = limestoneTexture();
  tile.wrapS = tile.wrapT = RepeatWrapping;
  const material = new MeshStandardNodeMaterial({ roughness: 0.97 });
  material.colorNode = texture(tile, positionWorld.xz.mul(0.72)).rgb;
  return { tile, material };
}

/** Golden afternoon with bounded visitor groups, wheeling parrots and slowly moving cumulus. */
export async function chichenPlaza(course: Course) {
  const forest = await chichenForest(course);
  const root = new Group();
  root.add(forest.root);
  const sphere = new SphereGeometry(1, 10, 6),
    block = new BoxGeometry(1, 1, 1),
    cone = new CylinderGeometry(0.4, 1, 1, 7);
  const paint = new MeshBasicMaterial(),
    unit = new Object3D(),
    color = new Color();
  const plumage = new InstancedMesh(sphere, paint, 6 * 5),
    figures = new InstancedMesh(sphere, paint, 14 * 7);
  const hats = new InstancedMesh(cone, paint, 14),
    legs = new InstancedMesh(block, paint, 14 * 2);
  for (const mesh of [plumage, figures, hats, legs]) {
    mesh.frustumCulled = false;
    root.add(mesh);
  }
  const people = Array.from({ length: 14 }, (_, i) =>
    course.place((i < 6 ? 625 : i < 11 ? 7291 : 12580) + (i % 6) * 5.2, i % 2 ? -4.6 : 5.1),
  );
  const birdStations = [155, 665, 3240, 7365, 8150, 12630].map((d) => course.place(d, -3.5));
  const piece = (
    mesh: InstancedMesh,
    index: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    angle: number,
    tilt: number,
    tint: number,
  ) => {
    unit.position.set(x, y, z);
    unit.rotation.set(0, angle, tilt, 'YXZ');
    unit.scale.set(sx, sy, sz);
    unit.updateMatrix();
    mesh.setMatrixAt(index, unit.matrix);
    mesh.setColorAt(index, color.setHex(tint));
  };
  const billboard = new PlaneGeometry(1, 1);
  const carved = new MeshBasicMaterial({ map: steleTexture(), side: DoubleSide });
  const woven = [0, 1, 2, 3].map(
    (i) => new MeshBasicMaterial({ map: textileTexture(i), side: DoubleSide }),
  );
  for (let i = 0; i < 19; i++) {
    const vendor = i < 9,
      at = course.place(vendor ? 608 + i * 10 : 7901 + (i - 9) * 1.2, vendor ? 5.51 : 7.4);
    const face = new Mesh(billboard, vendor ? woven[i % 4]! : carved);
    face.position.set(at.x, at.y + (vendor ? 1.42 : 0.64), at.z);
    face.rotation.y = at.heading + Math.PI / 2 - 0.13;
    face.scale.set(vendor ? 1.54 : 1.04, vendor ? 1.34 : 0.85, 1);
    root.add(face);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext('2d')!,
    rng = seeded(2099);
  for (let i = 0; i < 95; i++) {
    const x = 36 + rng() * 184,
      r = 11 + rng() * 24;
    const y = 80 - Math.sin(((x - 25) / 215) * Math.PI) * rng() * 41;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, i < 25 ? 'rgba(193,203,203,.7)' : 'rgba(255,251,234,.78)');
    grad.addColorStop(0.58, 'rgba(248,246,235,.55)');
    grad.addColorStop(1, 'rgba(255,255,252,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  const cloudTexture = new CanvasTexture(canvas),
    vapor = new MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
  const clouds = [0, 1, 2, 3].map(() => {
    const mesh = new Mesh(billboard, vapor);
    mesh.scale.set(265, 104, 1);
    root.add(mesh);
    return mesh;
  });
  const view = { lane: 0, rise: 0 };
  const skyOrigin = course.place(0);
  let wingAngle = 0,
    walkerX = 0;
  function update(seconds: number, metres: number) {
    forest.follow(metres);
    for (let i = 0; i < people.length; i++) {
      const p = people[i]!,
        t = seconds * 0.64 + i,
        walk = 2.5 * Math.sin(t * 0.31);
      const x = p.x - Math.sin(p.heading) * walk,
        z = p.z - Math.cos(p.heading) * walk,
        y = p.y - 0.27;
      if (i === 7) walkerX = x;
      const skin = i % 2 ? 0xb78565 : 0xd0a483,
        top = [0x4e8274, 0xb86646, 0xe6c588, 0x56728f][i % 4]!;
      piece(figures, 7 * i, x, y + 0.98, z, 0.22, 0.34, 0.14, p.heading, 0, top);
      piece(figures, 7 * i + 1, x, y + 1.48, z, 0.135, 0.18, 0.13, p.heading, 0, skin);
      piece(figures, 7 * i + 2, x, y + 1.61, z, 0.24, 0.04, 0.21, p.heading, 0, 0xc8aa72);
      piece(hats, i, x, y + 1.68, z, 0.14, 0.14, 0.13, p.heading, 0, 0xc8ab7c);
      for (let side = 0; side < 2; side++) {
        const l = side ? 0.14 : -0.14,
          j = side ? 1 : -1;
        piece(
          legs,
          i * 2 + side,
          x + l,
          y + 0.39,
          z + 0.105 * j * Math.sin(t * 2.3),
          0.105,
          0.68,
          0.13,
          p.heading,
          0,
          0x53565a,
        );
        piece(
          figures,
          i * 7 + 3 + side,
          x + l * 1.63,
          y + 0.94,
          z - 0.06 * j * Math.sin(t * 2.3),
          0.065,
          0.24,
          0.08,
          p.heading,
          0.16 * j,
          skin,
        );
        piece(
          figures,
          i * 7 + 5 + side,
          x + l,
          y + 0.08,
          z + 0.105 * j * Math.sin(t * 2.3),
          0.09,
          0.08,
          0.15,
          p.heading,
          0,
          0x62594a,
        );
      }
    }
    for (let i = 0; i < birdStations.length; i++) {
      const p = birdStations[i]!,
        t = seconds * 0.43 + i,
        x = p.x + 9 * Math.cos(t),
        y = p.y + 5 + 2 * Math.sin(t * 0.7),
        z = p.z + 8 * Math.sin(t);
      const wing = 0.74 * Math.sin(seconds * 4.3 + i);
      if (!i) wingAngle = wing;
      piece(plumage, i * 5, x, y, z, 0.16, 0.17, 0.43, t, 0, 0x6a963c);
      piece(plumage, i * 5 + 1, x, y + 0.1, z - 0.27, 0.16, 0.16, 0.16, t, 0, 0xb38e43);
      piece(plumage, i * 5 + 2, x, y - 0.05, z + 0.38, 0.12, 0.09, 0.38, t, 0, 0x538979);
      for (let side = 0; side < 2; side++) {
        const sign = side ? 1 : -1,
          l = sign * 0.33;
        piece(
          plumage,
          i * 5 + 3 + side,
          x + l * Math.cos(t),
          y + 0.06,
          z - l * Math.sin(t),
          0.42,
          0.064,
          0.17,
          t,
          sign * wing,
          0x5a9150,
        );
      }
    }
    const from = course.place(metres, 0, skyOrigin);
    for (let i = 0; i < clouds.length; i++) {
      const cloud = clouds[i]!,
        a = from.heading + (i - 1.5) * 0.44;
      cloud.position.set(
        from.x - Math.sin(a) * 650 + 12 * Math.sin(seconds * 0.011 + i),
        from.y + 116 + (i % 2) * 28,
        from.z - Math.cos(a) * 650,
      );
      cloud.rotation.y = a;
    }
    for (const batch of [figures, hats, legs, plumage]) batch.instanceMatrix.needsUpdate = true;
  }
  function sightline(d: number) {
    const cenote = Math.max(0, 1 - Math.abs(d - 3180) / 101);
    const temple = Math.max(0, 1 - Math.abs(d - 8100) / 160);
    view.lane = -6.1 * cenote - 2 * temple;
    view.rise = -0.6 * cenote + 1.0 * temple;
    return view;
  }
  update(0, 0);
  return {
    root,
    update,
    sightline,
    get wingAngle() {
      return wingAngle;
    },
    get walkerX() {
      return walkerX;
    },
    dispose() {
      root.clear();
      forest.dispose();
      for (const m of [plumage, figures, legs, hats]) m.dispose();
      for (const mat of [carved, ...woven]) {
        mat.map?.dispose();
        mat.dispose();
      }
      sphere.dispose();
      block.dispose();
      cone.dispose();
      paint.dispose();
      billboard.dispose();
      cloudTexture.dispose();
      vapor.dispose();
    },
  };
}
