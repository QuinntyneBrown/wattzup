import {
  distance,
  cameraPosition,
  modelScale,
  mix,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
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
  type Mesh,
  Vector3,
  DoubleSide,
  FrontSide,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';

export function haleakalaSummit() {
  const loader = new TextureLoader();
  const scoria = loader.load('courses/haleakala-scoria.webp');
  scoria.colorSpace = SRGBColorSpace;
  scoria.wrapS = scoria.wrapT = MirroredRepeatWrapping;
  scoria.anisotropy = 4;
  const flank = new MeshBasicNodeMaterial({ side: DoubleSide });
  const grain = texture(scoria, positionWorld.xz.mul(0.16)).r;
  const broad = texture(scoria, positionWorld.xz.mul(0.027)).g;
  flank.colorNode = vertexColor().rgb.mul(grain.mul(0.98).add(broad.mul(0.62)).add(0.74));
  const caldera = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  caldera.colorNode = vertexColor().rgb.mul(
    texture(scoria, positionWorld.xz.mul(0.011)).r.mul(1.2).add(0.82),
  );
  const bank = loader.load('courses/haleakala-trade-cloud.webp');
  bank.colorSpace = SRGBColorSpace;
  bank.wrapS = bank.wrapT = MirroredRepeatWrapping;
  const wind = uniform(0);
  const cloud = new MeshBasicNodeMaterial({ side: FrontSide, fog: false });
  const cover = texture(bank, positionWorld.xz.mul(0.0019).add(vec2(wind, wind.mul(0.28)))).rgb.mul(
    vertexColor().rgb.mul(0.25).add(0.85),
  );
  cloud.colorNode = mix(
    cover,
    vec3(0.53, 0.66, 0.8),
    smoothstep(2200, 11000, distance(positionWorld, cameraPosition)).mul(0.66),
  );
  const grazing = uniform(0);
  const horse = new MeshBasicNodeMaterial({ side: DoubleSide });
  const bend = sin(grazing.add(uv().y)).mul(0.17).mul(uv().x);
  horse.positionNode = positionLocal.add(vec3(0, bend.div(vec3(modelScale).y), 0));
  horse.colorNode = vertexColor().rgb;
  const trees = loader.load('courses/haleakala-kula-trees.webp');
  trees.colorSpace = SRGBColorSpace;
  trees.flipY = false;
  const crowns = new MeshBasicMaterial({ map: trees, side: DoubleSide, alphaTest: 0.58 });
  const landmarkMaterial = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  const marks = new Map<string, Vector3>();
  const projected = new Vector3();
  function screenX(kind: string, camera: Camera) {
    const target = marks.get(kind);
    if (!target) return Infinity;
    projected.copy(target).project(camera);
    return Math.abs(projected.z) <= 1 ? projected.x : Infinity;
  }
  return {
    landmark(kind: string, mesh: Mesh) {
      if (kind !== 'HkSolarDrum' && kind !== 'HkGardenPlant') return;
      const bounds = new Box3().setFromObject(mesh, true);
      const target = bounds.getCenter(new Vector3());
      if (kind === 'HkSolarDrum') target.y = bounds.max.y - 6;
      marks.set(kind, target);
    },
    materials: {
      HkSolarDrum: landmarkMaterial,
      HkGardenPlant: landmarkMaterial,
      HkFlank: flank,
      HkCraterFloor: caldera,
      HkWindCloud: cloud,
      HkRanchHead: horse,
      HkCrowns: crowns,
    },
    update(seconds: number) {
      wind.value = seconds * 0.00072;
      grazing.value = seconds * 0.89;
    },
    report(camera: Camera) {
      return {
        towerX: screenX('HkSolarDrum', camera),
        rosetteX: screenX('HkGardenPlant', camera),
        tradeWind: wind.value,
        grazing: grazing.value,
      };
    },
    dispose() {
      marks.clear();
      landmarkMaterial.dispose();
      for (const item of [scoria, flank, caldera, bank, cloud, horse, crowns, trees])
        item.dispose();
    },
  };
}
