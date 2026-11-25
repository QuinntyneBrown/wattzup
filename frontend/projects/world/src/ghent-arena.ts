import {
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';
import { caribanaCyclists } from './caribana-cyclists';

const LAP = 166;

export async function ghentArena(course: Course, low: boolean) {
  const group = new Group();
  const resources: { dispose(): void }[] = [];
  function own<T extends { dispose(): void }>(item: T): T {
    resources.push(item);
    return item;
  }
  const plain = own(new MeshLambertMaterial({ vertexColors: true }));
  const kit = own(await caribanaCyclists(plain, low));
  function ribbon(
    lane: number,
    lift: number,
    height: number,
    repeats: number,
    material: MeshBasicMaterial,
  ) {
    const positions: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let d = 0; d <= LAP; d++) {
      const edge = course.place(d, 5.8),
        outer = course.place(d, lane);
      positions.push(outer.x, edge.y + lift, outer.z, outer.x, edge.y + lift + height, outer.z);
      uv.push((d * repeats) / LAP, 0, (d * repeats) / LAP, 1);
      if (d < LAP) {
        const n = d * 2;
        indices.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
      }
    }
    const geometry = own(new BufferGeometry());
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    group.add(new Mesh(geometry, material));
  }
  const crowd = own(new TextureLoader().load('courses/ghent-stand.webp'));
  crowd.colorSpace = SRGBColorSpace;
  crowd.wrapS = RepeatWrapping;
  const fans = own(new MeshBasicMaterial({ map: crowd, alphaTest: 0.46, side: DoubleSide }));
  ribbon(10.4, 2.7, 4.45, 11, fans);
  ribbon(6.15, 1.02, 3.15, 15, fans);
  const ad = document.createElement('canvas');
  ad.width = 1536;
  ad.height = 80;
  const signs = ad.getContext('2d')!;
  for (const [i, [name, ground, ink]] of [
    ['GENT • ZESDAAGSE', '#8f251c', '#fff1cc'],
    ['KUIPKE', '#eedc9b', '#293e48'],
    ['FIETSEN 166', '#27675d', '#fff2d6'],
    ['VELO CLUB', '#213447', '#edce73'],
  ].entries()) {
    signs.fillStyle = ground!;
    signs.fillRect(i * 384, 0, 384, 80);
    signs.fillStyle = ink!;
    signs.font = 'bold 39px system-ui';
    signs.textAlign = 'center';
    signs.fillText(name!, i * 384 + 192, 54);
  }
  const advert = own(new CanvasTexture(ad));
  advert.colorSpace = SRGBColorSpace;
  advert.wrapS = RepeatWrapping;
  ribbon(5.75, 0.07, 0.96, 8, own(new MeshBasicMaterial({ map: advert, side: DoubleSide })));

  const face = document.createElement('canvas');
  face.width = 512;
  face.height = 256;
  const ctx = face.getContext('2d')!;
  const display = own(new CanvasTexture(face));
  display.colorSpace = SRGBColorSpace;
  const panel = new Mesh(
    own(new PlaneGeometry(4.6, 2.3)),
    own(new MeshBasicMaterial({ map: display, side: DoubleSide })),
  );
  panel.position.set(10, 4, 11);
  panel.rotation.y = -1.18;
  group.add(panel);
  const metal = own(new MeshLambertMaterial({ color: 0xb88738 }));
  function cylinder(top: number, bottom: number, height: number, x: number, y: number, z: number) {
    const mesh = new Mesh(own(new CylinderGeometry(top, bottom, height, 16)), metal);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  }
  cylinder(0.08, 0.1, 5.7, 10, 2.2, 11);
  cylinder(0.08, 0.33, 0.44, 10, 2.48, 12.25);
  cylinder(0.12, 0.12, 0.12, 10, 2.22, 12.25);
  const bracket = cylinder(0.035, 0.035, 1.25, 10, 2.75, 11.625);
  bracket.rotation.x = Math.PI / 2;
  const cheer = new Group();
  cheer.position.set(-4, 0.61, -7.4);
  group.add(cheer);
  const sleeve = new Mesh(
    own(new CylinderGeometry(0.085, 0.11, 0.54, 8)),
    own(new MeshLambertMaterial({ color: 0xa7472f })),
  );
  sleeve.position.y = 0.23;
  cheer.add(sleeve);
  const hand = new Mesh(
    own(new SphereGeometry(0.091, 9, 6)),
    own(new MeshLambertMaterial({ color: 0xca926d })),
  );
  hand.position.y = 0.55;
  cheer.add(hand);
  const figure = new Mesh(own(new CylinderGeometry(0.23, 0.15, 0.83, 9)), sleeve.material);
  figure.position.set(-4.19, 0.29, -7.4);
  group.add(figure);
  const head = new Mesh(own(new SphereGeometry(0.16, 10, 8)), hand.material);
  head.position.set(-4.19, 0.87, -7.4);
  group.add(head);

  const jerseys = [0xbb3832, 0xd6533d, 0x3568aa, 0x427cc1];
  const riders = jerseys.map((colour, i) => {
    const cyclist = kit.make(new Color(colour), i + 11);
    group.add(cyclist.group);
    return cyclist;
  });
  const grip = own(new MeshLambertMaterial({ color: 0xbb866f }));
  const links = riders.map(() => {
    const arm = new Mesh(own(new CylinderGeometry(0.052, 0.064, 1, 8)), grip);
    group.add(arm);
    return arm;
  });
  const up = new Vector3(0, 1, 0),
    a = new Vector3(),
    b = new Vector3(),
    dir = new Vector3();
  let displayLap = 0;
  const state = { relayPosition: 0, spectatorHeight: 0, displayLap: 0 };
  function update(time: number, metres: number) {
    const lap = Math.floor(metres / LAP) + 1;
    if (lap !== displayLap) {
      displayLap = lap;
      state.displayLap = lap;
      ctx.fillStyle = '#251d1a';
      ctx.fillRect(0, 0, 512, 256);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#efe0aa';
      ctx.font = 'bold 40px system-ui';
      ctx.fillText('GENT  •  RONDE', 256, 55);
      ctx.fillStyle = '#ffb540';
      ctx.font = 'bold 152px monospace';
      ctx.fillText(String(lap).padStart(2, '0'), 256, 210);
      display.needsUpdate = true;
    }
    cheer.rotation.z = -0.7 + 0.53 * Math.sin(time * 3);
    cheer.updateWorldMatrix(true, true);
    state.spectatorHeight = hand.matrixWorld.elements[13]!;
    riders.forEach((cyclist, i) => {
      const partner = i % 2,
        team = Math.floor(i / 2),
        phase = time * 0.42 + team * 2;
      const spread = (1 - Math.cos(phase)) * 0.5;
      const d = (time * 9 + team * 83 + 17 + partner * (1.1 + spread * 8)) % LAP;
      const lane = 1.55 + partner * (0.55 + spread * 2.65);
      const at = course.place(d, lane);
      cyclist.group.position.set(at.x, at.y + 0.015, at.z);
      cyclist.group.rotation.set(at.pitch, at.heading, at.bank ?? 0, 'YXZ');
      cyclist.pose(time * 6.8 + i, at.bank ?? 0);
      if (!i) state.relayPosition = at.x;
      const link = links[i]!;
      link.visible = spread < 0.12;
      if (link.visible) {
        a.set(partner ? -0.18 : 0.18, 1.22, -0.12);
        b.set(partner ? -0.38 : 0.38, 1.03, partner ? 0.49 : -0.55);
        cyclist.group.localToWorld(a);
        cyclist.group.localToWorld(b);
        dir.subVectors(b, a);
        link.position.copy(a).addScaledVector(dir, 0.5);
        link.scale.y = dir.length();
        link.quaternion.setFromUnitVectors(up, dir.normalize());
      }
    });
  }
  update(0, 0);
  return {
    group,
    state,
    update,
    dispose: () => {
      group.removeFromParent();
      for (const r of resources) r.dispose();
    },
  };
}
