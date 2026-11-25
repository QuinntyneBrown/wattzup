import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';
import { Figures, seeded } from './world-kit';
import { etnaWalkerWear, plumePhase } from './world-etna';

/** Soft, overlapping steam banks retain their detail when the race runs on WebGL 2. */
function vapour() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!,
    random = seeded(2118);
  for (let i = 0; i < 34; i++) {
    const x = 36 + random() * 55,
      y = 38 + random() * 45,
      r = 12 + random() * 23;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, 'rgba(245,244,235,0.22)');
    g.addColorStop(1, 'rgba(214,218,215,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

export async function etnaAscent(course: Course) {
  const summitMap = await new TextureLoader().loadAsync('courses/etna-summit.webp');
  summitMap.colorSpace = SRGBColorSpace;
  const group = new Group(),
    resources: { dispose(): void }[] = [summitMap],
    rock = new MeshBasicMaterial({ map: summitMap, alphaTest: 0.42, fog: false });
  const plane = new PlaneGeometry(7200, 2200),
    summit = new Mesh(plane, rock);
  resources.push(plane, rock);
  const lower = course.place(0),
    upper = course.place(course.length),
    dx = upper.x - lower.x,
    dz = upper.z - lower.z,
    length = Math.hypot(dx, dz),
    tx = dx / length,
    tz = dz / length;
  const heading = Math.atan2(-tx, -tz);
  summit.rotation.y = heading;
  summit.position.set(upper.x + tx * 3750, upper.y + 385, upper.z + tz * 3750);
  group.add(summit);
  const steamMap = vapour();
  resources.push(steamMap);
  const vent = new Vector3(-520, 656, 3);
  vent.applyAxisAngle(new Vector3(0, 1, 0), heading).add(summit.position);
  const steam = Array.from({ length: 20 }, (_, i) => {
    const material = new SpriteMaterial({
      map: steamMap,
      color: i % 4 ? 0xf8f6ea : 0xbac1c0,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    resources.push(material);
    const sprite = new Sprite(material);
    group.add(sprite);
    return sprite;
  });
  const hikers = new Group();
  group.add(hikers);
  const people = new Figures(hikers, resources, 22, etnaWalkerWear, 2118, false);
  const rim = course.place(8495, 78);
  const cableStart = course.place(12235, 28),
    cableEnd = course.place(12820, 180);
  const bottom = new Vector3(cableStart.x, cableStart.y + 8, cableStart.z);
  const top = new Vector3(cableEnd.x, cableEnd.y + 86, cableEnd.z);
  const unit = new BoxGeometry(),
    paint = new Map<number, MeshLambertMaterial>();
  resources.push(unit);
  function part(
    owner: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    colour: number,
  ) {
    let material = paint.get(colour);
    if (!material) {
      material = new MeshLambertMaterial({ color: colour });
      paint.set(colour, material);
      resources.push(material);
    }
    const mesh = new Mesh(unit, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, depth);
    owner.add(mesh);
    return mesh;
  }
  const lift = new Group();
  group.add(lift);
  const up = new Vector3(0, 1, 0),
    delta = new Vector3();
  function cable(t: number, into: Vector3) {
    into.lerpVectors(bottom, top, t);
    into.y -= 4 * Math.sin(t * Math.PI * 3) ** 2;
    return into;
  }
  const a = new Vector3(),
    b = new Vector3();
  for (let j = 0; j < 36; j++) {
    cable(j / 36, a);
    cable((j + 1) / 36, b);
    delta.subVectors(b, a);
    const wire = part(
      lift,
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      (a.z + b.z) / 2,
      0.065,
      delta.length(),
      0.065,
      0x45454a,
    );
    wire.quaternion.setFromUnitVectors(up, delta.normalize());
    if (j % 12 === 0) {
      const foot = course.place(12235 + (j / 36) * 585, 28 + (j / 36) * 152).y;
      const h = Math.max(6, a.y - foot);
      part(lift, a.x, a.y - h / 2, a.z, 0.52, h, 0.52, 0x666765);
      part(lift, a.x, a.y - 0.14, a.z, 3.2, 0.4, 0.48, 0x535453);
    }
  }
  const cars = Array.from({ length: 6 }, () => {
    const car = new Group();
    lift.add(car);
    part(car, 0, -0.83, 0, 0.085, 1.66, 0.1, 0x565957);
    part(car, 0, -1.67, 0, 2.18, 0.17, 2.52, 0x656665);
    part(car, 0, -2.24, 0, 2.06, 1.1, 2.46, 0x34424a);
    part(car, 0, -3.07, 0, 2.12, 0.67, 2.48, 0xbb352d);
    for (const side of [-1, 1]) {
      part(car, side * 1.04, -2.2, 0, 0.08, 1.1, 0.13, 0xc74432);
      part(car, side * 1.02, -2.2, -1.19, 0.09, 1.1, 0.1, 0xc74432);
    }
    car.rotation.y = cableStart.heading;
    return car;
  });
  const firstWalker = new Vector3();
  return {
    group,
    get plumeHeight() {
      return steam[0]!.position.y;
    },
    get gondolaPosition() {
      return cars[0]!.position.y;
    },
    get walkerPosition() {
      return firstWalker.x;
    },
    at(time: number, metres: number) {
      for (let i = 0; i < steam.length; i++) {
        const p = steam[i]!,
          t = plumePhase(time, i / steam.length),
          spread = 110 + 245 * t;
        p.position.set(
          vent.x - tz * t * 490,
          vent.y + t * 270 + 24 * Math.sin(t * Math.PI),
          vent.z + tx * t * 490,
        );
        p.scale.set(spread, spread * 0.67, 1);
        p.material.opacity = 0.64 * (1 - t);
      }
      hikers.visible = Math.abs(metres - 8495) < 530;
      if (hikers.visible) {
        const angle = rim.heading;
        for (let i = 0; i < 22; i++) {
          const t = (i * Math.PI * 2) / 22 + time * 0.008,
            u = Math.cos(t) * 63 * (1 + 0.06 * Math.sin(t * 5) + 0.03 * Math.cos(t * 7)),
            v = Math.sin(t) * 47 * (1 + 0.06 * Math.sin(t * 5) + 0.03 * Math.cos(t * 7));
          const x = rim.x - u * Math.sin(angle) - v * Math.cos(angle),
            z = rim.z - u * Math.cos(angle) + v * Math.sin(angle);
          const y =
            rim.y +
            19 +
            (78 - 9.4) * (0.1 + 0.035 * Math.sin(8495 / 580)) +
            2.1 * Math.sin(t * 3) +
            0.32;
          people.set(i, x, y, z, angle - t, 0.98, 0.045 * Math.abs(Math.sin(time * 3 + i)));
          if (i === 0) firstWalker.set(x, y, z);
        }
        people.commit();
      }
      lift.visible = Math.abs(metres - 12490) < 1050;
      for (let i = 0; i < cars.length; i++)
        cable((time * 0.009 + i / cars.length + 0.07) % 1, cars[i]!.position);
    },
    dispose() {
      group.removeFromParent();
      for (const r of resources) r.dispose();
    },
  };
}
