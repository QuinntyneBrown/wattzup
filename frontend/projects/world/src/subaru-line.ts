import { positionWorld, smoothstep, texture, uniform, uv, vec2 } from 'three/tsl';
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
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
import { Figures, seeded } from './world-kit';

function ground(d: number, left: number) {
  const edge = Math.max(0, Math.abs(left) - 7.4);
  if (d < 240 || d > 12420) return -0.12 + Math.max(0, edge - 42) * 0.11;
  if (left > 0 && d > 9240 && d < 10380) return -0.12 - Math.max(0, left - 6.1) * 0.55;
  if (left > 0) return -0.12 - edge * (d > 6500 ? 0.31 : 0.135);
  return (
    -0.12 +
    edge * (0.14 + 0.04 * Math.sin(d / 350)) +
    Math.min(edge * 0.072, 2.9) * (0.5 + 0.5 * Math.sin(d / 35 + left / 10))
  );
}

/** The lower forest, the mountain and the station are anchored independently to the Subaru Line. */
export async function subaruLine(course: Course) {
  const group = new Group(),
    resources: { dispose(): void }[] = [];
  const loader = new TextureLoader(),
    maps: Texture[] = [];
  try {
    for (const name of [
      'summit',
      'forest',
      'station',
      'kawaguchi',
      'clinker',
      'scoria',
      'tarmac',
      'cloud',
      'moss',
    ]) {
      const map = await loader.loadAsync('courses/fuji-' + name + '.webp');
      map.colorSpace = SRGBColorSpace;
      maps.push(map);
    }
  } catch (error) {
    for (const map of maps) map.dispose();
    throw error;
  }
  resources.push(...maps);
  const [summit, forest, station, lake, clinker, scoria, tarmac, cloud, moss] = maps;
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
    Moss: surface(moss!, 2.65),
    Tarmac: surface(tarmac!, 1.45),
    Clinker: surface(clinker!, 3.3),
    Scoria: surface(scoria!, 3.15),
  };
  const mountainPaint = new MeshBasicMaterial({
    map: summit,
    alphaTest: 0.42,
    side: DoubleSide,
    fog: false,
  });
  const mountainGeometry = new PlaneGeometry(8300, 2530),
    mountain = new Mesh(mountainGeometry, mountainPaint);
  const end = course.place(course.length),
    start = course.place(0);
  const heading = Math.atan2(start.x - end.x, start.z - end.z);
  mountain.rotation.y = heading;
  mountain.position.set(end.x - Math.sin(heading) * 4350, 2715, end.z - Math.cos(heading) * 4350);
  group.add(mountain);
  resources.push(mountainGeometry, mountainPaint);
  const outlook = course.place(7470);
  const lakeFade = uniform(0);
  const lakePaint = new MeshBasicNodeMaterial({
    map: lake,
    side: DoubleSide,
    fog: false,
    transparent: true,
    depthWrite: false,
  });
  const edge = smoothstep(0, 0.12, uv().x).mul(smoothstep(0.88, 1, uv().x).oneMinus());
  lakePaint.opacityNode = lakeFade.mul(edge).mul(smoothstep(0.51, 0.84, uv().y).oneMinus());
  const lakeGeometry = new PlaneGeometry(4900, 1030),
    basin = new Mesh(lakeGeometry, lakePaint);
  basin.position.set(
    outlook.x - 1720 * Math.sin(outlook.heading) - 540 * Math.cos(outlook.heading),
    outlook.y + 105,
    outlook.z - 1720 * Math.cos(outlook.heading) + 540 * Math.sin(outlook.heading),
  );
  basin.rotation.y = outlook.heading;
  group.add(basin);
  resources.push(lakeGeometry, lakePaint);
  const inversion = course.place(9840);
  const bankGeometry = new PlaneGeometry(1, 1);
  const banks = Array.from({ length: 5 }, (_, i) => {
    const paint = new MeshBasicMaterial({
      map: cloud,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      fog: false,
      color: i % 2 ? 0xe2ebf0 : 0xffffff,
    });
    const mesh = new Mesh(bankGeometry, paint);
    mesh.rotation.y = inversion.heading + i * 0.065;
    mesh.scale.set(2300 + i * 380, 425 + i * 32, 1);
    group.add(mesh);
    resources.push(paint);
    const forward = 620 + i * 360,
      left = 545 + (i % 3) * 495;
    return {
      mesh,
      x: inversion.x - forward * Math.sin(inversion.heading) - left * Math.cos(inversion.heading),
      z: inversion.z - forward * Math.cos(inversion.heading) + left * Math.sin(inversion.heading),
      y: inversion.y - 17 - i * 13,
    };
  });
  resources.push(bankGeometry);
  const trees = new MeshBasicMaterial({ map: forest, alphaTest: 0.46, side: DoubleSide });
  const pose = new Object3D(),
    rand = seeded(2121);
  const plots: { mesh: InstancedMesh; centre: number }[] = [];
  resources.push(trees);
  for (let species = 0; species < 4; species++) {
    const geometry = new PlaneGeometry(1, 1).translate(0, 0.5, 0),
      uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++)
      uv.setXY(
        i,
        ((species % 2) + uv.getX(i)) * 0.5,
        (1 - Math.floor(species / 2) + uv.getY(i)) * 0.5,
      );
    resources.push(geometry);
    for (let a = 0; a < course.length; a += 220) {
      const mesh = new InstancedMesh(geometry, trees, 140);
      let used = 0;
      for (let j = 0; j < (a < 3880 ? 138 : 78); j++) {
        const d = a + rand() * 220;
        const side = rand() < 0.5 ? -1 : 1;
        if (
          d > 12420 ||
          (d < 230 && j % 4 !== 0) ||
          (((d > 7100 && d < 8050) || (d > 9370 && d < 10320)) && side < 0)
        )
          continue;
        let width = 1,
          height = 1;
        if (species < 2) {
          if (d > 5400 || (species === 1 && j % 3 === 0)) continue;
          height = 11 + rand() * 13;
          width = height * (species === 0 ? 0.8 : 0.76);
        } else if (species === 2) {
          if (d < 3850 || d > 10500 || (d > 7900 && j % 4 !== 0)) continue;
          height = (7 + rand() * 6) * (d > 7900 ? 0.64 : 1);
          width = height;
        } else {
          if (d < 7900 || j % 2) continue;
          width = 1.6 + rand() * 4;
          height = width * 0.63;
        }
        const l = side * (d < 230 ? 20 + rand() * 18 : 7.8 + rand() * 34);
        const p = course.place(d, l);
        pose.position.set(p.x, p.y + ground(d, -l) - 0.2, p.z);
        pose.rotation.y = p.heading + (rand() - 0.5) * 1.6;
        pose.scale.set(width, height, 1);
        pose.updateMatrix();
        mesh.setMatrixAt(used++, pose.matrix);
      }
      mesh.count = used;
      if (used) {
        mesh.computeBoundingSphere();
        group.add(mesh);
        plots.push({ mesh, centre: a + 110 });
      }
      resources.push(mesh);
    }
  }
  const buildings = new Group();
  group.add(buildings);
  const frontage = new MeshBasicMaterial({ map: station, side: DoubleSide });
  resources.push(frontage);
  for (const [d, l, w, depth, h, tile] of [
    [12968, 22, 34, 13, 7.9, 0],
    [13015, 25, 39, 15, 9.8, 1],
    [13068, 31, 32, 15, 7.1, 0],
  ] as const) {
    const p = course.place(d, l);
    for (const side of [-1, 0, 1]) {
      const plane = new PlaneGeometry(side ? depth : w, h);
      const uv = plane.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setX(i, (tile + uv.getX(i)) * 0.5);
      const wall = new Mesh(plane, frontage),
        along = side * (w * 0.5 + 0.045),
        across = side ? 0 : -depth * 0.5 - 0.045;
      wall.position.set(
        p.x - along * Math.sin(p.heading) + across * Math.cos(p.heading),
        p.y - 0.16 + h * 0.5,
        p.z - along * Math.cos(p.heading) - across * Math.sin(p.heading),
      );
      wall.rotation.y = p.heading + (side ? 0 : Math.PI / 2);
      buildings.add(wall);
      resources.push(plane);
    }
  }
  const unit = new BoxGeometry(),
    wheel = new CylinderGeometry(0.55, 0.55, 0.27, 12).rotateZ(Math.PI / 2);
  resources.push(unit, wheel);
  const colours = new Map<number, MeshLambertMaterial>();
  function piece(
    owner: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    dep: number,
    tone: number,
    tyre = false,
  ) {
    let paint = colours.get(tone);
    if (!paint) {
      paint = new MeshLambertMaterial({ color: tone });
      resources.push(paint);
      colours.set(tone, paint);
    }
    const m = new Mesh(tyre ? wheel : unit, paint);
    m.position.set(x, y, z);
    m.scale.set(w, h, dep);
    owner.add(m);
    return m;
  }
  function coach() {
    const bus = new Group();
    buildings.add(bus);
    piece(bus, 0, 1.32, 0, 2.48, 1.62, 9.68, 0xded9bf);
    piece(bus, 0, 2.5, 0.02, 2.46, 0.98, 9.58, 0x344b59);
    piece(bus, 0, 3.1, 0, 2.53, 0.21, 9.67, 0xdddccf);
    piece(bus, 0, 1.38, 0, 2.5, 0.29, 9.7, 0x9c4e44);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++)
        piece(bus, side * 1.24, 2.51, -4.48 + i * 1.45, 0.09, 1.01, 0.095, 0x93998d);
      for (const axle of [-2.86, 2.81])
        piece(bus, side * 1.16, 0.63, axle, 1, 1, 1, 0x2a2d2e, true);
    }
    piece(bus, 0, 2.96, -4.82, 1.58, 0.28, 0.06, 0x3c3b33);
    for (const side of [-1, 1]) piece(bus, side * 0.85, 0.88, -4.87, 0.38, 0.18, 0.07, 0xffefbe);
    return bus;
  }
  const shuttle = coach(),
    parked = coach(),
    berth = course.place(13067, 10);
  parked.position.set(berth.x, berth.y, berth.z);
  parked.rotation.y = berth.heading;
  const crowd = new Figures(
    buildings,
    resources,
    26,
    {
      tops: ['#994f40', '#7891a0', '#bfa660', '#526a4e'],
      bottoms: ['#41494c', '#6a6252', '#46516a'],
      skins: ['#d8b394', '#b68e70', '#cda687'],
    },
    2121,
    false,
  );
  for (let i = 6; i < 26; i++) {
    const d = 12948 + rand() * 91,
      l = 13 + rand() * 3.4,
      p = course.place(d, l);
    crowd.set(i, p.x, p.y + ground(d, -l), p.z, p.heading + rand() * 5, 0.9 + rand() * 0.13);
  }
  crowd.commit();
  const signs: { g: Group; d: number }[] = [];
  function board(
    d: number,
    l: number,
    text: string,
    english: string,
    width: number,
    height: number,
    colour: string,
    up: number,
    posts: boolean,
  ) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 180;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = colour;
    ctx.fillRect(0, 0, 512, 180);
    ctx.strokeStyle = '#dedcd0';
    ctx.lineWidth = 5;
    ctx.strokeRect(7, 7, 498, 166);
    ctx.fillStyle = '#fffdeb';
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(text, 256, 83, 480);
    ctx.font = '28px sans-serif';
    ctx.fillText(english, 256, 137, 480);
    const map = new CanvasTexture(c);
    map.colorSpace = SRGBColorSpace;
    const paint = new MeshBasicMaterial({ map, side: DoubleSide }),
      plane = new PlaneGeometry(width, height);
    const g = new Group(),
      face = new Mesh(plane, paint),
      p = course.place(d, l);
    g.position.set(p.x, p.y + ground(d, -l), p.z);
    g.rotation.y = p.heading;
    face.position.y = up;
    g.add(face);
    if (posts)
      for (const s of [-1, 1]) piece(g, s * width * 0.32, up * 0.5, -0.1, 0.12, up, 0.12, 0x757b76);
    group.add(g);
    resources.push(map, paint, plane);
    signs.push({ g, d });
  }
  board(134, 0, '富士スバルライン', 'FUJI SUBARU LINE', 7.2, 1.57, '#326956', 5.74, false);
  for (let alt = 1500; alt <= 2300; alt += 100) {
    // The course rises monotonically. Locate each marker using its actual baked elevation.
    let low = 0,
      high = course.length;
    while (high - low > 1) {
      const mid = (low + high) * 0.5;
      if (course.place(mid).y < alt) low = mid;
      else high = mid;
    }
    board(high, -6.5, '標高 ' + alt + ' m', 'Fuji Subaru Line', 2.25, 0.88, '#73553e', 1.94, true);
  }
  board(12888, 6.9, '富士山五合目', 'Mt. Fuji 5th Station', 4.15, 1.36, '#64533e', 2.5, true);
  return {
    group,
    materials,
    get visitorPosition() {
      return crowd.legs.instanceMatrix.array[12];
    },
    get cloudPosition() {
      return banks[0]!.mesh.position.x;
    },
    get shuttlePosition() {
      return shuttle.position.x;
    },
    at(time: number, metres: number) {
      for (const p of plots) p.mesh.visible = Math.abs(p.centre - metres) < 610;
      for (const s of signs) s.g.visible = Math.abs(s.d - metres) < 335;
      lakeFade.value = Math.max(0, Math.min(1, (metres - 6700) / 380, (8280 - metres) / 380));
      basin.visible = lakeFade.value > 0;
      const veil = Math.max(0, Math.min(1, (metres - 8270) / 730, (12050 - metres) / 680));
      for (let i = 0; i < banks.length; i++) {
        const b = banks[i]!;
        b.mesh.visible = veil > 0;
        b.mesh.position.set(
          b.x + 96 * Math.sin(time * 0.027 + i),
          b.y + 7 * Math.sin(time * 0.041 + i),
          b.z,
        );
        b.mesh.material.opacity = veil * (0.76 - i * 0.055);
      }
      buildings.visible = metres > 12150;
      if (buildings.visible) {
        for (let i = 0; i < 6; i++) {
          const phase = time * 0.078 + i * 0.74;
          const d = 12944 + i * 4 + 7 * Math.sin(phase),
            l = 12.4 + i * 0.45 + 1.65 * Math.cos(phase);
          const person = course.place(d, l);
          crowd.set(
            i,
            person.x,
            person.y + ground(d, -l),
            person.z,
            person.heading + (Math.cos(phase) < 0 ? Math.PI : 0),
            0.95,
            0.027 * Math.abs(Math.sin(time * 2.3 + i)),
          );
        }
        crowd.commit();
        const angle = time * 0.042,
          p = course.place(12955 + 38 * Math.sin(angle), 9.2 + 3.5 * Math.cos(angle));
        shuttle.position.set(p.x, p.y + ground(12955 + 38 * Math.sin(angle), -9.2), p.z);
        shuttle.rotation.y = p.heading + Math.atan2(3.5 * Math.sin(angle), 38 * Math.cos(angle));
      }
    },
    dispose() {
      group.removeFromParent();
      for (const r of resources) r.dispose();
    },
  };
}
