import { positionWorld, texture, vec2 } from 'three/tsl';
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  SphereGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import type { Course } from './course';
import { seeded } from './world-kit';
import { caribanaCyclists } from './caribana-cyclists';

function ground(distance: number, lane: number, heading: number) {
  const left = -lane,
    edge = Math.max(0, Math.abs(left) - 5.8),
    fade = Math.max(0, Math.min(1, (distance - 165) / 230, (8660 - distance) / 230));
  return (
    -0.12 +
    fade *
      (-0.23 * left * Math.cos(heading + Math.PI / 2 - 1) * Math.min(1, edge / 10) +
        Math.min(edge * 0.08, 4.6) * Math.sin(distance / 50 + left / 24)) +
    Math.max(0, edge - 38) * (1 - fade) * 0.12
  );
}

/** The car-free Sellaronda Bike Day road framed by the three fixed mountain groups. */
export async function gardenaPass(course: Course) {
  const group = new Group(),
    resources: { dispose(): void }[] = [];
  const loader = new TextureLoader(),
    maps: Texture[] = [];
  const plain = new MeshLambertMaterial({ vertexColors: true });
  resources.push(plain);
  let kit: Awaited<ReturnType<typeof caribanaCyclists>>;
  try {
    for (const name of [
      'sella',
      'cir',
      'sassolungo',
      'larches',
      'rifugi',
      'tarmac',
      'cloud',
      'turf',
      'limestone',
    ]) {
      const map = await loader.loadAsync('courses/gardena-' + name + '.webp');
      map.colorSpace = SRGBColorSpace;
      maps.push(map);
      resources.push(map);
    }
    kit = await caribanaCyclists(plain, true);
    resources.push(kit);
  } catch (error) {
    for (const r of resources) r.dispose();
    throw error;
  }
  const [sella, cir, sassolungo, forest, fronts, tarmac, cloud, meadow, rock] = maps;
  function surface(map: Texture, size: number) {
    map.wrapS = map.wrapT = RepeatWrapping;
    map.anisotropy = 4;
    const paint = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
    const coords = positionWorld.xz.add(positionWorld.y.mul(vec2(0.21, 0.54))).div(size);
    paint.colorNode = texture(map, coords).rgb;
    resources.push(paint);
    return paint;
  }

  const materials = {
    Pasture: surface(meadow!, 3.3),
    Scree: surface(rock!, 2.2),
    Tarmac: surface(tarmac!, 1.45),
  };
  const mid = course.place(4250);
  const base = course.place(0),
    end = course.place(course.length);
  const axis = Math.atan2(base.x - end.x, base.z - end.z);
  function massif(
    map: Texture,
    bearing: number,
    range: number,
    width: number,
    height: number,
    elevation: number,
  ) {
    const geo = new PlaneGeometry(width, height),
      mat = new MeshBasicMaterial({ map, side: DoubleSide, alphaTest: 0.4, fog: false });
    const mesh = new Mesh(geo, mat);
    mesh.rotation.y = bearing;
    mesh.position.set(
      mid.x - Math.sin(bearing) * range,
      elevation,
      mid.z - Math.cos(bearing) * range,
    );
    group.add(mesh);
    resources.push(geo, mat);
  }
  massif(sella!, axis - 0.72, 3800, 6800, 1560, 2230);
  massif(cir!, axis + 0.71, 4100, 7200, 1620, 2240);
  massif(sassolungo!, axis + Math.PI - 0.13, 4350, 7900, 1950, 2080);
  const cloudGeo = new PlaneGeometry(1250, 240),
    cloudPaint = new MeshBasicMaterial({
      map: cloud,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
  resources.push(cloudGeo, cloudPaint);
  const sky = Array.from({ length: 7 }, (_, i) => {
    const a = (i * Math.PI * 2) / 7,
      mesh = new Mesh(cloudGeo, cloudPaint),
      x = mid.x - 5400 * Math.sin(a),
      z = mid.z - 5400 * Math.cos(a);
    mesh.rotation.y = a;
    mesh.position.set(x, 3220 + (i % 3) * 125, z);
    group.add(mesh);
    return { mesh, x };
  });
  const trees = new MeshBasicMaterial({ map: forest, alphaTest: 0.45, side: DoubleSide });
  const rng = seeded(2124),
    transform = new Object3D();
  const plots: { mesh: InstancedMesh; centre: number }[] = [];
  resources.push(trees);
  for (let species = 0; species < 4; species++) {
    const geometry = new PlaneGeometry(1, 1).translate(0, 0.5, 0),
      uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setX(i, (species + uv.getX(i)) * 0.25);
    resources.push(geometry);
    for (let a = 0; a < course.length; a += 200) {
      const count = a < 2200 ? 30 : a < 5300 ? 18 : a < 8150 ? 8 : 4;
      const mesh = new InstancedMesh(geometry, trees, count * 2);
      let used = 0;
      for (let i = 0; i < count; i++) {
        const d = a + rng() * 200,
          lane = (rng() > 0.5 ? 1 : -1) * (9 + rng() * 43);
        if (
          d > 8610 ||
          (d < 180 && Math.abs(lane) < 29) ||
          Math.abs(d - 1510) < 73 ||
          (Math.abs(d - 3210) < 85 && lane > 0)
        )
          continue;
        const p = course.place(d, lane),
          height = (species === 0 ? 6 : 9) + rng() * 8;
        transform.position.set(p.x, p.y + ground(d, lane, p.heading) - 0.36, p.z);
        transform.rotation.y = p.heading + (rng() - 0.5) * 1.8;
        transform.scale.set(height * (species === 2 ? 0.66 : 0.79), height, 1);
        transform.updateMatrix();
        mesh.setMatrixAt(used++, transform.matrix);
        transform.rotation.y += Math.PI * 0.5;
        transform.updateMatrix();
        mesh.setMatrixAt(used++, transform.matrix);
      }
      mesh.count = used;
      mesh.computeBoundingSphere();
      group.add(mesh);
      resources.push(mesh);
      plots.push({ mesh, centre: a + 100 });
    }
  }
  const wood = new MeshLambertMaterial({ map: fronts, side: DoubleSide });
  resources.push(wood);
  const buildings: { site: Group; d: number }[] = [];
  for (const [d, l, w, depth, height, tile] of [
    [142, -18, 11, 7, 4.4, 0],
    [422, 23, 12, 8, 4.4, 0],
    [1498, 13, 9, 6, 4.4, 0],
    [1528, -23, 12, 7, 4.4, 0],
    [2720, -27, 9, 6, 4.4, 0],
    [3770, 29, 10, 7, 4.4, 0],
    [5210, 24, 9, 7, 4.4, 0],
    [6260, -26, 11, 7, 4.4, 0],
    [7300, 29, 8, 5, 4.4, 0],
    [8813, 18, 23, 11, 7.9, 1],
    [8846, -22, 29, 13, 9.2, 2],
    [8903, 28, 31, 13, 9.2, 1],
  ] as const) {
    const p = course.place(d, l),
      site = new Group();
    site.position.set(p.x, p.y + (tile === 0 ? ground(d, l, p.heading) - 0.36 : -0.31), p.z);
    site.rotation.y = p.heading;
    for (let side = 0; side < 4; side++) {
      const angle = (side * Math.PI) / 2,
        geo = new PlaneGeometry(side % 2 ? w : depth, height);
      const uv = geo.getAttribute('uv');
      for (let j = 0; j < uv.count; j++) uv.setX(j, (tile + uv.getX(j)) / 3);
      const face = new Mesh(geo, wood);
      face.rotation.y = angle;
      face.position.set(
        Math.sin(angle) * (depth * 0.5 + 0.22),
        height * 0.5,
        Math.cos(angle) * (w * 0.5 + 0.22),
      );
      site.add(face);
      resources.push(geo);
    }
    group.add(site);
    buildings.push({ site, d });
  }
  const unit = new BoxGeometry();
  const rounded = new SphereGeometry(0.5, 10, 8),
    taper = new CylinderGeometry(0.37, 0.5, 1, 7);
  resources.push(unit, rounded, taper);
  const colours = new Map<number, MeshLambertMaterial>();
  function block(
    owner: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    tone: number,
    shape = unit as import('three/webgpu').BufferGeometry,
  ) {
    let paint = colours.get(tone);
    if (!paint) {
      paint = new MeshLambertMaterial({ color: tone });
      colours.set(tone, paint);
      resources.push(paint);
    }
    const mesh = new Mesh(shape, paint);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, depth);
    owner.add(mesh);
    return mesh;
  }
  const cattle = new Group(),
    heads: Group[] = [];
  group.add(cattle);
  for (let i = 0; i < 10; i++) {
    const d = 1433 + i * 7.5,
      lane = (i % 4 === 0 ? 1 : -1) * (7.1 + (i % 3) * 2.05),
      p = course.place(d, lane);
    const cow = new Group();
    cow.position.set(p.x, p.y + ground(d, lane, p.heading), p.z);
    cow.rotation.y = p.heading + 1.2 * Math.sin(i + 1);
    cattle.add(cow);
    const hide = i % 3 ? 0x9a6850 : 0xa99c84;
    block(cow, 0, 1.04, 0, 0.77, 0.79, 1.58, hide, rounded);
    block(cow, -0.02, 1.27, 0.35, 0.78, 0.32, 0.39, 0xddd6be, rounded);
    for (const x of [-0.26, 0.26])
      for (const z of [-0.54, 0.54]) block(cow, x, 0.41, z, 0.16, 0.82, 0.17, hide, taper);
    const neck = new Group();
    neck.position.set(0, 1.17, -0.61);
    cow.add(neck);
    block(neck, 0, 0.03, -0.28, 0.44, 0.48, 0.64, hide, rounded);
    block(neck, 0, -0.12, -0.61, 0.36, 0.24, 0.19, 0xc8af9b, rounded);
    block(neck, 0, -0.3, -0.15, 0.19, 0.22, 0.17, 0xa18a4d, taper);
    for (const x of [-0.24, 0.24]) block(neck, x, 0.16, -0.26, 0.26, 0.11, 0.13, hide, rounded);
    for (const x of [-0.195, 0.195]) {
      block(neck, x, 0.09, -0.47, 0.065, 0.065, 0.05, 0x242622, rounded);
      block(neck, x, 0.27, -0.19, 0.09, 0.22, 0.1, 0xd4c3a1, taper);
    }
    block(cow, 0.03, 0.93, 0.76, 0.09, 0.77, 0.11, hide, taper);
    heads.push(neck);
  }
  const signs: { g: Group; d: number }[] = [];
  function sign(
    d: number,
    lane: number,
    title: string,
    sub: string,
    width: number,
    banner = false,
  ) {
    const p = course.place(d, lane),
      g = new Group();
    g.position.set(p.x, p.y + ground(d, lane, p.heading), p.z);
    g.rotation.y = p.heading;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = banner ? '#216e71' : '#315b80';
    ctx.fillRect(0, 0, 640, 180);
    ctx.fillStyle = '#fff9e5';
    ctx.textAlign = 'center';
    ctx.font = 'bold 57px sans-serif';
    ctx.fillText(title, 320, 80, 610);
    ctx.font = '35px sans-serif';
    ctx.fillText(sub, 320, 139, 610);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    const paint = new MeshBasicMaterial({ map, side: DoubleSide }),
      geo = new PlaneGeometry(width, width * 0.26),
      face = new Mesh(geo, paint);
    const y = banner ? 4.65 : 2.13;
    face.position.y = y;
    g.add(face);
    for (const side of [-1, 1])
      block(g, side * width * 0.47, y / 2 - 0.25, -0.12, 0.11, y + 0.56, 0.11, 0x706c60);
    group.add(g);
    signs.push({ g, d });
    resources.push(map, paint, geo);
  }
  sign(142, 0, 'SELLARONDA BIKE DAY', 'Sëlva · Val Gardena', 10.3, true);
  sign(8789, 5.5, 'PASSO GARDENA', 'Grödner Joch · Ju de Frara · 2121 m', 4.4);
  const jerseys = [0xcc4537, 0x44a0ad, 0xf3c263, 0x654e8d, 0x49794b, 0xd46a92];
  const peloton = jerseys.map((tone, i) => {
    const rider = kit.make(new Color(tone), i + 11);
    rider.group.rotation.order = 'YXZ';
    group.add(rider.group);
    return { rider, seat: course.place(0), lane: i % 2 ? 1.25 : -1.17 };
  });
  let nearestRider = Infinity,
    nearest = peloton[0]!;
  const starts = [12, 18, 51, 58, 87, 94];
  return {
    group,
    materials,
    get nearestRider() {
      return nearestRider;
    },
    get cowHead() {
      return heads[0]!.rotation.x;
    },
    get cyclistPosition() {
      return nearest.rider.group.position.x;
    },
    get cloudPosition() {
      return sky[0]!.mesh.position.x;
    },
    at(time: number, metres: number) {
      for (const plot of plots) plot.mesh.visible = Math.abs(plot.centre - metres) < 480;
      for (const b of buildings) b.site.visible = Math.abs(b.d - metres) < 540;
      for (const s of signs) s.g.visible = Math.abs(s.d - metres) < 320;
      cattle.visible = metres > 1080 && metres < 1780;
      if (cattle.visible)
        heads.forEach(
          (head, i) => (head.rotation.x = -0.37 + 0.53 * Math.sin(time * 0.88 + i * 2.1)),
        );
      nearestRider = Infinity;
      for (let i = 0; i < peloton.length; i++) {
        const { rider, seat, lane } = peloton[i]!;
        // Move successive bunches past the rider; only recycle beyond the visibility window.
        const period = 115;
        const physical = starts[i]! + time * 6.25 + 1.6 * Math.sin(time * 0.12 + i);
        const gap = ((((physical - metres + 13) % period) + period) % period) - 13;
        const d = metres + gap;
        rider.group.visible = d > 0 && d < course.length && gap > -8 && gap < 105;
        if (!rider.group.visible) continue;
        const p = course.place(d, lane + 0.16 * Math.sin(time * 0.32 + i), seat);
        rider.group.position.set(p.x, p.y + 0.07, p.z);
        rider.group.rotation.y = p.heading;
        rider.group.rotation.x = p.pitch;
        if (gap >= 0 && gap < nearestRider) {
          nearestRider = gap;
          nearest = peloton[i]!;
        }
        rider.pose(time * (8 + i * 0.12) + i, 0.012 * Math.sin(time * 2 + i), 0.08);
      }
      kit.roll(time * 6.3);
      sky.forEach((c, i) => (c.mesh.position.x = c.x + 90 * Math.sin(time * 0.025 + i)));
    },
    dispose() {
      group.removeFromParent();
      for (const r of resources) r.dispose();
    },
  };
}
