import {
  cameraPosition,
  smoothstep,
  positionLocal,
  positionWorld,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  mix,
  vertexColor,
} from 'three/tsl';
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
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  MeshLambertNodeMaterial,
  MeshStandardNodeMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three/webgpu';
import type { Course } from './course';
import { Figures, seeded } from './world-kit';

function verge(distance: number, left: number) {
  const edge = Math.max(0, Math.abs(left) - 5);
  if (distance < 2000) return -0.08 + Math.min(edge, 10) * 0.012;
  if (distance > 2550 && distance < 5020)
    return -0.12 + Math.min(edge, 27) * (left > 0 ? 0.28 : 0.14);
  if (distance > 5400 && distance < 7430 && left > 0) return -0.12 - edge * 0.27;
  return -0.12 + Math.min(edge, 70) * (0.035 + 0.042 * Math.sin(distance / 230 + left / 60));
}

export async function broadwayEscarpment(course: Course) {
  const group = new Group();
  const resources: { dispose(): void }[] = [];
  const loader = new TextureLoader();
  const maps: Texture[] = [];
  try {
    for (const name of [
      'broadway',
      'beech',
      'vale',
      'stone',
      'tarmac',
      'grass',
      'slate',
      'folly',
    ]) {
      const map = await loader.loadAsync('courses/fishhill-' + name + '.webp');
      map.colorSpace = SRGBColorSpace;
      maps.push(map);
    }
  } catch (error) {
    for (const map of maps) map.dispose();
    throw error;
  }
  resources.push(...maps);
  const [fronts, leaves, vale, stone, tarmac, grass, slate, follyMap] = maps;
  for (const map of [stone!, tarmac!, grass!, slate!]) {
    map.wrapS = map.wrapT = RepeatWrapping;
    map.anisotropy = 4;
  }
  const lane = new MeshStandardNodeMaterial({
    flatShading: true,
    roughness: 0.67,
    side: DoubleSide,
  });
  const woodland = uniform(0);
  const tarmacGrain = texture(tarmac!, positionWorld.xz.div(1.25)).rgb;
  const shade = positionWorld.x
    .mul(0.63)
    .add(positionWorld.z.mul(0.29))
    .sin()
    .mul(positionWorld.z.mul(0.47).sub(positionWorld.x.mul(0.38)).sin())
    .mul(0.1)
    .sub(0.17);
  const reflectedSky = smoothstep(18, 110, positionWorld.distance(cameraPosition))
    .mul(positionWorld.x.mul(0.35).add(positionWorld.z.mul(0.21)).sin().mul(0.5).add(0.5))
    .mul(0.035);
  lane.colorNode = tarmacGrain.mul(0.7).mul(woodland.mul(shade).add(1)).add(reflectedSky);
  lane.roughnessNode = tarmacGrain.r.mul(0.65).add(0.42);
  const walls = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  walls.colorNode = texture(
    stone!,
    vec2(positionWorld.z.add(positionWorld.x.mul(0.62)), positionWorld.y).div(2.1),
  ).rgb;
  const meadows = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  meadows.colorNode = mix(texture(grass!, positionWorld.xz.div(2.5)).rgb, vertexColor().rgb, 0.27);
  const roofs = new MeshLambertNodeMaterial({ flatShading: true, side: DoubleSide });
  roofs.colorNode = texture(slate!, positionWorld.xz.div(2.8)).rgb;
  resources.push(lane, walls, meadows, roofs);
  const facade = new MeshBasicMaterial({ map: fronts, side: DoubleSide });
  const sway = uniform(0);
  const foliage = new MeshBasicNodeMaterial({ map: leaves, alphaTest: 0.42, side: DoubleSide });
  foliage.positionNode = positionLocal.add(vec3(sway.mul(uv().y.pow(2)).mul(0.015), 0, 0));
  resources.push(facade, foliage);
  const pose = new Object3D();
  const cells: { mesh: InstancedMesh; centre: number; reach: number }[] = [];
  function tile(column: number) {
    const geo = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
    const tex = geo.getAttribute('uv');
    for (let i = 0; i < tex.count; i++) tex.setX(i, (column + tex.getX(i)) / 3);
    resources.push(geo);
    return geo;
  }
  const tiles = [tile(0), tile(1), tile(2)];
  function install(batch: InstancedMesh, count: number, centre: number, reach: number) {
    batch.count = count;
    if (count) {
      batch.computeBoundingSphere();
      group.add(batch);
      cells.push({ mesh: batch, centre, reach });
    }
    resources.push(batch);
  }
  for (let start = 0; start < 94; start += 12) {
    for (let style = 0; style < 3; style++) {
      const batch = new InstancedMesh(tiles[style]!, facade, 96);
      let count = 0;
      for (let n = start; n < Math.min(start + 12, 94); n++) {
        for (const side of [-1, 1]) {
          if ((n + (side > 0 ? 1 : 3)) % 9 === 0) continue;
          const variant = n % 4 === 2 ? 2 : (n + (side > 0 ? 1 : 0)) % 2;
          if (style !== variant) continue;
          const d = -35 + n * 19 + (side > 0 ? 5 : 0),
            l = side * (14 + (n % 3) * 1.4);
          const width = 12 + (n % 5),
            depth = 7.2 + (n % 3),
            height = 4.8 + (n % 4) * 0.5;
          const h = course.place(d, -l);
          for (const end of [-1, 0, 1]) {
            // The static house sits tangent to the road at its centre, even on sloping ground.
            const along = end * (width / 2 + 0.025),
              across = end ? 0 : side * (depth / 2 + 0.025);
            const x = h.x - along * Math.sin(h.heading) + across * Math.cos(h.heading);
            const z = h.z - along * Math.cos(h.heading) - across * Math.sin(h.heading);
            pose.position.set(x, h.y + verge(d, l), z);
            pose.rotation.set(0, h.heading + (end ? 0 : Math.PI / 2), 0);
            pose.scale.set(end ? depth : width, height, 1);
            pose.updateMatrix();
            batch.setMatrixAt(count++, pose.matrix);
          }
        }
      }
      install(batch, count, start * 19 + 80, 390);
    }
  }
  const random = seeded(2120);
  for (let start = 0; start < course.length; start += 200) {
    for (let variant = 0; variant < 3; variant++) {
      const batch = new InstancedMesh(tiles[variant]!, foliage, 128);
      let count = 0;
      for (let d = start; d < start + 200; d += variant === 2 ? 5 : 11) {
        for (const side of [-1, 1]) {
          if (variant !== 2 && (variant === 0) !== side > 0) continue;
          const woods = d > 2290 && d < 5170;
          if (variant !== 2 && !woods && random() > 0.16) continue;
          if (variant === 2 && d < 1780 && random() > 0.32) continue;
          if (d > 5700 && d < 7230 && side === -1) continue;
          const dist = d + random() * 5;
          const l =
            side *
            (variant === 2 ? 7.2 + random() * 2 : woods ? 7.1 + random() * 4 : 16 + random() * 12);
          const p = course.place(dist, l);
          const high = variant === 2 ? 1.05 + random() * 1.25 : 12 + random() * 8;
          pose.position.set(p.x, p.y + verge(dist, -l) - 0.13, p.z);
          pose.rotation.set(0, p.heading + (random() - 0.5) * 1.35, 0);
          pose.scale.set(high * (variant === 2 ? 2.7 : 1.03), high, 1);
          pose.updateMatrix();
          batch.setMatrixAt(count++, pose.matrix);
        }
      }
      install(batch, count, start + 100, variant === 2 ? 400 : 580);
    }
  }
  const vistaGeometry = new PlaneGeometry(5800, 1120);
  const vistaPaint = new MeshBasicMaterial({
    map: vale,
    side: DoubleSide,
    fog: false,
    transparent: true,
    depthWrite: false,
  });
  const vista = new Mesh(vistaGeometry, vistaPaint);
  const viewpoint = course.place(6480);
  vista.rotation.y = viewpoint.heading;
  vista.position.set(
    viewpoint.x - 2250 * Math.sin(viewpoint.heading) - 830 * Math.cos(viewpoint.heading),
    viewpoint.y - 120,
    viewpoint.z - 2250 * Math.cos(viewpoint.heading) + 830 * Math.sin(viewpoint.heading),
  );
  resources.push(vistaGeometry, vistaPaint);
  group.add(vista);

  const wool = new MeshLambertMaterial({ color: 0xffffff }),
    oval = new SphereGeometry(1, 10, 7);
  const flock = new InstancedMesh(oval, wool, 18 * 10);
  flock.frustumCulled = false;
  const sheep = new Group(),
    part = new Object3D(),
    tint = new Color();
  sheep.add(part);
  group.add(flock);
  resources.push(flock, oval, wool);
  let headY = 0;
  function graze(time: number, metres: number) {
    const station = metres > 10000 ? 11395 : 8675;
    flock.visible = Math.abs(station - metres) < 440;
    if (!flock.visible) return;
    let index = 0;
    function ellipsoid(
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
      rz: number,
      colour: number,
    ) {
      part.position.set(x, y, z);
      part.scale.set(rx, ry, rz);
      part.updateWorldMatrix(false, false);
      flock.setMatrixAt(index, part.matrixWorld);
      flock.setColorAt(index++, tint.setHex(colour));
    }
    for (let i = 0; i < 18; i++) {
      const d = station + (i % 7) * 6 + Math.sin(i) * 3,
        l = (i % 4 === 0 ? -1 : 1) * (10 + (i % 6) * 2.2);
      const p = course.place(d, l);
      sheep.position.set(p.x, p.y + verge(d, -l), p.z);
      sheep.rotation.y = p.heading + i * 2.21;
      sheep.updateMatrixWorld();
      const y = 0.54 + 0.18 * Math.sin(time * 0.96 + i * 0.72),
        cream = i % 3 === 0 ? 0xcec4aa : 0xe8e0c9;
      ellipsoid(0, 0.74, 0, 0.69, 0.4, 0.35, cream);
      ellipsoid(0.57, y + 0.18, 0, 0.22, 0.29, 0.2, cream);
      ellipsoid(0.78, y + 0.07, 0, 0.26, 0.2, 0.17, 0x70685c);
      if (!i) headY = part.matrixWorld.elements[13]!;
      for (const x of [-0.41, 0.42])
        for (const z of [-0.19, 0.19]) ellipsoid(x, 0.28, z, 0.073, 0.28, 0.07, 0x756d62);
      for (const z of [-0.19, 0.19]) ellipsoid(0.64, y + 0.22, z, 0.14, 0.075, 0.09, 0x908574);
    }
    flock.count = index;
    flock.instanceMatrix.needsUpdate = true;
    flock.instanceColor!.needsUpdate = true;
  }
  const unit = new BoxGeometry();
  resources.push(unit);
  const paints = new Map<number, MeshLambertMaterial>();
  function box(
    parent: Group,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    depth: number,
    colour: number,
  ) {
    let paint = paints.get(colour);
    if (!paint) {
      paint = new MeshLambertMaterial({ color: colour });
      resources.push(paint);
      paints.set(colour, paint);
    }
    const m = new Mesh(unit, paint);
    m.scale.set(w, h, depth);
    m.position.set(x, y, z);
    parent.add(m);
  }
  const streetFurniture: { g: Group; distance: number }[] = [];
  function atRoad(distance: number, lane: number) {
    const p = course.place(distance, lane),
      g = new Group();
    g.position.set(p.x, p.y + verge(distance, -lane), p.z);
    g.rotation.y = p.heading;
    group.add(g);
    streetFurniture.push({ g, distance });
    return g;
  }
  for (const [d, l] of [
    [115, 7],
    [1083, -6.7],
  ]) {
    const kiosk = atRoad(d!, l!);
    box(kiosk, 0, 1.14, 0, 1.03, 2.28, 1.03, 0xa8312d);
    box(kiosk, 0, 1.13, 0.527, 0.83, 1.63, 0.024, 0x677e7a);
    for (let j = 0; j < 3; j++)
      box(kiosk, (j - 1) * 0.27, 1.12, 0.55, 0.044, 1.68, 0.055, 0xb54237);
    for (let j = 0; j < 6; j++) box(kiosk, 0, 0.36 + j * 0.3, 0.55, 0.87, 0.05, 0.055, 0xb54237);
    box(kiosk, 0, 2.11, 0.53, 0.86, 0.22, 0.04, 0xe5d8b9);
    box(kiosk, 0, 2.32, 0, 1.12, 0.13, 1.12, 0xa7332a);
  }
  function signTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const c = canvas.getContext('2d')!;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(128, 15);
    c.lineTo(245, 228);
    c.lineTo(11, 228);
    c.closePath();
    c.fillStyle = '#f4f0df';
    c.fill();
    c.strokeStyle = '#bb342b';
    c.lineWidth = 15;
    c.stroke();
    c.fillStyle = '#292b29';
    c.beginPath();
    c.moveTo(55, 201);
    c.lineTo(200, 147);
    c.lineTo(200, 201);
    c.fill();
    c.font = 'bold 43px sans-serif';
    c.fillText('10%', 75, 148);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }
  const signMap = signTexture(),
    signFace = new MeshBasicMaterial({ map: signMap, alphaTest: 0.5, side: DoubleSide }),
    signPlate = new PlaneGeometry(1.35, 1.35);
  resources.push(signMap, signFace, signPlate);
  for (const d of [2915, 3757]) {
    const sign = atRoad(d, -5.55);
    box(sign, 0, 1.05, 0, 0.09, 2.1, 0.09, 0x757e78);
    const plate = new Mesh(signPlate, signFace);
    plate.position.y = 2.14;
    sign.add(plate);
  }
  for (const d of [1096, 6495, 11402]) {
    const post = atRoad(d, 5.9);
    box(post, 0, 1.1, 0, 0.14, 2.2, 0.14, 0xc2c3ae);
    box(post, 0.46, 2.03, 0, 1.03, 0.24, 0.075, 0xe1dec2);
    box(post, -0.28, 1.75, 0, 0.74, 0.19, 0.12, 0xd2d2bb);
  }
  // Texture the three curved turrets and bays of the baked folly from the original elevation.
  const tower = new Group(),
    site = course.place(11443, 20);
  tower.position.set(site.x, site.y + verge(11443, -20), site.z);
  tower.rotation.y = site.heading;
  group.add(tower);
  const ashlar = new MeshBasicMaterial({ map: follyMap, side: DoubleSide, color: 0xd7cfbc });
  resources.push(ashlar);
  function skin(
    geometry: PlaneGeometry | CylinderGeometry,
    side: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
  ) {
    const coords = geometry.getAttribute('uv');
    for (let i = 0; i < coords.count; i++) coords.setX(i, (side + coords.getX(i)) / 2);
    const mesh = new Mesh(geometry, ashlar);
    mesh.position.set(x, y, z);
    mesh.rotation.y = yaw;
    tower.add(mesh);
    resources.push(geometry);
  }
  for (let j = 0; j < 3; j++) {
    const angle = 0.28 + (j * Math.PI * 2) / 3,
      h = j === 0 ? 20 : 18.9;
    const x = 4.85 * Math.sin(angle),
      z = 4.85 * Math.cos(angle),
      bay = angle + Math.PI / 3;
    skin(new CylinderGeometry(1.625, 1.66, h - 2.65, 18, 1, true), 1, x, (h + 2.65) / 2, z, 0);
    skin(new CylinderGeometry(1.66, 2.25, 2.65, 18, 1, true), 1, x, 1.325, z, 0);
    skin(new PlaneGeometry(8.2, 15.9), 0, 2.8 * Math.sin(bay), 7.96, 2.8 * Math.cos(bay), bay);
  }
  const visitors = new Group();
  group.add(visitors);
  const people = new Figures(
    visitors,
    resources,
    8,
    {
      tops: ['#64794f', '#696b8e', '#a5564b', '#a49b58', '#778a9c'],
      bottoms: ['#464b50', '#5b554b', '#37505a'],
      skins: ['#c59572', '#926746', '#d5ae92', '#956849'],
    },
    2120,
    false,
  );
  function walk(time: number, metres: number) {
    const upper = Math.abs(11430 - metres) < 270;
    visitors.visible = upper || metres < 1560;
    if (!visitors.visible) return;
    for (let i = 0; i < 8; i++) {
      const t = time * 0.048 + i * 0.77;
      const d = upper
        ? 11423 + 10 * Math.sin(t) + i * 1.35
        : 85 + Math.floor(i / 2) * 245 + 9 * Math.sin(t);
      const l = upper
        ? 10 + i * 0.57 + Math.cos(t) * 1.42
        : (i % 2 === 0 ? -1 : 1) * (7.1 + i * 0.32);
      const p = course.place(d, l);
      people.set(
        i,
        p.x,
        p.y + verge(d, -l),
        p.z,
        p.heading + (Math.cos(t) < 0 ? Math.PI : 0),
        0.95 + (i % 3) * 0.04,
        0.025 * Math.abs(Math.sin(time * 2.2 + i)),
      );
    }
    people.commit();
  }
  return {
    group,
    materials: { Lane: lane, Wall: walls, Meadow: meadows, Slate: roofs },
    get walkerPosition() {
      return people.legs.instanceMatrix.array[12];
    },
    get leafAngle() {
      return sway.value;
    },
    get sheepHead() {
      return headY;
    },
    at(time: number, metres: number) {
      sway.value = Math.sin(time * 1.27) + 0.24 * Math.sin(time * 2.9);
      for (const cell of cells) cell.mesh.visible = Math.abs(metres - cell.centre) < cell.reach;
      for (const furniture of streetFurniture)
        furniture.g.visible = Math.abs(metres - furniture.distance) < 360;
      vistaPaint.opacity = Math.max(0, Math.min(1, (metres - 5550) / 400, (7450 - metres) / 430));
      vista.visible = vistaPaint.opacity > 0;
      woodland.value = Math.max(0, Math.min(1, (metres - 2250) / 280, (5250 - metres) / 280));
      tower.visible = Math.abs(11443 - metres) < 1150;
      walk(time, metres);
      graze(time, metres);
    },
    dispose() {
      group.removeFromParent();
      for (const item of resources) item.dispose();
    },
  };
}
