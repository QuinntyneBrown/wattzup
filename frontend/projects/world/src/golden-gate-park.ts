import {
  BoxGeometry,
  type Camera,
  Vector3,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
} from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Course } from './course';
import { canvasTexture, Figures, seeded } from './world-kit';

export function goldenGatePark(course: Course) {
  const group = new Group(),
    owned: { dispose(): void }[] = [],
    rng = seeded(2129);
  const pigment = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
  owned.push(pigment);
  const ball = new SphereGeometry(1, 14, 10),
    box = new BoxGeometry(1, 1, 1),
    leg = new CylinderGeometry(1, 0.8, 1, 8),
    horn = new TorusGeometry(0.16, 0.045, 6, 9, Math.PI * 0.8);
  owned.push(ball, box, leg, horn);
  type Part = [
    BufferGeometry,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number?,
    number?,
    number?,
  ];
  function model(parts: Part[]) {
    const c = new Color();
    const pieces = parts.map(([base, tone, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0]) => {
      const g = base.index ? base.toNonIndexed() : base.clone();
      g.deleteAttribute('uv');
      g.scale(w, h, d);
      g.rotateX(rx);
      g.rotateY(ry);
      g.rotateZ(rz);
      g.translate(x, y, z);
      const count = g.getAttribute('position').count,
        colors = new Float32Array(count * 3);
      c.setHex(tone);
      for (let i = 0; i < count; i++) c.toArray(colors, i * 3);
      g.setAttribute('color', new Float32BufferAttribute(colors, 3));
      return g;
    });
    const geometry = mergeGeometries(pieces)!;
    pieces.forEach((p) => p.dispose());
    owned.push(geometry);
    return new Mesh(geometry, pigment);
  }
  function at(station: number, lane: number) {
    const p = course.place(station, lane),
      frame = new Group();
    frame.position.set(p.x, p.y, p.z);
    frame.rotation.y = p.heading;
    group.add(frame);
    return frame;
  }
  // The grazing herd shares the original park world's heavy shoulder, beard and curved horn proportions.
  const wool = 0x452e20,
    dark = 0x302520,
    hide = 0x705039;
  function buffalo(calf: boolean) {
    const shag = calf ? 0xaa7345 : wool,
      bodyTone = calf ? 0xb38051 : hide;
    const body: Part[] = [
      [ball, bodyTone, 0, 1.16, 0.51, 0.53, 0.63, 0.92],
      [ball, shag, 0, 1.41, -0.32, 0.69, 0.84, 0.91],
      [ball, shag, 0, 1.92, -0.3, 0.52, 0.49, 0.58],
      [leg, dark, 0, 0.99, 1.36, 0.045, 0.83, 0.044, -0.19],
    ];
    for (const side of [-1, 1]) {
      for (const z of [-0.54, 0.8]) {
        body.push(
          [leg, dark, side * 0.32, 0.5, z, 0.105, 0.95, 0.12],
          [ball, dark, side * 0.32, 0.12, z - 0.025, 0.12, 0.097, 0.18],
        );
      }
      for (let i = 0; i < 15; i++) {
        const angle = i * 2.4;
        body.push([
          ball,
          shag,
          side * (0.45 + 0.13 * Math.sin(angle)),
          1.34 + 0.31 * Math.cos(angle),
          -0.58 + 0.32 * Math.sin(angle * 1.7),
          0.095,
          0.23,
          0.13,
        ]);
      }
    }
    const head: Part[] = [
      [ball, shag, 0, 0, 0, 0.44, 0.45, 0.47],
      [ball, dark, 0, -0.16, -0.37, 0.29, 0.26, 0.34],
      [ball, shag, 0, -0.47, -0.19, 0.17, 0.32, 0.16],
    ];
    for (const side of [-1, 1]) {
      head.push(
        [ball, dark, side * 0.39, 0.09, -0.02, 0.21, 0.1, 0.13],
        [ball, 0x161712, side * 0.3, 0.11, -0.34, 0.045, 0.042, 0.036],
      );
      if (!calf)
        head.push([
          horn,
          0xbfb29a,
          side * 0.35,
          0.18,
          0.014,
          1,
          1,
          1,
          0,
          side > 0 ? 0 : Math.PI,
          0.34,
        ]);
    }
    return { body: model(body), head: model(head) };
  }
  const adults = buffalo(false),
    young = buffalo(true);
  const herd = Array.from({ length: 18 }, (_, i) => {
    const station = i === 0 ? 4050 : 3990 + rng() * 186,
      lane = i === 0 ? -12.5 : -12 - rng() * 19;
    const frame = at(station, lane);
    frame.rotation.y += i === 0 ? 1.0 : rng() * 6.28;
    const calf = i % 5 === 4,
      shape = calf ? young : adults,
      head = shape.head.clone();
    frame.scale.setScalar(calf ? 0.86 : 1.19);
    head.position.set(0, 1.04, -1.08);
    frame.add(shape.body.clone(), head);
    return { frame, head, phase: rng() * 6.28 };
  });
  const glassMap = new TextureLoader().load('courses/goldengate-conservatory.webp');
  glassMap.colorSpace = SRGBColorSpace;
  glassMap.anisotropy = 4;
  const glass = new MeshBasicMaterial({ map: glassMap, alphaTest: 0.46, side: DoubleSide });
  const frontGeometry = new PlaneGeometry(61, 20.35);
  const front = new Mesh(frontGeometry, glass),
    conservatory = at(205, 40);
  front.position.set(0, 10.25, 3.4);
  conservatory.add(front);
  owned.push(glassMap, glass, frontGeometry);

  const sailGeometry = new BufferGeometry();
  sailGeometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [0, 0, 0, 0, 1.75, 0, 0, 0.06, -0.71, 0, 0.03, 0.04, 0, 1.39, 0.04, 0, 0.02, 0.49],
      3,
    ),
  );
  sailGeometry.computeVertexNormals();
  owned.push(sailGeometry);
  const yacht = model([
    [ball, 0xd3cec0, 0, 0.065, 0, 0.17, 0.16, 0.71],
    [leg, 0x746b5e, 0, 0.9, 0, 0.027, 1.81, 0.027],
    [sailGeometry, 0xf1f2e6, 0, 0.15, 0, 1, 1, 1],
  ]);
  const boats = Array.from({ length: 10 }, (_, i) => {
    const frame = at(3150, 40);
    const hull = yacht.clone();
    frame.add(hull);
    return { frame, hull, along: (i - 4.5) * 10, lane: ((i % 3) - 1) * 13, phase: i * 1.61 };
  });
  const duck = model([
    [ball, 0x746753, 0, 0.15, 0, 0.2, 0.15, 0.32],
    [ball, 0x415a48, 0, 0.35, -0.23, 0.14, 0.15, 0.14],
    [ball, 0xdbae60, 0, 0.32, -0.38, 0.09, 0.05, 0.12],
  ]);
  const ducks = Array.from({ length: 9 }, (_, i) => {
    const frame = at(3150, 40),
      bird = duck.clone();
    frame.add(bird);
    return { frame, bird, phase: i * 0.71 };
  });
  const fanParts: Part[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2,
      cs = Math.cos(a),
      sn = Math.sin(a);
    const beam = (u: number, v: number, w: number, h: number, colour: number) => {
      fanParts.push([box, colour, u * cs - v * sn, u * sn + v * cs, 0, w, h, 0.14, 0, 0, a]);
    };
    beam(0, 6.7, 0.32, 14, 0x644f39);
    for (let j = 0; j < 4; j++) beam(0.15 + j * 0.6, 8.2, 0.1, 10.5, 0xdcd8bd);
    for (let j = 0; j < 15; j++) beam(1.08, 3.1 + j * 0.72, 2.18, 0.12, 0xdbd8c1);
  }
  const sails = model(fanParts),
    mill = at(5670, -23);
  sails.position.set(0, 16.6, 4.65);
  mill.add(sails);
  const beach = course.place(course.length);
  const foamMap = canvasTexture(256, 64, (g) => {
    const random = seeded(21301);
    g.clearRect(0, 0, 256, 64);
    for (let i = 0; i < 950; i++) {
      const x = random() * 256,
        u = x / 256,
        mid = 29 + 7 * Math.sin(u * 12.56) + 4 * Math.sin(u * 31.4);
      g.fillStyle = 'rgba(247,250,234,' + (0.2 + random() * 0.57) + ')';
      g.beginPath();
      g.ellipse(x, mid + random() * 8, 1 + random() * 5, 0.7 + random() * 2.2, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
  const foamMaterial = new MeshBasicMaterial({
    map: foamMap,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const foamGeometry = new PlaneGeometry(52, 9);
  owned.push(foamGeometry, foamMap, foamMaterial);
  const surf = new Group();
  group.add(surf);
  surf.position.set(beach.x + 70, 1.7, beach.z);
  const waves = Array.from({ length: 42 }, (_, i) => {
    const mesh = new Mesh(foamGeometry, foamMaterial);
    mesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    mesh.position.set((i % 3) * 12, 0, (Math.floor(i / 3) - 6) * 46);
    surf.add(mesh);
    return mesh;
  });
  const rock = model([
    [ball, 0x586057, 0, 0, 0, 18, 8, 12],
    [ball, 0x62685f, 12, -1, 5, 11, 4, 8],
    [ball, 0x56645d, -8, -2, -9, 9, 4, 9],
  ]);
  rock.position.set(beach.x + 257, 1, beach.z - 115);
  group.add(rock);
  const projection = new Vector3();
  function screenX(mesh: Mesh, camera: Camera) {
    mesh.getWorldPosition(projection).project(camera);
    return Math.abs(projection.z) <= 1 ? projection.x : Infinity;
  }
  const pedal = model([
    [ball, 0xdfb44e, -0.48, 0.05, 0, 0.29, 0.25, 1.35],
    [ball, 0xdfb44e, 0.48, 0.05, 0, 0.29, 0.25, 1.35],
    [box, 0xce544a, 0, 0.35, 0.16, 1.04, 0.17, 1.12],
    [box, 0x62594b, 0, 0.65, 0.42, 0.87, 0.54, 0.13],
  ]);
  const launches = Array.from({ length: 4 }, (_, i) => {
    const f = at(1797, -43),
      boat = pedal.clone();
    boat.position.set((i % 2 ? 1 : -1) * (7 + i * 2), -1.12, (i - 2) * 8);
    boat.rotation.y = i * 1.62;
    f.add(boat);
    return f;
  });
  const walkers = new Figures(
    group,
    owned,
    32,
    {
      tops: ['#ce583e', '#427d83', '#a67853', '#7c6391'],
      bottoms: ['#445463', '#545556'],
      skins: ['#b78367', '#deb38c', '#885f45'],
    },
    403,
    false,
  );
  const parks = [190, 1650, 3050, 4050, 5560, 6200];
  const marks = parks.flatMap((s) =>
    Array.from({ length: 14 }, (_, i) => ({
      station: s - 74 + i * 12,
      lane: 5.64 + rng() * 1.2,
      phase: rng() * 6.28,
    })),
  );
  const pose = course.place(0);
  const mistMap = canvasTexture(256, 128, (g) => {
    g.clearRect(0, 0, 256, 128);
    for (let i = 0; i < 65; i++) {
      const x = 24 + rng() * 208,
        y = 51 + rng() * 27,
        r = 10 + rng() * 27;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(223,231,226,.16)');
      grad.addColorStop(1, 'rgba(223,231,226,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  const mistMaterial = new MeshBasicMaterial({
    map: mistMap,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    side: DoubleSide,
  });
  const fogGeometry = new PlaneGeometry(160, 23);
  owned.push(mistMap, mistMaterial, fogGeometry);
  const banks = Array.from({ length: 41 }, (_, i) => {
    const station = 66 + i * 155,
      frame = at(station, i % 2 ? 28 : -28);
    const fog = new Mesh(fogGeometry, mistMaterial);
    frame.add(fog);
    return { station, frame, fog };
  });
  const state = {
    bisonHead: 0,
    sailPosition: 0,
    glassX: Infinity,
    millX: Infinity,
    surfX: Infinity,
  };
  function update(time: number, metres: number, reduced: boolean) {
    const t = reduced ? 0 : time;
    for (const b of herd) {
      b.frame.visible = Math.abs(metres - 4090) < 420;
      b.head.rotation.x = 0.55 + 0.34 * Math.sin(t * 0.56 + b.phase);
    }
    state.bisonHead = herd[0]!.head.rotation.x;
    for (const { frame, hull, along, lane, phase } of boats) {
      frame.visible = Math.abs(metres - 3150) < 430;
      hull.position.set(
        lane + 4.4 * Math.sin(t * 0.072 + phase),
        -1.1 + 0.095 * Math.sin(t * 1.3 + phase),
        along + 6 * Math.sin(t * 0.091 + phase),
      );
      hull.rotation.set(
        0.025 * Math.sin(t * 0.83 + phase),
        phase + 0.41 * Math.sin(t * 0.09 + phase),
        0.13 * Math.sin(t * 0.7 + phase),
      );
    }
    state.sailPosition = boats[0]!.hull.position.z;
    for (const { frame, bird, phase } of ducks) {
      frame.visible = Math.abs(metres - 3150) < 270;
      bird.position.set(-27 + phase + 1.1 * Math.sin(t * 0.16 + phase), -1.12, 12 + phase * 1.8);
      bird.rotation.y = 0.4 + Math.sin(t * 0.15 + phase);
    }
    surf.visible = rock.visible = metres > 5730;
    if (surf.visible)
      waves.forEach((wave, i) => {
        wave.position.x = (i % 3) * 12 - 2.7 * Math.sin(t * 0.48 + i * 0.41);
        wave.position.y = 0.17 * Math.sin(t * 0.68 + i * 0.35);
      });
    for (const f of launches) f.visible = Math.abs(metres - 1797) < 320;
    mill.visible = Math.abs(metres - 5700) < 560;
    sails.rotation.z = 0.33 + t * 0.12;
    conservatory.visible = metres < 620;
    let count = 0;
    for (const m of marks) {
      if (Math.abs(m.station - metres) > 146) continue;
      course.place(
        m.station + 3.5 * Math.sin(t * 0.22 + m.phase),
        m.lane + 0.32 * Math.sin(t * 0.8 + m.phase),
        pose,
      );
      walkers.set(
        count++,
        pose.x,
        pose.y + 0.13,
        pose.z,
        pose.heading + 0.13 * Math.sin(t * 0.86 + m.phase),
        1,
        0.036 * Math.abs(Math.sin(t * 2 + m.phase)),
      );
    }
    for (const mesh of [walkers.legs, walkers.bodies, walkers.heads]) mesh.count = count;
    walkers.commit();
    for (const bank of banks) {
      bank.frame.visible = Math.abs(bank.station - metres) < 330;
      bank.fog.position.set(
        9 * Math.sin(t * 0.048 + bank.station),
        6.8 + 0.4 * Math.sin(t * 0.065),
        0,
      );
    }
  }
  update(0, 0, false);
  return {
    group,
    update,
    measure(camera: Camera) {
      state.glassX = screenX(front, camera);
      state.millX = screenX(sails, camera);
      state.surfX = screenX(waves[18]!, camera);
      return state;
    },
    dispose() {
      group.removeFromParent();
      for (const item of owned) item.dispose();
      group.clear();
    },
  };
}
