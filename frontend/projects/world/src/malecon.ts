import {
  cos,
  max,
  mix,
  modelScale,
  positionLocal,
  positionWorld,
  sin,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  Box3,
  type Camera,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  type Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';

const vehicles = [
  { name: 'TaxiRed', lane: -7.2, speed: -9.1, offset: 187 },
  { name: 'TaxiTeal', lane: -10.3, speed: -11.2, offset: 359 },
  { name: 'Convertible', lane: 3.52, speed: 7.2, offset: 44 },
  { name: 'CocoTaxi', lane: 2.3, speed: 5.2, offset: 126 },
  { name: 'BiciTaxi', lane: 4.02, speed: 3.3, offset: 263 },
] as const;

// Distances and intervals in metres. The son trio gathers at the musicians' viewpoint.
const streetLife = [
  { name: 'SonTrio', offset: 6561, spacing: 8950, lane: -16.0 },
  { name: 'Parada', offset: 112, spacing: 423, lane: 6.0 },
  { name: 'DominoTable', offset: 147, spacing: 383, lane: 7.1 },
  { name: 'FruitCart', offset: 98, spacing: 237, lane: 6.2 },
  { name: 'Manisero', offset: 89, spacing: 119, lane: 5.9 },
  { name: 'PhotoParty', offset: 257, spacing: 737, lane: 6.8 },
  { name: 'ZebraCrossing', offset: 122, spacing: 166, lane: -0.7 },
  { name: 'TaxiTeal', offset: 95, spacing: 124, lane: 4.02 },
  { name: 'TaxiRed', offset: 104, spacing: 169, lane: 4.05 },
] as const;

export function malecon(course: Course) {
  const atlas = new TextureLoader().load('courses/havana-surfaces.webp');
  atlas.flipY = false;
  atlas.colorSpace = SRGBColorSpace;
  atlas.anisotropy = 4;
  // Original class windows, ironwork, portales and shops share one atlas.
  const front = new MeshBasicMaterial({
    map: atlas,
    vertexColors: true,
    side: DoubleSide,
    alphaTest: 0.42,
  });
  const elevationAtlas = new TextureLoader().load('courses/havana-elevations.webp');
  elevationAtlas.colorSpace = SRGBColorSpace;
  elevationAtlas.flipY = false;
  elevationAtlas.anisotropy = 8;
  const elevations = new MeshBasicMaterial({
    map: elevationAtlas,
    side: DoubleSide,
    alphaTest: 0.46,
  });
  const wall = new MeshBasicNodeMaterial({ side: DoubleSide });
  wall.colorNode = texture(
    atlas,
    uv().fract().mul(vec2(0.247, 0.49)).add(vec2(0.751, 0.005)),
  ).rgb.mul(vertexColor().rgb);
  const water = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  const clock = uniform(0),
    p = positionWorld.xz;
  const crest = sin(
    p.y
      .mul(0.26)
      .add(clock)
      .add(sin(p.x.mul(0.09)))
      .add(cos(p.x.mul(0.021)).mul(0.32)),
  );
  const sparkle = max(
    0,
    cos(
      p.y
        .mul(1.65)
        .add(clock.mul(1.34))
        .add(sin(p.x.mul(0.41))),
    ),
  ).pow(9);
  water.colorNode = mix(
    vec3(0.035, 0.17, 0.18),
    vec3(0.107, 0.33, 0.34),
    crest.mul(0.22).add(0.48),
  ).add(vec3(0.18, 0.12, 0.057).mul(sparkle));
  const spray = new MeshBasicNodeMaterial({ side: DoubleSide });
  const rise = max(0, sin(clock.mul(0.81).add(uv().x.mul(24))));
  spray.positionNode = positionLocal.add(
    vec3(
      0,
      rise.oneMinus().mul(-11).div(vec3(modelScale).y),
      rise.mul(1.2).div(vec3(modelScale).z),
    ),
  );
  spray.colorNode = vertexColor().rgb.mul(
    sin(uv().y.mul(17).add(clock.mul(2.6)))
      .mul(0.06)
      .add(0.95),
  );
  const foam = sin(uv().x.mul(19).add(positionWorld.z.mul(5)).add(clock)).mul(
    sin(positionWorld.y.mul(11).add(positionWorld.x.mul(7)).sub(clock.mul(2))),
  );
  spray.opacityNode = foam.mul(0.38).add(0.65);
  spray.alphaTest = 0.4;
  const wet = new MeshBasicNodeMaterial({ side: DoubleSide });
  wet.colorNode = mix(vec3(0.13, 0.14, 0.14), vec3(0.48, 0.48, 0.42), rise.mul(0.7).add(0.15));
  const paint = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, fog: false });
  const marks = new Map<string, Vector3>();
  const projected = new Vector3(),
    transform = new Object3D(),
    place = course.place(0);
  const roadUsers: { mesh: InstancedMesh; origin: Matrix4; type: (typeof vehicles)[number] }[] = [];
  const pavement: { mesh: InstancedMesh; origin: Matrix4; type: (typeof streetLife)[number] }[] =
    [];
  let taxiMetres = 0;
  function screenX(kind: string, camera: Camera) {
    const point = marks.get(kind);
    if (!point) return Infinity;
    projected.copy(point).project(camera);
    return Math.abs(projected.z) <= 1 ? projected.x : Infinity;
  }
  return {
    lookAcross(metres: number) {
      // The long slight bend opens the sea side of the road at the breakers and the trio.
      const coast = (centre: number) => Math.exp(-(((metres - centre) / 125) ** 2));
      return -4.2 * (coast(4380) + coast(6510));
    },
    materials: {
      MaleconStone: wall,
      FloridaStraits: water,
      Portales: front,
      OriginalElevations: elevations,
      Nacional: paint,
      Morro: paint,
      TaxiRed: paint,
      TaxiTeal: paint,
      Convertible: paint,
      CocoTaxi: paint,
      BiciTaxi: paint,
      ...Object.fromEntries(streetLife.map(({ name }) => [name, paint])),
      WallSpray: spray,
      SaltPuddles: wet,
    },
    landmark(kind: string, mesh: Mesh) {
      if (kind !== 'Nacional' && kind !== 'Morro') return;
      const box = new Box3().setFromObject(mesh, true),
        tip = box.getCenter(new Vector3());
      if (kind === 'Morro') {
        const positions = mesh.geometry.getAttribute('position');
        let count = 0;
        tip.set(0, 0, 0);
        const point = new Vector3();
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
          if (point.y > box.max.y - 1.8) {
            tip.add(point);
            count++;
          }
        }
        if (count) tip.multiplyScalar(1 / count);
      } else tip.y = box.max.y - 3;
      marks.set(kind, tip);
    },
    install(map: Object3D, scene: Object3D) {
      for (const type of streetLife) {
        const original = map.getObjectByName(type.name) as Mesh | undefined;
        if (!original?.isMesh) continue;
        original.updateWorldMatrix(true, false);
        original.visible = false;
        const mesh = new InstancedMesh(original.geometry, paint, Math.ceil(227 / type.spacing) + 1);
        mesh.frustumCulled = false;
        scene.add(mesh);
        pavement.push({ mesh, type, origin: original.matrixWorld.clone() });
      }
      for (const type of vehicles) {
        const original = map.getObjectByName(type.name) as Mesh | undefined;
        if (!original?.isMesh) continue;
        original.updateWorldMatrix(true, false);
        original.visible = false;
        const mesh = new InstancedMesh(original.geometry, paint, 6);
        mesh.frustumCulled = false;
        scene.add(mesh);
        roadUsers.push({ mesh, type, origin: original.matrixWorld.clone() });
      }
    },
    update(seconds: number, camera: Camera, metres: number) {
      clock.value = seconds;
      for (const { mesh, type, origin } of pavement) {
        let n = 0;
        const start = Math.max(0, Math.ceil((metres - 17 - type.offset) / type.spacing));
        for (let i = start; ; i++) {
          const d = type.offset + i * type.spacing;
          if (d > Math.min(course.end, metres + 210)) break;
          course.place(d, type.lane, place);
          transform.position.set(place.x, place.y + 0.04, place.z);
          transform.rotation.set(0, place.heading + Math.PI / 2, place.pitch, 'YXZ');
          transform.updateMatrix();
          transform.matrix.multiply(origin);
          mesh.setMatrixAt(n++, transform.matrix);
        }
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
      }
      for (const { mesh, type, origin } of roadUsers) {
        let n = 0;
        for (let i = 0; i < 31; i++) {
          const span = course.end + 65;
          const d =
            ((((i * 291 + type.offset + seconds * type.speed + 65) % span) + span) % span) - 65;
          if (type.name === 'TaxiRed' && i === 0) taxiMetres = d;
          course.place(d, type.lane, place);
          if (Math.hypot(place.x - camera.position.x, place.z - camera.position.z) > 350 || n >= 6)
            continue;
          transform.position.set(place.x, place.y + 0.047, place.z);
          transform.rotation.set(
            0,
            place.heading + Math.PI / 2 + (type.speed < 0 ? Math.PI : 0),
            place.pitch,
            'YXZ',
          );
          transform.updateMatrix();
          transform.matrix.multiply(origin);
          mesh.setMatrixAt(n++, transform.matrix);
        }
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
    report(camera: Camera) {
      return {
        breaker: clock.value,
        taxiMetres,
        hotelX: screenX('Nacional', camera),
        morroX: screenX('Morro', camera),
      };
    },
    dispose() {
      marks.clear();
      for (const { mesh } of [...roadUsers, ...pavement]) {
        mesh.removeFromParent();
        mesh.dispose();
      }
      roadUsers.length = 0;
      pavement.length = 0;
      for (const asset of [
        atlas,
        elevationAtlas,
        elevations,
        front,
        wall,
        water,
        spray,
        wet,
        paint,
      ])
        asset.dispose();
    },
  };
}
