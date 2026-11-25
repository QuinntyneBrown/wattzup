import {
  smoothstep,
  mix,
  modelScale,
  positionLocal,
  positionWorld,
  sin,
  texture,
  uniform,
  uv,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  Box3,
  Matrix4,
  Object3D,
  SRGBColorSpace,
  TextureLoader,
  type Camera,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  RepeatWrapping,
  Vector3,
} from 'three/webgpu';
import { brackenTexture, cloudTexture, plateTexture, warningTexture } from './hardknott-textures';
import { canvasTexture } from './world-kit';

import type { Course } from './course';

export function hardknottFells(course: Course) {
  let ewe: Mesh | undefined;
  const initial = new Matrix4(),
    pose = new Object3D(),
    spot = course.place(5304);
  let lane = 0;
  const time = uniform(0);
  const wind = uniform(0);
  const turf = new TextureLoader().load('courses/hardknott-fell.webp');
  turf.wrapS = turf.wrapT = RepeatWrapping;
  turf.colorSpace = SRGBColorSpace;
  turf.anisotropy = 4;
  const grass = brackenTexture();
  grass.wrapS = grass.wrapT = RepeatWrapping;
  const fell = new MeshBasicNodeMaterial({ side: DoubleSide });
  const grain = texture(grass, positionWorld.xz.mul(0.068)).g;
  const shadow = sin(positionWorld.x.mul(0.0027).add(positionWorld.z.mul(0.0043)).add(wind))
    .mul(0.065)
    .add(0.98);
  const rough = texture(turf, positionWorld.xz.mul(0.135)).rgb;
  const distanceGrain = texture(turf, positionWorld.xz.mul(0.021)).r;
  fell.colorNode = vertexColor()
    .rgb.mul(rough.mul(1.9).add(0.48))
    .mul(grain.mul(0.27).add(0.97))
    .mul(distanceGrain.mul(0.58).add(0.82))
    .mul(shadow);
  const remote = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  remote.colorNode = vertexColor()
    .rgb.mul(texture(turf, positionWorld.xz.mul(0.006)).r.mul(1.1).add(0.76))
    .mul(shadow);
  const head = new MeshBasicNodeMaterial({ side: DoubleSide });
  head.positionNode = positionLocal.add(
    vec3(
      0,
      sin(time.add(uv().y.mul(6)))
        .mul(0.235)
        .mul(uv().x)
        .div(vec3(modelScale).y),
      0,
    ),
  );
  head.colorNode = vertexColor().rgb;
  const vapour = cloudTexture();
  const mist = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  mist.positionNode = positionLocal.add(vec3(sin(wind).mul(56).div(vec3(modelScale).x), 0, 0));
  mist.colorNode = vec3(0.81, 0.84, 0.84);
  mist.opacityNode = texture(vapour, uv()).a.mul(0.52);
  const triangle = warningTexture(),
    plate = plateTexture();
  const advisory = canvasTexture(256, 82, (ctx) => {
    ctx.fillStyle = '#efeee6';
    ctx.fillRect(0, 0, 256, 82);
    ctx.strokeStyle = '#262825';
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, 250, 76);
    ctx.fillStyle = '#242724';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Unsuitable for', 128, 35);
    ctx.fillText('caravans', 128, 63);
  });
  for (const sign of [triangle, plate, advisory]) sign.flipY = false;
  const signs = [triangle, plate, advisory].map(
    (map) => new MeshBasicMaterial({ map, alphaTest: 0.4, side: DoubleSide }),
  );
  const stone = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  const panoramas = ['eskdale', 'scafell'].map((name) => {
    const map = new TextureLoader().load('courses/hardknott-' + name + '.webp');
    map.flipY = false;
    map.colorSpace = SRGBColorSpace;
    const material = new MeshBasicNodeMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    material.colorNode = mix(texture(map, uv()).rgb, vec3(0.44, 0.49, 0.48), 0.19);
    // Fade the sky and the outer ends into the shared weather.
    const edge = smoothstep(0, 0.12, uv().x).mul(smoothstep(0, 0.12, uv().x.oneMinus()));
    material.opacityNode = edge.mul(smoothstep(0, 0.21, uv().y));
    return { map, material };
  });
  const walking = new MeshBasicNodeMaterial({ side: DoubleSide });
  const stride = sin(time.mul(4).add(uv().y.mul(6.28)))
    .mul(uv().x)
    .mul(0.12);
  walking.positionNode = positionLocal.add(vec3(stride.div(vec3(modelScale).x), 0, 0));
  walking.colorNode = vertexColor().rgb;
  const marks = new Map<string, Vector3>(),
    projected = new Vector3();
  function screenX(kind: string, camera: Camera) {
    const mark = marks.get(kind);
    if (!mark) return Infinity;
    projected.copy(mark).project(camera);
    return Math.abs(projected.z) <= 1 ? projected.x : Infinity;
  }
  return {
    materials: {
      HerdwickCross: walking,
      EskdaleVale: panoramas[0]!.material,
      ScafellPikes: panoramas[1]!.material,
      FellGround: fell,
      FellVerge: fell,
      FellFar: remote,
      ScafellRange: remote,
      HerdwickHead: head,
      FellMist: mist,
      FortGate: stone,
      PassWarning: signs[0]!,
      PassPlate: signs[1]!,
      CaravanPlate: signs[2]!,
    },
    landmark(kind: string, mesh: Mesh) {
      if (kind !== 'FortGate' && kind !== 'PassWarning') return;
      marks.set(kind, new Box3().setFromObject(mesh, true).getCenter(new Vector3()));
    },
    install(map: Object3D, scene: Object3D) {
      const original = map.getObjectByName('HerdwickCross') as Mesh | undefined;
      if (!original?.isMesh) return;
      original.updateWorldMatrix(true, false);
      initial.copy(original.matrixWorld);
      original.visible = false;
      ewe = new Mesh(original.geometry, walking);
      ewe.matrixAutoUpdate = false;
      scene.add(ewe);
    },
    update(seconds: number) {
      const t = seconds * 0.2;
      lane = 2.72 * Math.sin(t);
      if (ewe) {
        course.place(5304 + 0.8 * Math.cos(t), lane, spot);
        pose.position.set(
          spot.x,
          spot.y + 0.018 - 0.15 * Math.max(0, Math.abs(lane) - 2.1),
          spot.z,
        );
        pose.rotation.set(
          0,
          spot.heading + Math.PI / 2 - Math.atan2(2.72 * Math.cos(t), -0.8 * Math.sin(t)),
          0,
        );
        pose.updateMatrix();
        ewe.matrix.multiplyMatrices(pose.matrix, initial);
        ewe.matrixWorldNeedsUpdate = true;
      }
      time.value = seconds * 0.79;
      wind.value = seconds * 0.031;
    },
    report(camera: Camera) {
      return {
        grazing: time.value,
        crossing: lane,
        fellMist: wind.value,
        fortX: screenX('FortGate', camera),
        signX: screenX('PassWarning', camera),
      };
    },
    dispose() {
      marks.clear();
      ewe?.removeFromParent();
      walking.dispose();
      for (const { map, material } of panoramas) {
        map.dispose();
        material.dispose();
      }
      for (const asset of [
        fell,
        remote,
        turf,
        head,
        mist,
        stone,
        grass,
        vapour,
        triangle,
        plate,
        advisory,
        ...signs,
      ])
        asset.dispose();
    },
  };
}
