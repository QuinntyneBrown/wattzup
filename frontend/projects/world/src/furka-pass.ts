import { positionWorld, smoothstep, texture, uv, vec2 } from 'three/tsl';
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import type { Course } from './course';
/** Fixed Alpine landmarks and traffic on the western approach to the Furka Pass. */
export async function furkaPass(course: Course) {
  const group = new Group(),
    resources: { dispose(): void }[] = [];
  const loader = new TextureLoader(),
    maps: Texture[] = [];
  try {
    for (const name of [
      'bernese',
      'rhone',
      'scree',
      'tarmac',
      'pasture',
      'snow',
      'cloud',
      'belvedere',
      'gletsch',
    ]) {
      const map = await loader.loadAsync('courses/furka-' + name + '.webp');
      map.colorSpace = SRGBColorSpace;
      maps.push(map);
    }
  } catch (error) {
    for (const map of maps) map.dispose();
    throw error;
  }
  resources.push(...maps);
  const [peaks, glacier, scree, tarmac, meadow, snow, cloud, hotelFront, villageFront] = maps;
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
    Pasture: surface(meadow!, 3.8),
    Scree: surface(scree!, 3.4),
    Snow: surface(snow!, 4.2),
    Tarmac: surface(tarmac!, 1.5),
  };
  const rangeCentre = course.place(10600);
  const ridgeMat = new MeshBasicMaterial({
    map: peaks,
    alphaTest: 0.43,
    side: DoubleSide,
    fog: false,
  });
  const ridgeGeo = new PlaneGeometry(11250, 2350);
  resources.push(ridgeGeo, ridgeMat);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const ridge = new Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(
      rangeCentre.x + Math.sin(a) * 10750,
      2660 + 120 * Math.sin(a * 3),
      rangeCentre.z + Math.cos(a) * 10750,
    );
    ridge.rotation.y = a;
    ridge.scale.x = i % 2 ? -1 : 1;
    group.add(ridge);
  }
  const lookout = course.place(14460),
    glacialPaint = new MeshBasicNodeMaterial({
      map: glacier,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  glacialPaint.opacityNode = smoothstep(0, 0.15, uv().x)
    .mul(smoothstep(0.88, 1, uv().x).oneMinus())
    .mul(smoothstep(0.85, 1, uv().y).oneMinus());
  const glacialGeo = new PlaneGeometry(444, 180, 16, 6),
    basin = new Mesh(glacialGeo, glacialPaint);
  const h = lookout.heading;
  const sideX = lookout.x - 650 * Math.sin(h) - 216 * Math.cos(h);
  const sideZ = lookout.z - 650 * Math.cos(h) + 216 * Math.sin(h);
  basin.position.set(sideX, lookout.y - 34, sideZ);
  basin.rotation.order = 'YXZ';
  basin.rotation.y = lookout.heading + 0.28;
  basin.rotation.x = -0.82;
  group.add(basin);
  resources.push(glacialGeo, glacialPaint);
  const mistGeo = new PlaneGeometry(460, 69);
  const mistPaint = new MeshBasicMaterial({
    map: cloud,
    transparent: true,
    opacity: 0.57,
    depthWrite: false,
    side: DoubleSide,
  });
  const mist = new Mesh(mistGeo, mistPaint);
  const drift = { x: sideX - 105 * Math.cos(h), y: lookout.y + 75, z: sideZ + 105 * Math.sin(h) };
  mist.rotation.y = lookout.heading;
  group.add(mist);
  resources.push(mistGeo, mistPaint);
  // Give all four faces of each inn consistent wall scale, including the end seen from the bike.
  for (const [d, l, w, depth, height, base, map] of [
    [12402, -19, 29, 11, 15.1, -3, hotelFront],
    [161, 22, 44, 11, 11, -1, villageFront],
    [206, -23, 17, 8, 8, -1, villageFront],
  ] as const) {
    const site = course.place(d, l);
    const inn = new Group();
    inn.position.set(site.x, site.y + base, site.z);
    inn.rotation.y = site.heading;
    const wallPaint = new MeshLambertMaterial({ map: map!, side: DoubleSide });
    resources.push(wallPaint);
    for (let face = 0; face < 4; face++) {
      const end = face % 2 === 0;
      const plane = new PlaneGeometry(end ? depth : w, height);
      if (end) {
        const coords = plane.getAttribute('uv');
        for (let i = 0; i < coords.count; i++) coords.setX(i, 0.1 + (coords.getX(i) * depth) / w);
      }
      const wall = new Mesh(plane, wallPaint);
      const angle = (face * Math.PI) / 2;
      wall.position.set(
        Math.sin(angle) * (depth / 2 + 0.26),
        height / 2,
        Math.cos(angle) * (w / 2 + 0.26),
      );
      wall.rotation.y = angle;
      inn.add(wall);
      resources.push(plane);
    }
    group.add(inn);
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
    group.add(bus);
    piece(bus, 0, 1.32, 0, 2.48, 1.62, 9.68, 0xefae22);
    piece(bus, 0, 2.5, 0.02, 2.46, 0.98, 9.58, 0x344b59);
    piece(bus, 0, 3.1, 0, 2.53, 0.21, 9.67, 0xf3c33c);
    piece(bus, 0, 1.38, 0, 2.5, 0.29, 9.7, 0xc84934);
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
  const postbus = coach();
  let postbusDistance = 0;
  const cows = new Group();
  group.add(cows);
  const heads: Group[] = [];
  for (let i = 0; i < 8; i++) {
    const d = 2280 + i * 37 + Math.sin(i) * 8,
      lane = -(8 + (i % 3) * 2.6),
      p = course.place(d, lane);
    const cow = new Group();
    cow.position.set(p.x, p.y - 0.11 - 0.27 * (-lane - 5.8), p.z);
    cow.rotation.y = p.heading + 1.6 * Math.sin(i + 1);
    cows.add(cow);
    const hide = i % 3 ? 0x9a6143 : 0xb9aa92;
    piece(cow, 0, 1.08, 0, 0.78, 0.84, 1.55, hide);
    for (const x of [-0.25, 0.25])
      for (const z of [-0.57, 0.54]) piece(cow, x, 0.44, z, 0.14, 0.87, 0.16, 0x76543e);
    const neck = new Group();
    neck.position.set(0, 1.3, -0.69);
    cow.add(neck);
    piece(neck, 0, -0.07, -0.29, 0.43, 0.49, 0.62, hide);
    piece(neck, 0, -0.2, -0.64, 0.39, 0.23, 0.17, 0xbaa08b);
    for (const x of [-0.24, 0.24]) piece(neck, x, 0.13, -0.28, 0.27, 0.12, 0.16, hide);
    heads.push(neck);
  }
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
    ctx.fillStyle = '#2e302b';
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
    g.position.set(p.x, p.y - 0.13, p.z);
    g.rotation.y = p.heading;
    face.position.y = up;
    g.add(face);
    if (posts)
      for (const s of [-1, 1]) piece(g, s * width * 0.32, up * 0.5, -0.1, 0.12, up, 0.12, 0x757b76);
    group.add(g);
    resources.push(map, paint, plane);
    signs.push({ g, d });
  }
  board(107, 5.7, 'Gletsch', 'Furka · Grimsel', 2.9, 1.08, '#ecbc4e', 2.05, true);
  board(12308, 5.4, 'Belvédère', 'Rhonegletscher', 2.4, 1.03, '#e7b73e', 2.07, true);
  board(19757, 5.6, 'Furkapass', '2429 m', 3.35, 1.25, '#eac046', 2.25, true);
  return {
    group,
    materials,
    get cowHead() {
      return heads[0]!.rotation.x;
    },
    get postbusDistance() {
      return postbusDistance;
    },
    get postbusPosition() {
      return postbus.position.x;
    },
    get cloudHeight() {
      return mist.position.y;
    },
    at(time: number, metres: number) {
      for (const sign of signs) sign.g.visible = Math.abs(sign.d - metres) < 550;
      cows.visible = metres > 1890 && metres < 2840;
      if (cows.visible)
        for (let i = 0; i < heads.length; i++)
          heads[i]!.rotation.x = -0.32 + 0.46 * Math.sin(time * 0.85 + i * 2.7);
      postbus.visible = metres > 11600 && metres < 13000;
      if (postbus.visible) {
        const cycle = 96 * Math.sin(time * 0.031);
        const p = course.place(12342 - cycle, -2.3);
        postbus.position.set(p.x, p.y + 0.04, p.z);
        postbus.rotation.y = p.heading + (Math.cos(time * 0.031) > 0 ? Math.PI : 0);
        const rider = course.place(metres);
        postbusDistance = Math.hypot(p.x - rider.x, p.z - rider.z);
      }
      basin.visible = metres > 13100 && metres < 15450;
      mist.visible = basin.visible;
      mist.position.set(
        drift.x + 18 * Math.sin(time * 0.035),
        drift.y - 40 + 9 * Math.sin(time * 0.059),
        drift.z,
      );
    },
    dispose() {
      group.removeFromParent();
      for (const resource of resources) resource.dispose();
    },
  };
}
