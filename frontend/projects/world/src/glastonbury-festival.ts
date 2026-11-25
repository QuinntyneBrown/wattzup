import {
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  Object3D,
} from 'three/webgpu';
import type { Course } from './course';
import { Figures, seeded } from './world-kit';

const palette = ['#ef476f', '#ffd166', '#219ebc', '#7f55ae', '#e38035', '#4caa8c'];
const jackets = palette.map((value) => new Color(value));
const trousers = ['#263546', '#496047', '#4d4053'].map((value) => new Color(value));
const faces = ['#efc19b', '#b78561', '#784c38', '#d5a27b'].map((value) => new Color(value));
const wardrobe = { tops: palette, bottoms: ['#263546'], skins: ['#b78561'] };

export function glastonburyFestival(course: Course) {
  const group = new Group(),
    owned: { dispose(): void }[] = [];
  type Station = { at: ReturnType<Course['place']>; station: number; phase: number };
  const flags: (Station & { height: number; width: number; colour: Color; pennant: boolean })[] =
    [];
  const people: (Station & {
    scale: number;
    direction: number;
    range: number;
    jacket: Color;
    trousers: Color;
    skin: Color;
  })[] = [];
  const rng = seeded(2128);
  const withinField = (metres: number) =>
    [140, 3450, 3720, 5692, 7901, 10380].some((at) => Math.abs(at - metres) < 190);
  for (let station = 0; station < course.length; station += 8 + rng() * 5) {
    const lane = (rng() < 0.5 ? -1 : 1) * (6.7 + rng() * 6.5);
    const at = course.place(station, lane);
    flags.push({
      at,
      station,
      phase: rng() * 6.28,
      height: 4.8 + rng() * 3.6,
      width: 1.45 + rng() * 1.35,
      colour: jackets[Math.floor(rng() * jackets.length)]!,
      pennant: rng() < 0.37,
    });
  }
  for (let station = 0; station < course.length; station += withinField(station) ? 1.45 : 6.3) {
    const lane = (rng() < 0.5 ? -1 : 1) * (4.75 + rng() * 4.5),
      at = course.place(station, lane);
    people.push({
      station,
      at,
      phase: rng() * 6.28,
      scale: 0.85 + rng() * 0.27,
      direction: rng() < 0.5 ? 1 : -1,
      range: 0.55 + rng() * 1.15,
      jacket: jackets[Math.floor(rng() * jackets.length)]!,
      trousers: trousers[Math.floor(rng() * trousers.length)]!,
      skin: faces[Math.floor(rng() * faces.length)]!,
    });
  }
  const radius = 146,
    maxFlags = 40,
    strips = 6;
  const geom = new BufferGeometry();
  const positions = new Float32BufferAttribute(maxFlags * strips * 6 * 3, 3).setUsage(
    DynamicDrawUsage,
  );
  const colours = new Float32BufferAttribute(maxFlags * strips * 6 * 3, 3).setUsage(
    DynamicDrawUsage,
  );
  geom.setAttribute('position', positions);
  geom.setAttribute('color', colours);
  const cloth = new MeshLambertMaterial({
    vertexColors: true,
    side: DoubleSide,
    flatShading: true,
  });
  const sails = new Mesh(geom, cloth);
  sails.frustumCulled = false;
  const mastGeometry = new CylinderGeometry(0.044, 0.065, 1, 6),
    metal = new MeshLambertMaterial({ color: 0x6b7370 });
  const masts = new InstancedMesh(mastGeometry, metal, maxFlags);
  masts.frustumCulled = false;
  group.add(sails, masts);
  owned.push(geom, cloth, masts, mastGeometry, metal);
  const figures = new Figures(group, owned, 210, wardrobe, 2027, false);
  const pose = new Object3D(),
    state = { flagTip: 0, walkerPosition: 0 };
  function distance(a: number, b: number) {
    const d = Math.abs(a - b);
    return Math.min(d, course.length - d);
  }
  function update(time: number, metres: number, reduced: boolean) {
    const station = ((metres % course.length) + course.length) % course.length,
      t = reduced ? 0 : time;
    let count = 0,
      vertex = 0,
      nearest = Infinity;
    for (const f of flags) {
      const gap = distance(station, f.station);
      if (gap > radius || count >= maxFlags) continue;
      const { x, y, z } = f.at;
      pose.position.set(x, y + f.height / 2, z);
      pose.scale.set(1, f.height, 1);
      pose.updateMatrix();
      masts.setMatrixAt(count++, pose.matrix);
      for (let strip = 0; strip < strips; strip++) {
        for (const [along, low] of [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
          [1, 1],
          [0, 1],
        ] as const) {
          const u = (strip + along) / strips;
          const wave = Math.sin(t * 2.85 + f.phase - u * 5.7) * 0.46 * u;
          const lift = y + f.height - 0.18 * u + 0.13 * u * Math.sin(t * 2.3 + f.phase - u * 4);
          positions.setXYZ(
            vertex,
            x + f.width * u,
            lift - low * (f.pennant ? 1 - u : 1) * 1.18,
            z + wave,
          );
          const stripe = strip === 1 || strip === 2;
          colours.setXYZ(
            vertex++,
            stripe ? 0.95 : f.colour.r,
            stripe ? 0.8 : f.colour.g,
            stripe ? 0.55 : f.colour.b,
          );
          if (gap < nearest && u === 1) state.flagTip = z + wave;
        }
      }
      nearest = Math.min(nearest, gap);
    }
    masts.count = count;
    masts.instanceMatrix.needsUpdate = true;
    geom.setDrawRange(0, vertex);
    positions.needsUpdate = true;
    colours.needsUpdate = true;
    let i = 0;
    nearest = Infinity;
    for (const p of people) {
      const gap = distance(station, p.station);
      if (gap > radius || i >= 210) continue;
      const walk = p.direction * p.range * Math.sin(t * 0.71 + p.phase),
        h = p.at.heading;
      const x = p.at.x - Math.sin(h) * walk,
        z = p.at.z - Math.cos(h) * walk;
      figures.set(
        i,
        x,
        p.at.y,
        z,
        h + (p.direction < 0 ? Math.PI : 0),
        p.scale,
        0.033 * Math.abs(Math.sin(t * 3.8 + p.phase)),
      );
      figures.setColors(
        i,
        p.jacket.r,
        p.jacket.g,
        p.jacket.b,
        p.trousers.r,
        p.trousers.g,
        p.trousers.b,
        p.skin.r,
        p.skin.g,
        p.skin.b,
      );
      if (gap < nearest) {
        nearest = gap;
        state.walkerPosition = Math.abs(Math.sin(h)) > 0.5 ? x : z;
      }
      i++;
    }
    for (const mesh of [figures.legs, figures.bodies, figures.heads]) mesh.count = i;
    figures.commit(true);
  }
  update(0, 0, false);
  return {
    group,
    state,
    update,
    dispose() {
      group.removeFromParent();
      for (const item of owned) item.dispose();
      group.clear();
    },
  };
}
