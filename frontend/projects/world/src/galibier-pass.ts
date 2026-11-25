import { positionWorld, texture, vec2 } from 'three/tsl';
import {
  BoxGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import type { Course } from './course';
import { FAN_WEAR, NAMES, nameTexture } from './world-galibier';
import { Figures, seeded } from './world-kit';
/** Fixed landmarks, Tour lettering and spectators on the climb from Plan Lachat. */
export async function galibierPass(course: Course) {
  const group = new Group(),
    resources: { dispose(): void }[] = [];
  const loader = new TextureLoader(),
    maps: Texture[] = [];
  try {
    for (const name of ['meije', 'cloud', 'tarmac', 'scree', 'pasture', 'snow']) {
      const map = await loader.loadAsync('courses/galibier-' + name + '.webp');
      map.colorSpace = SRGBColorSpace;
      maps.push(map);
    }
  } catch (e) {
    for (const m of maps) m.dispose();
    throw e;
  }
  resources.push(...maps);
  const [peaks, cloud, tarmac, scree, meadow, snow] = maps;
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
  const col = course.place(25400),
    mountain = new MeshBasicMaterial({ map: peaks, side: DoubleSide, fog: false, alphaTest: 0.4 });
  const ridge = new PlaneGeometry(11000, 2340);
  resources.push(mountain, ridge);
  // The north face of La Meije remains in one place as the rider turns.
  const peak = new Mesh(ridge, mountain);
  peak.rotation.y = col.heading + 0.25;
  peak.position.set(
    col.x - 5500 * Math.sin(col.heading + 0.25),
    2940,
    col.z - 5500 * Math.cos(col.heading + 0.25),
  );
  group.add(peak);
  const cloudMat = new MeshBasicMaterial({
    map: cloud,
    side: DoubleSide,
    transparent: true,
    opacity: 0.63,
    depthWrite: false,
    fog: false,
  });
  const cloudGeo = new PlaneGeometry(1230, 150);
  resources.push(cloudMat, cloudGeo);
  const clouds = Array.from({ length: 5 }, (_, i) => {
    const a = col.heading + (i - 2) * 0.69,
      mesh = new Mesh(cloudGeo, cloudMat);
    mesh.rotation.y = a;
    const x = col.x - 3500 * Math.sin(a),
      z = col.z - 3500 * Math.cos(a);
    mesh.position.set(x, 2990 + (i % 2) * 110, z);
    group.add(mesh);
    return { mesh, x, z };
  });
  const boards: { g: Group; d: number }[] = [];
  const unit = new BoxGeometry(),
    polePaint = new MeshLambertMaterial({ color: 0x93918c });
  resources.push(unit, polePaint);
  function board(
    d: number,
    l: number,
    top: string,
    bottom: string,
    width: number,
    height: number,
    up: number,
    background: string,
    ink: string,
    posts: boolean,
  ) {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 236;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 752, 220);
    ctx.textAlign = 'center';
    ctx.fillStyle = ink;
    ctx.font = 'bold 75px sans-serif';
    ctx.fillText(top, 384, 101, 720);
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText(bottom, 384, 190, 720);
    const map = new CanvasTexture(c);
    map.colorSpace = SRGBColorSpace;
    const paint = new MeshBasicMaterial({ map, side: DoubleSide }),
      geo = new PlaneGeometry(width, height);
    const face = new Mesh(geo, paint),
      g = new Group(),
      p = course.place(d, l);
    g.position.set(p.x, p.y - 0.12, p.z);
    g.rotation.y = p.heading;
    face.position.y = up;
    g.add(face);
    if (posts)
      for (const side of [-1, 1]) {
        const post = new Mesh(unit, polePaint);
        post.position.set(side * width * 0.32, up / 2, -0.08);
        post.scale.set(0.09, up, 0.09);
        g.add(post);
      }
    boards.push({ g, d });
    group.add(g);
    resources.push(map, paint, geo);
  }
  board(124, 5.7, 'PLAN LACHAT', 'D 902', 2.65, 1.08, 1.85, '#ede8d6', '#363834', true);
  board(
    18473,
    5.5,
    'Col du Galibier',
    'Tunnel du Galibier',
    3.05,
    1.18,
    2.2,
    '#416492',
    '#fbf6e0',
    true,
  );
  board(
    22395.7,
    8.7,
    'HENRI DESGRANGE',
    'AU CRÉATEUR DU TOUR',
    1.62,
    0.92,
    2.9,
    '#968469',
    '#453e33',
    false,
  );
  board(
    25865.7,
    9,
    'Col du Galibier',
    'altitude 2642 m',
    3.2,
    1.12,
    2.5,
    '#efe8d7',
    '#292d30',
    false,
  );
  board(
    25865.4,
    9,
    'Savoie  ·  Hautes-Alpes',
    'Valloire  /  Briançon',
    3.5,
    0.85,
    1.41,
    '#395f91',
    '#f3eedc',
    false,
  );
  for (const d of [6810, 6860, 7920, 14635, 19752, 21240, 22604])
    board(d, 5.1, '❮  ❮', '', 1.8, 0.6, 1.21, '#325d99', '#f1efe2', true);
  const paintGeo = new PlaneGeometry(3.15, 2.05).rotateX(-Math.PI / 2);
  resources.push(paintGeo);
  const names = NAMES.map((name) => {
    const map = nameTexture(name);
    const paint = new MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    resources.push(map, paint);
    return paint;
  });
  for (const seed of [11485, 18345, 22265, 25750]) {
    for (let i = 0; i < 11; i++) {
      const d = seed + 12 * i,
        p = course.place(d, i % 2 ? 0.79 : -0.79),
        mark = new Mesh(paintGeo, names[i % names.length]);
      mark.position.set(p.x, p.y + 0.16, p.z);
      mark.rotation.order = 'YXZ';
      mark.rotation.y = p.heading + Math.sin(i) * 0.13;
      mark.rotation.x = p.pitch;
      group.add(mark);
    }
  }
  const rng = seeded(2123);
  const clusters = [11563, 18467, 22402, 25861].map((d) => {
    const local = new Group();
    group.add(local);
    const fans = new Figures(local, resources, 16, FAN_WEAR, Math.round(d));
    const people = Array.from({ length: 16 }, (_, i) => {
      const offset = d + i * 3.3 + rng() * 3,
        lane = (i % 3 ? -1 : 1) * (4.81 + rng() * 0.55);
      return course.place(offset, lane);
    });
    const flags: Mesh[] = [];
    const clothGeometry = new PlaneGeometry(1.18, 0.69).translate(0.59, 0, 0);
    const flagMap = new CanvasTexture(
      (() => {
        const c = document.createElement('canvas');
        c.width = 96;
        c.height = 48;
        const g = c.getContext('2d')!;
        ['#224384', '#f1eee0', '#c44243'].forEach((colour, index) => {
          g.fillStyle = colour;
          g.fillRect(index * 32, 0, 32, 48);
        });
        return c;
      })(),
    );
    const cloth = new MeshLambertMaterial({ map: flagMap, side: DoubleSide });
    resources.push(clothGeometry, cloth, flagMap);
    for (let i = 1; i < people.length; i += 4) {
      const p = people[i]!,
        shaft = new Mesh(unit, polePaint);
      shaft.position.set(p.x, p.y + 1.35, p.z);
      shaft.scale.set(0.05, 2.8, 0.05);
      local.add(shaft);
      const flag = new Mesh(clothGeometry, cloth);
      flag.position.set(p.x, p.y + 2.53, p.z);
      local.add(flag);
      flags.push(flag);
    }
    return { d, local, fans, people, flags };
  });
  let visibleCluster = clusters[0]!;
  return {
    group,
    materials,
    get flagAngle() {
      return visibleCluster.flags[0]!.rotation.y;
    },
    get spectatorHeight() {
      return visibleCluster.fans.bodies.instanceMatrix.array[13];
    },
    get cloudPosition() {
      return clouds[0]!.mesh.position.x;
    },
    at(time: number, metres: number) {
      for (const board of boards) board.g.visible = Math.abs(board.d - metres) < 550;
      for (const c of clusters) {
        c.local.visible = Math.abs(c.d - metres) < 400;
        if (!c.local.visible) continue;
        visibleCluster = c;
        c.people.forEach((p, i) =>
          c.fans.set(
            i,
            p.x,
            p.y - 0.08 + 0.1 * Math.sin(time * 3 + i * 0.61),
            p.z,
            p.heading + (i % 3 ? Math.PI / 2 : -Math.PI / 2),
            0.91 + (i % 5) * 0.035,
            0.02 * Math.cos(time * 3 + i),
          ),
        );
        c.fans.commit();
        c.flags.forEach(
          (f, i) => (f.rotation.y = c.people[0]!.heading + 0.5 * Math.sin(time * 3.1 + i)),
        );
      }
      for (const [i, b] of clouds.entries())
        b.mesh.position.x = b.x + 130 * Math.sin(time * 0.017 + i);
    },
    dispose() {
      group.removeFromParent();
      for (const resource of resources) resource.dispose();
    },
  };
}
