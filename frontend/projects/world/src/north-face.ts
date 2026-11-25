import {
  mix,
  normalWorld,
  positionWorld,
  sin,
  smoothstep,
  uniform,
  vec3,
  texture as sampleTexture,
  vertexColor,
} from 'three/tsl';
import {
  Box3,
  type Camera,
  DoubleSide,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
} from 'three/webgpu';
import type { Course } from './course';
import { canvasTexture, seeded } from './world-kit';

export function northFace(course: Course) {
  const loader = new TextureLoader();
  const rock = loader.load('courses/granite-north-face.webp');
  rock.colorSpace = SRGBColorSpace;
  rock.wrapS = rock.wrapT = MirroredRepeatWrapping;
  rock.anisotropy = 4;
  const cliff = new MeshBasicMaterial({
    map: rock,
    vertexColors: true,
    side: DoubleSide,
    fog: false,
  });
  const fell = new MeshBasicNodeMaterial({ side: DoubleSide });
  const slopeLight = normalWorld
    .dot(vec3(-0.37, 0.75, 0.53))
    .mul(0.25)
    .add(0.85);
  fell.colorNode = sampleTexture(rock)
    .rgb.mul(0.88)
    .add(0.7)
    .mul(vertexColor().rgb)
    .mul(slopeLight);
  const tar = new MeshBasicNodeMaterial({ side: DoubleSide });
  const aggregate = sampleTexture(rock, positionWorld.xz.mul(0.065)).r;
  const pavement = sampleTexture(rock, positionWorld.xz.mul(0.62)).g;
  tar.colorNode = vec3(0.057, 0.063, 0.068).mul(
    aggregate.mul(0.92).add(pavement.mul(0.43)).add(0.75),
  );
  const trees = loader.load('courses/granite-conifers.webp');
  trees.flipY = false;
  trees.colorSpace = SRGBColorSpace;
  const conifers = new MeshBasicMaterial({ map: trees, alphaTest: 0.38, side: DoubleSide });
  const paint = loader.load('courses/granite-col-signs.webp');
  paint.flipY = false;
  paint.colorSpace = SRGBColorSpace;
  paint.anisotropy = 8;
  const board = new MeshBasicMaterial({ map: paint, side: DoubleSide, alphaTest: 0.3 });
  const marks = new Map<string, Vector3>();
  const projected = new Vector3();
  function landmark(kind: string, mesh: Mesh) {
    if (kind === 'SummitSign' || kind === 'SixthBorne')
      marks.set(kind, new Box3().setFromObject(mesh, true).getCenter(new Vector3()));
  }
  function screenX(kind: string, camera: Camera) {
    const point = marks.get(kind);
    if (!point) return Infinity;
    projected.copy(point).project(camera);
    return Math.abs(projected.z) <= 1 ? projected.x : Infinity;
  }
  const phase = uniform(0);
  const water = new MeshBasicNodeMaterial({ side: DoubleSide });
  // Wave crests follow the fall of the baked streambed, in metres.
  const wave = sin(positionWorld.y.mul(4.2).add(positionWorld.x.mul(0.35)).add(phase));
  water.colorNode = mix(
    vec3(0.12, 0.28, 0.32),
    vec3(0.62, 0.84, 0.9),
    smoothstep(0.24, 0.97, wave),
  );
  const texture = canvasTexture(384, 96, (ctx) => {
    const rand = seeded(2131);
    for (let i = 0; i < 90; i++) {
      const x = rand() * 384,
        y = 32 + rand() * 28,
        radius = 8 + rand() * 24;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, 'rgba(189,199,218,.24)');
      g.addColorStop(1, 'rgba(163,180,204,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
    }
  });
  const mist = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const plane = new PlaneGeometry(235, 27);
  const group = new Group();
  const banks = [3520, 3745, 6160, 9320, 12550, 15120].map((d, i) => {
    const anchor = course.place(d, Math.sin(course.place(d).heading) > 0 ? -75 : 75);
    const mesh = new Mesh(plane, mist);
    mesh.position.set(anchor.x, anchor.y - 23, anchor.z);
    mesh.rotation.y = course.place(d).heading + (i % 2 ? -0.48 : 0.34);
    group.add(mesh);
    return { mesh, x: anchor.x };
  });
  return {
    group,
    materials: {
      Meltwater: water,
      NorthFace: cliff,
      FellGround: fell,
      ColTarmac: tar,
      ColConifers: conifers,
      ColSigns: board,
      SummitSign: board,
      SixthBorne: board,
    },
    landmark,
    update(seconds: number) {
      phase.value = (seconds % 240) * 3;
      for (const [i, bank] of banks.entries())
        bank.mesh.position.x = bank.x + 21 * Math.sin(seconds * 0.032 + i);
    },
    report(camera: Camera) {
      return {
        borneX: screenX('SixthBorne', camera),
        summitX: screenX('SummitSign', camera),
        meltwater: phase.value,
        mistPosition: banks[0]!.mesh.position.x,
      };
    },
    dispose() {
      group.removeFromParent();
      group.clear();
      plane.dispose();
      mist.dispose();
      texture.dispose();
      water.dispose();
      rock.dispose();
      paint.dispose();
      cliff.dispose();
      fell.dispose();
      tar.dispose();
      trees.dispose();
      conifers.dispose();
      board.dispose();
    },
  };
}
