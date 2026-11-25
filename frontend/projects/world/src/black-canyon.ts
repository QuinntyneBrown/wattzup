import {
  cos,
  mix,
  positionWorld,
  positionLocal,
  sin,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  BackSide,
  Box3,
  type Camera,
  DoubleSide,
  Matrix4,
  type Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';
import { clockTexture, damFaceTexture, terrazzoTexture } from './hoover-textures';

export function blackCanyon(course: Course) {
  const rock = new TextureLoader().load('courses/hoover-volcanic-rock.webp');
  rock.wrapS = rock.wrapT = RepeatWrapping;
  rock.colorSpace = SRGBColorSpace;
  rock.anisotropy = 4;
  const cliff = new MeshBasicNodeMaterial({ side: DoubleSide });
  // Sloping and vertical road cuts keep their four-metre grain.
  const grain = texture(
    rock,
    positionWorld.xz.mul(0.15).add(vec2(positionWorld.y.mul(0.095), positionWorld.y.mul(0.2))),
  ).rgb;
  const strata = texture(rock, positionWorld.xz.mul(0.009)).r;
  // Local colour variation survives the texture minification on a tablet.
  const stoneColour = grain.mul(vertexColor().rgb.mul(2.2).add(0.8)).mul(strata.mul(1.1).add(0.81));
  cliff.colorNode = mix(
    stoneColour.add(vertexColor().rgb.mul(0.17)),
    vertexColor().rgb,
    vertexColor().g.sub(0.34).mul(3.5).clamp(0, 1),
  );
  const landscape = new TextureLoader().load('courses/hoover-boulder-basin.webp');
  landscape.flipY = false;
  landscape.colorSpace = SRGBColorSpace;
  const distant = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const skyline = texture(landscape, uv());
  distant.colorNode = mix(skyline.rgb, vec3(0.48, 0.53, 0.57), 0.26);
  distant.opacityNode = skyline.a;
  const clearSky = new MeshBasicNodeMaterial({ side: BackSide, depthWrite: false, fog: false });
  const height = positionLocal.normalize().y.max(0).pow(0.52);
  clearSky.colorNode = mix(vec3(0.62, 0.74, 0.82), vec3(0.063, 0.29, 0.6), height);
  const clock = uniform(0);
  const water = new MeshBasicNodeMaterial({ side: DoubleSide });
  const waves = sin(
    positionWorld.x
      .mul(0.32)
      .add(clock.mul(0.49))
      .add(sin(positionWorld.z.mul(0.14))),
  );
  const reflection = cos(positionWorld.z.mul(0.37).sub(clock.mul(0.68)))
    .mul(waves)
    .max(0)
    .pow(7);
  water.colorNode = vertexColor()
    .rgb.mul(waves.mul(0.09).add(1))
    .add(vec3(0.09, 0.14, 0.14).mul(reflection));
  const heat = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  heat.colorNode = vec3(0.52, 0.61, 0.66);
  heat.opacityNode = sin(
    positionWorld.x
      .mul(0.54)
      .add(clock.mul(1.3))
      .add(sin(positionWorld.z.mul(0.37))),
  )
    .mul(0.5)
    .add(0.5)
    .pow(3)
    .mul(0.23);
  const stone = damFaceTexture();
  stone.wrapS = stone.wrapT = RepeatWrapping;
  const face = new MeshBasicMaterial({ map: stone, side: DoubleSide });
  const dial = clockTexture();
  const stars = terrazzoTexture();
  const clockFace = new MeshBasicMaterial({ map: dial, side: DoubleSide });
  const plaza = new MeshBasicMaterial({ map: stars, side: DoubleSide });
  const painted = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  let visitor: Mesh | undefined;
  const origin = new Matrix4();
  const pose = new Object3D();
  const road = course.place(4908);
  const marks = new Map<string, Vector3>();
  const projected = new Vector3();
  function screenX(name: string, camera: Camera) {
    const point = marks.get(name);
    if (!point) return Infinity;
    projected.copy(point).project(camera);
    return Math.abs(projected.z) <= 1 && Math.abs(projected.y) <= 1 ? projected.x : Infinity;
  }
  return {
    sky: {
      material: clearSky,
      at() {
        /* cloudless desert sky */
      },
    },
    materials: {
      BlackCanyon: cliff,
      CanyonCrags: cliff,
      MeadWater: water,
      BypassArch: painted,
      IntakeCrown: painted,
      DamClocks: clockFace,
      Terrazzo: plaza,
      DamFace: face,
      BoulderBasin: distant,
      CrestVisitor: painted,
      RoadShimmer: heat,
    },
    lookAcross(metres: number) {
      const view = (centre: number, width: number) => Math.exp(-(((metres - centre) / width) ** 2));
      return (
        -2.1 * view(4340, 145) +
        5.0 * view(4910, 100) -
        4.2 * view(5090, 62) +
        2.7 * view(10630, 167)
      );
    },
    landmark(name: string, mesh: Mesh) {
      if (name !== 'BypassArch' && name !== 'IntakeCrown') return;
      const box = new Box3().setFromObject(mesh, true);
      const point = box.getCenter(new Vector3());
      point.y = box.max.y - (name === 'BypassArch' ? 10 : 1);
      marks.set(name, point);
    },
    install(map: Object3D) {
      const mesh = map.getObjectByName('CrestVisitor') as Mesh | undefined;
      if (!mesh?.isMesh) return;
      visitor = mesh;
      visitor.updateWorldMatrix(true, false);
      origin.copy(visitor.matrixWorld);
    },
    update(seconds: number) {
      clock.value = seconds;
      if (!visitor) return;
      const phase = seconds * 0.042;
      course.place(4930 + Math.sin(phase) * 19, 5.8, road);
      pose.position.set(road.x, road.y + 0.21 + 0.025 * Math.sin(seconds * 6.2), road.z);
      pose.rotation.y = road.heading + Math.PI / 2 + (Math.cos(phase) < 0 ? Math.PI : 0);
      pose.updateMatrix();
      visitor.matrix.multiplyMatrices(pose.matrix, origin);
      visitor.matrixWorldNeedsUpdate = true;
    },
    report(camera: Camera) {
      return {
        visitorMetres: visitor?.matrix.elements[12],
        heatPhase: clock.value,
        archX: screenX('BypassArch', camera),
        intakeX: screenX('IntakeCrown', camera),
      };
    },
    dispose() {
      marks.clear();
      for (const item of [
        rock,
        cliff,
        landscape,
        distant,
        water,
        heat,
        stone,
        face,
        dial,
        stars,
        clockFace,
        plaza,
        painted,
      ])
        item.dispose();
    },
  };
}
