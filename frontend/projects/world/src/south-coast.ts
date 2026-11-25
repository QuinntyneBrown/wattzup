import {
  cameraPosition,
  cos,
  mix,
  modelScale,
  positionLocal,
  positionWorld,
  sin,
  texture,
  uniform,
  vec2,
  vec3,
  vertexColor,
  uv,
} from 'three/tsl';
import {
  DoubleSide,
  SRGBColorSpace,
  MeshBasicNodeMaterial,
  RepeatWrapping,
  TextureLoader,
} from 'three/webgpu';

export function southCoast() {
  const grit = new TextureLoader().load('courses/iceland-basalt-grain.webp');
  grit.wrapS = grit.wrapT = RepeatWrapping;
  grit.anisotropy = 4;
  const clock = uniform(0);
  const graze = uniform(0);
  const drift = uniform(0);
  const material = () => new MeshBasicNodeMaterial({ side: DoubleSide });
  const horizon = new TextureLoader().load('courses/iceland-vatnajokull.webp');
  horizon.flipY = false;
  horizon.colorSpace = SRGBColorSpace;
  const cap = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const plate = texture(horizon, uv());
  cap.colorNode = mix(plate.rgb, vec3(0.43, 0.5, 0.53), 0.12);
  const edges = uv().x.smoothstep(0, 0.16).mul(uv().x.oneMinus().smoothstep(0, 0.16));
  const distance = positionWorld.sub(cameraPosition).length();
  cap.opacityNode = plate.a.mul(edges).mul(distance.smoothstep(4600, 7600).oneMinus());
  const land = material();
  const basalt = material();
  const glacier = material();
  const falls = material();
  const water = material();
  const ice = material();
  const stock = material();
  const planar = positionWorld.xz.add(vec2(positionWorld.y.mul(0.38), positionWorld.y.mul(0.52)));
  const ground = texture(grit, planar.mul(0.21));
  const distant = texture(grit, planar.mul(0.018));
  land.colorNode = vertexColor()
    .rgb.mul(ground.r.mul(0.64).add(0.72))
    .mul(distant.g.mul(0.46).add(0.79));
  basalt.colorNode = vertexColor()
    .rgb.mul(ground.b.mul(0.66).add(0.72))
    .mul(distant.g.mul(0.5).add(0.73));
  glacier.colorNode = vertexColor().rgb.mul(ground.g.mul(0.15).add(0.92));
  const streaming = texture(
    grit,
    vec2(
      positionWorld.z.mul(0.13).add(positionWorld.x.mul(0.085)),
      positionWorld.y.mul(0.051).add(clock.mul(0.38)),
    ),
  );
  falls.colorNode = mix(vec3(0.32, 0.53, 0.57), vertexColor().rgb, streaming.g.mul(0.73).add(0.27));
  const ripples = sin(
    positionWorld.x
      .mul(0.29)
      .add(clock.mul(0.69))
      .add(sin(positionWorld.z.mul(0.23))),
  );
  water.colorNode = vertexColor()
    .rgb.mul(ripples.mul(0.1).add(1))
    .add(
      vec3(0.15, 0.17, 0.16).mul(
        cos(positionWorld.z.mul(0.32).sub(clock.mul(0.47)))
          .mul(ripples)
          .max(0)
          .pow(7),
      ),
    );
  ice.positionNode = positionLocal.add(
    vec3(drift.mul(0.63), sin(clock.mul(0.53)).mul(0.11), drift.mul(0.21)).div(vec3(modelScale)),
  );
  ice.colorNode = vertexColor().rgb.mul(ground.g.mul(0.18).add(0.93));
  stock.positionNode = positionLocal.add(
    vec3(graze.mul(0.11), graze.mul(0.16), graze.mul(0.035)).div(vec3(modelScale)),
  );
  stock.colorNode = vertexColor().rgb;
  return {
    materials: {
      IceCap: cap,
      IcelandLand: land,
      Basalt: basalt,
      Glacier: glacier,
      Falls: falls,
      GlacialWater: water,
      Icebergs: ice,
      Grazers: stock,
    },
    update(seconds: number) {
      clock.value = seconds;
      graze.value = Math.cos(seconds * 0.88);
      drift.value = Math.sin(seconds * 0.22);
    },
    report(groups: Record<string, number>) {
      return {
        fallsPhase: groups['Falls'] ? clock.value : null,
        grazingAngle: groups['Grazers'] ? graze.value : null,
        iceShift: groups['Icebergs'] ? drift.value : null,
      };
    },
    dispose() {
      horizon.dispose();
      cap.dispose();
      grit.dispose();
      for (const item of [land, basalt, glacier, falls, water, ice, stock]) item.dispose();
    },
  };
}
