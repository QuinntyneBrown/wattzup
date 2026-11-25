import { cos, mix, positionWorld, sin, uniform, vec3, vertexColor } from 'three/tsl';
import {
  Box3,
  InstancedMesh,
  Matrix4,
  Object3D,
  type Camera,
  DoubleSide,
  type Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Vector3,
} from 'three/webgpu';

import type { Course } from './course';

export function hanRiver(course: Course) {
  const departures = [125, 1160, 1505, 2080, 3040, 4500, 5270, 6460, 7590, 8390];
  const transform = new Object3D();
  const original = new Matrix4();
  const place = course.place(0);
  let riders: InstancedMesh | undefined;
  const flow = uniform(0);
  let travel = 0;
  const water = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  const p = positionWorld.xz;
  const ripples = sin(
    p.y
      .mul(1.83)
      .add(flow)
      .add(sin(p.x.mul(0.27))),
  )
    .mul(0.5)
    .add(0.5);
  const shimmer = cos(p.y.mul(0.13).add(p.x.mul(0.07)).sub(flow.mul(0.32)))
    .mul(0.5)
    .add(0.5);
  water.colorNode = mix(
    vec3(0.008, 0.021, 0.043),
    vec3(0.021, 0.051, 0.087),
    ripples.mul(0.13).add(shimmer.mul(0.24)),
  );
  const jets = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  const stream = sin(positionWorld.y.mul(2.1).add(positionWorld.x.mul(0.36)).add(flow.mul(2.8)))
    .mul(0.14)
    .add(0.86);
  jets.colorNode = vertexColor().rgb.mul(stream);
  const reflected = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  reflected.colorNode = mix(
    vec3(0.02, 0.042, 0.07),
    vertexColor().rgb,
    ripples.mul(0.56).add(0.05).mul(shimmer.mul(0.36).add(0.64)),
  );
  const rider = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  const tower = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, fog: false });
  const marks = new Map<string, Vector3>();
  const projected = new Vector3();
  function screenCoordinate(kind: string, camera: Camera, axis: 'x' | 'y' = 'x') {
    const mark = marks.get(kind);
    if (!mark) return Infinity;
    projected.copy(mark).project(camera);
    return Math.abs(projected.z) <= 1 ? projected[axis] : Infinity;
  }
  return {
    materials: {
      HanWater: water,
      YeouidoCity: tower,
      BanpoJets: jets,
      BanpoNear: jets,
      HanReflections: reflected,
      HanCyclists: rider,
      NamsanTower: tower,
    },
    landmark(kind: string, mesh: Mesh) {
      if (kind !== 'NamsanTower' && kind !== 'BanpoNear') return;
      const box = new Box3().setFromObject(mesh, true);
      const target = box.getCenter(new Vector3());
      if (kind === 'NamsanTower') {
        marks.set('towerTop', new Vector3(target.x, box.max.y, target.z));
        target.y = box.max.y - 42;
      }
      marks.set(kind, target);
    },
    install(map: Object3D, scene: Object3D) {
      const model = map.getObjectByName('HanCyclists') as Mesh | undefined;
      if (!model?.isMesh) return;
      model.updateWorldMatrix(true, false);
      original.copy(model.matrixWorld);
      model.visible = false;
      riders = new InstancedMesh(model.geometry, rider, departures.length);
      riders.frustumCulled = false;
      scene.add(riders);
    },
    update(seconds: number, camera: Camera) {
      flow.value = (seconds % 3600) * 1.3;
      if (!riders) return;
      let count = 0;
      departures.forEach((departure, index) => {
        const station =
          ((departure + seconds * (4.2 + (index % 3) * 0.68) + 65) % (course.end + 65)) - 65;
        course.place(station, 1.4 + (index % 2) * 0.35, place);
        if (index === 0) travel = station;
        if (Math.hypot(place.x - camera.position.x, place.z - camera.position.z) > 240) return;
        transform.position.set(place.x, place.y + 0.03, place.z);
        transform.rotation.set(0, place.heading + Math.PI / 2, place.pitch, 'YXZ');
        transform.updateMatrix();
        transform.matrix.multiply(original);
        riders!.setMatrixAt(count++, transform.matrix);
      });
      riders.count = count;
      riders.instanceMatrix.needsUpdate = true;
    },
    report(camera: Camera) {
      return {
        fountainFlow: flow.value,
        cyclePhase: travel,
        banpoX: screenCoordinate('BanpoNear', camera),
        towerTopY: screenCoordinate('towerTop', camera, 'y'),
        towerX: screenCoordinate('NamsanTower', camera),
      };
    },
    dispose() {
      marks.clear();
      riders?.removeFromParent();
      riders?.dispose();
      for (const item of [water, jets, reflected, rider, tower]) item.dispose();
    },
  };
}
