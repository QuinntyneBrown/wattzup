import {
  cameraPosition,
  mix,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  vertexColor,
} from 'three/tsl';
import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Object3D,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import type { Course } from './course';
import { seeded } from './world-kit';

/** The far sky follows the view. The drainage mill, turbines and cathedral stand on the land. */
export async function fenland(course: Course) {
  const resources: { dispose(): void }[] = [];
  const loader = new TextureLoader();
  const load = async (name: string) => {
    const map = await loader.loadAsync('courses/fens-' + name + '.webp');
    map.colorSpace = SRGBColorSpace;
    resources.push(map);
    return map;
  };
  const maps = [];
  try {
    for (const name of ['sky', 'ely', 'peat', 'wheat', 'beet', 'tarmac', 'verge', 'farm'])
      maps.push(await load(name));
  } catch (error) {
    for (const map of maps) map.dispose();
    throw error;
  }
  const [skyMap, cathedralMap, peat, wheat, beet, tarmac, verge, facade] = maps;
  const group = new Group();
  const skyGeometry = new CylinderGeometry(4200, 4200, 4100, 48, 1, true);
  const skyMaterial = new MeshBasicMaterial({
    map: skyMap,
    fog: false,
    side: DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  skyMap!.wrapS = RepeatWrapping;
  skyMap!.repeat.x = 3;
  const sky = new Mesh(skyGeometry, skyMaterial);
  sky.renderOrder = -1;
  group.add(sky);
  const portrait = new PlaneGeometry(176, 59);
  const masonry = new MeshBasicMaterial({
    map: cathedralMap,
    alphaTest: 0.48,
    side: DoubleSide,
    fog: false,
    color: 0xb8c0b8,
  });
  const cathedral = new Mesh(portrait, masonry);
  const site = course.place(14520, 170);
  cathedral.position.set(site.x, 29, site.z);
  cathedral.rotation.y = site.heading;
  group.add(cathedral);
  const random = seeded(2119);
  for (const map of [peat!, wheat!, beet!, tarmac!]) {
    map.wrapS = map.wrapT = RepeatWrapping;
    map.anisotropy = 4;
  }
  const phase = uniform(0);
  const cloud = positionWorld.x
    .mul(0.005)
    .add(positionWorld.z.mul(0.012))
    .add(phase)
    .sin()
    .add(positionWorld.z.mul(0.008).sub(phase.mul(0.41)).sin())
    .mul(0.095)
    .add(0.9);
  const colour = vertexColor().rgb;
  const field = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  const coord = positionWorld.xz.div(4.5);
  const darkSoil = texture(peat!, coord).rgb;
  const goldenCrop = texture(wheat!, coord).rgb;
  const greenCrop = texture(beet!, coord).rgb;
  const dry = mix(darkSoil, goldenCrop, smoothstep(0.14, 0.32, colour.r));
  const crop = mix(dry, greenCrop, smoothstep(-0.025, 0.022, colour.g.sub(colour.r)));
  const near = smoothstep(45, 230, positionWorld.distance(cameraPosition)).oneMinus();
  field.colorNode = mix(colour, crop, near.mul(0.85)).mul(cloud);
  const lane = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  lane.colorNode = texture(tarmac!, positionWorld.xz.div(2.25)).rgb.mul(cloud);
  const water = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  const ripple = positionWorld.x.mul(4.1).add(positionWorld.z.mul(0.48)).add(phase.mul(20)).sin();
  water.colorNode = colour.mul(ripple.mul(0.085).add(1.35)).mul(cloud);
  const banks = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  const grass = texture(beet!, positionWorld.xz.div(1.85)).g;
  banks.colorNode = colour.mul(grass.mul(0.52).add(0.82)).mul(cloud);
  const front = new MeshBasicMaterial({ map: facade, side: DoubleSide });
  resources.push(banks, front);
  for (const [distance, across, width, depth, height, tile] of [
    [2507, 22, 16, 8, 5.4, 0],
    [2531, 32, 24, 12, 4.6, 1],
  ] as const) {
    for (const end of [false, true]) {
      const p = course.place(
        end ? distance - width / 2 - 0.21 : distance,
        end ? across : across - depth / 2 - 0.25,
      );
      const plane = new PlaneGeometry(end ? depth : width, height);
      const uv = plane.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setX(i, (tile + uv.getX(i)) / 2);
      const wall = new Mesh(plane, front);
      wall.position.set(p.x, height / 2, p.z);
      wall.rotation.y = p.heading + (end ? 0 : Math.PI / 2);
      group.add(wall);
      resources.push(plane);
    }
  }
  const vegetation = new MeshBasicMaterial({ map: verge, alphaTest: 0.38, side: DoubleSide });
  resources.push(vegetation);
  const stand = new Object3D();
  const plots: { mesh: InstancedMesh; metres: number }[] = [];
  for (let tile = 0; tile < 3; tile++) {
    const geometry = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setX(i, (tile + uv.getX(i)) / 3);
    resources.push(geometry);
    const spacing = tile === 0 ? 8 : 2.9;
    for (let base = 0; base < course.length; base += 240) {
      const count = Math.ceil(240 / spacing);
      const mesh = new InstancedMesh(geometry, vegetation, count * 2);
      let used = 0;
      for (let j = 0; j < count; j++) {
        const d = base + j * spacing + random() * spacing * 0.65;
        if (d > 10725 && d < 10860) continue;
        for (const side of [-1, 1]) {
          if (tile === 0 && !(d % 1670 < 165 && side === -1)) continue;
          if (tile !== 0 && random() < 0.18 + 0.15 * Math.sin(d * 0.031 + side)) continue;
          const l = tile === 0 ? 28 : tile === 1 ? 4.6 + random() * 0.5 : 3.1 + random() * 0.6;
          const place = course.place(d, side * l);
          const h =
            tile === 0
              ? 9 + random() * 4
              : tile === 1
                ? 0.88 + random() * 0.57
                : 0.46 + random() * 0.48;
          stand.position.set(
            place.x,
            tile === 0 ? -0.13 : place.y - (tile === 1 ? 0.47 : 0.12),
            place.z,
          );
          stand.rotation.y = place.heading + (random() - 0.5) * 1.05;
          stand.scale.set(h * (tile === 0 ? 0.78 : 1.48), h, 1);
          stand.updateMatrix();
          mesh.setMatrixAt(used++, stand.matrix);
        }
      }
      mesh.count = used;
      if (used) {
        mesh.computeBoundingSphere();
        group.add(mesh);
        plots.push({ mesh, metres: base + 120 });
      }
      resources.push(mesh);
    }
  }
  const box = new BoxGeometry();
  const mast = new CylinderGeometry(0.56, 1, 1, 10);
  const paints = new Map<number, MeshLambertMaterial>();
  function part(
    parent: Group,
    shape: BoxGeometry | CylinderGeometry,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    tone: number,
  ) {
    let paint = paints.get(tone);
    if (!paint) {
      paint = new MeshLambertMaterial({ color: tone });
      paints.set(tone, paint);
      resources.push(paint);
    }
    const mesh = new Mesh(shape, paint);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }
  const machines: { base: Group; rotor: Group; metres: number; rate: number }[] = [];
  for (const [metres, lateral, height, historic] of [
    [1290, -270, 62, 0],
    [5720, 320, 71, 0],
    [8030, 25, 18, 1],
    [8250, 285, 66, 0],
    [8450, 380, 71, 0],
    [10860, -330, 64, 0],
    [14140, 250, 64, 0],
  ] as const) {
    const p = course.place(metres, lateral);
    const base = new Group();
    base.position.set(p.x, 0, p.z);
    base.rotation.y = p.heading - 0.26;
    group.add(base);
    part(
      base,
      mast,
      0,
      height / 2,
      0,
      historic ? 4.2 : 1.5,
      height,
      historic ? 4.2 : 1.5,
      historic ? 0x805f49 : 0xd2d4cc,
    );
    part(
      base,
      box,
      0,
      height,
      0,
      historic ? 5.7 : 2.1,
      historic ? 2.5 : 2.2,
      historic ? 6.7 : 4.5,
      historic ? 0x393f3c : 0xbbc3bd,
    );
    const rotor = new Group();
    rotor.position.set(0, height, historic ? 3.45 : 2.4);
    base.add(rotor);
    for (let i = 0; i < (historic ? 4 : 3); i++) {
      const arm = new Group();
      arm.rotation.z = (i * Math.PI * 2) / (historic ? 4 : 3);
      rotor.add(arm);
      const span = historic ? 12.5 : height * 0.47;
      part(
        arm,
        box,
        0,
        span / 2,
        0,
        historic ? 0.25 : 0.74,
        span,
        0.24,
        historic ? 0x554c40 : 0xdfe1da,
      );
      if (historic) {
        part(arm, box, 1, span * 0.62, 0, 0.14, span * 0.73, 0.21, 0x5e5447);
        part(arm, box, 2, span * 0.62, 0, 0.14, span * 0.73, 0.21, 0x5e5447);
        for (let j = 0; j < 9; j++)
          part(arm, box, 1, span * (0.27 + j * 0.088), 0, 2.15, 0.12, 0.17, 0x817560);
      } else {
        const blade = part(arm, mast, 0.3, span * 0.51, 0, 1.02, span * 0.86, 0.23, 0xdadcd5);
        blade.rotation.z = -0.034;
      }
    }
    machines.push({ base, rotor, metres, rate: historic ? 0.18 : 0.37 });
  }
  const dustCanvas = document.createElement('canvas');
  dustCanvas.width = 64;
  dustCanvas.height = 32;
  const dustContext = dustCanvas.getContext('2d')!;
  for (let i = 0; i < 28; i++) {
    const x = 10 + random() * 42,
      y = 12 + random() * 8,
      r = 3 + random() * 9;
    const g = dustContext.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(174,156,119,.22)');
    g.addColorStop(1, 'rgba(174,156,119,0)');
    dustContext.fillStyle = g;
    dustContext.fillRect(0, 0, 64, 32);
  }
  const dustMap = new CanvasTexture(dustCanvas);
  resources.push(
    dustMap,
    box,
    mast,
    skyGeometry,
    skyMaterial,
    portrait,
    masonry,
    field,
    lane,
    water,
  );
  const dust = Array.from({ length: 9 }, (_, i) => {
    const material = new SpriteMaterial({ map: dustMap, transparent: true, depthWrite: false });
    resources.push(material);
    const puff = new Sprite(material);
    puff.scale.set(4 + (i % 3), 1.2, 1);
    group.add(puff);
    return puff;
  });
  return {
    group,
    materials: { Lane: lane, Fields: field, Drains: water, Banks: banks },
    get cloudBearing() {
      return sky.rotation.y;
    },
    get turbineAngle() {
      return machines[2]!.rotor.rotation.z;
    },
    get dustPosition() {
      return dust[0]!.position.x;
    },
    get shadowOffset() {
      return phase.value;
    },
    at(time: number, metres: number) {
      const rider = course.place(metres);
      sky.position.set(rider.x, 1790, rider.z);
      sky.rotation.y = 0.0008 * time;
      for (const plot of plots) plot.mesh.visible = Math.abs(plot.metres - metres) < 670;
      phase.value = time * 0.08;
      for (const m of machines) {
        m.base.visible = Math.abs(m.metres - metres) < 1500;
        m.rotor.rotation.z = time * m.rate + m.metres * 0.02;
      }
      const start = Math.floor(metres / 80) * 80;
      for (let i = 0; i < dust.length; i++) {
        const t = (time * 0.17 + i * 0.329) % 1;
        const p = course.place(start + 25 + i * 14, 17 * t - 8);
        const puff = dust[i]!;
        puff.position.set(p.x, p.y + 0.36 + t * 0.5, p.z);
        puff.material.opacity = 0.26 * Math.sin(Math.PI * t);
        puff.visible = metres > 4850 && metres < 5900;
      }
    },
    dispose() {
      group.removeFromParent();
      for (const resource of resources) resource.dispose();
    },
  };
}
