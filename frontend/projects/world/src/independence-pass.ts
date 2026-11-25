import {
  cos,
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
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';

/** The brown elevation board and the pale Continental Divide strip share a single texture. */
function summitSign(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 630;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#533927';
  g.beginPath();
  g.moveTo(16, 36);
  g.quadraticCurveTo(420, 106, 939, 8);
  g.lineTo(878, 425);
  g.quadraticCurveTo(453, 374, 72, 431);
  g.closePath();
  g.fill();
  g.fillStyle = '#ddd9c3';
  g.beginPath();
  g.moveTo(73, 431);
  g.quadraticCurveTo(480, 381, 878, 426);
  g.lineTo(843, 598);
  g.quadraticCurveTo(445, 538, 98, 600);
  g.closePath();
  g.fill();
  g.textAlign = 'center';
  g.fillStyle = '#f3ecd2';
  g.font = 'bold 67px sans-serif';
  g.fillText('INDEPENDENCE PASS', 480, 234, 825);
  g.font = '52px sans-serif';
  g.fillText('Elevation 12,095 feet', 480, 333, 730);
  g.fillStyle = '#352e28';
  g.font = 'bold 50px sans-serif';
  g.fillText('CONTINENTAL DIVIDE', 473, 513, 705);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.flipY = false;
  return map;
}

export async function independencePass() {
  const loader = new TextureLoader();
  const [atlas, range] = await Promise.all([
    loader.loadAsync('courses/independence-trees.webp'),
    loader.loadAsync('courses/independence-sawatch.webp'),
  ]);
  range.flipY = false;
  range.colorSpace = SRGBColorSpace;
  const skyline = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const backdrop = texture(range, uv());
  skyline.colorNode = mix(backdrop.rgb, vec3(0.46, 0.53, 0.57), 0.19);
  skyline.opacityNode = backdrop.a;
  atlas.flipY = false;
  atlas.colorSpace = SRGBColorSpace;
  atlas.anisotropy = 4;
  const sign = summitSign();
  const face = new MeshBasicMaterial({ map: sign, alphaTest: 0.45, side: DoubleSide });
  const clock = uniform(0);
  const wind = uniform(0);
  const trees = new MeshBasicNodeMaterial({ side: DoubleSide, alphaTest: 0.5 });
  const leaves = texture(atlas, uv());
  trees.colorNode = leaves.rgb;
  trees.opacityNode = leaves.a;
  const crown = uv().y.oneMinus().clamp(0, 1);
  trees.positionNode = positionLocal.add(
    vec3(wind.mul(crown).mul(0.27), 0, wind.mul(crown).mul(0.09)).div(vec3(modelScale)),
  );
  const water = new MeshBasicNodeMaterial({ side: DoubleSide });
  const waves = sin(
    positionWorld.x
      .mul(0.61)
      .sub(clock.mul(1.54))
      .add(cos(positionWorld.z.mul(0.37))),
  );
  water.colorNode = vertexColor()
    .rgb.mul(waves.mul(0.12).add(1))
    .add(
      vec3(0.18, 0.23, 0.22).mul(
        cos(positionWorld.z.mul(0.32).sub(clock.mul(0.62)))
          .mul(waves)
          .max(0)
          .pow(4),
      ),
    );
  const ground = new MeshBasicNodeMaterial({ side: DoubleSide });
  const grain = sin(positionWorld.x.mul(0.72).add(sin(positionWorld.z.mul(0.98)))).mul(
    cos(positionWorld.z.mul(0.65)),
  );
  ground.colorNode = vertexColor().rgb.mul(grain.mul(0.065).add(0.99));
  const stone = new MeshBasicNodeMaterial({ side: DoubleSide });
  const bands = sin(
    positionWorld.y
      .mul(0.23)
      .add(sin(positionWorld.x.mul(0.052)))
      .add(cos(positionWorld.z.mul(0.08))),
  );
  stone.colorNode = vertexColor().rgb.mul(bands.mul(0.077).add(0.99));
  const snow = new MeshBasicNodeMaterial({ side: DoubleSide });
  snow.colorNode = mix(vertexColor().rgb, vec3(0.7, 0.8, 0.87), grain.mul(0.045).add(0.09));
  const lake = new MeshBasicNodeMaterial({ side: DoubleSide });
  lake.colorNode = vertexColor().rgb.mul(waves.mul(0.04).add(1));
  return {
    materials: {
      SawatchSkyline: skyline,
      AspenGrove: trees,
      RoaringFork: water,
      DivideSign: face,
      SawatchGround: ground,
      SawatchRock: stone,
      PassSnow: snow,
      CabinLogs: stone,
      TwinLakes: lake,
    },
    update(seconds: number) {
      clock.value = seconds;
      wind.value = Math.sin(seconds * 1.11);
    },
    report(groups: Record<string, number>) {
      return {
        leafSway: groups['AspenGrove'] ? wind.value : null,
        riverPhase: groups['RoaringFork'] ? clock.value : null,
      };
    },
    dispose() {
      atlas.dispose();
      range.dispose();
      skyline.dispose();
      sign.dispose();
      for (const material of [trees, water, face, ground, stone, snow, lake]) material.dispose();
    },
  };
}
