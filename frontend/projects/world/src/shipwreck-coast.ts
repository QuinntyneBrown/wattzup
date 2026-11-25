import {
  cameraPosition,
  distance,
  mix,
  normalWorld,
  modelScale,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  uv,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  Box3,
  type Camera,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MirroredRepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three/webgpu';
import { canvasTexture } from './world-kit';

export function shipwreckCoast() {
  const time = uniform(0),
    sunlight = uniform(0.9);
  const limestone = new TextureLoader().load('courses/greatocean-limestone.webp');
  limestone.colorSpace = SRGBColorSpace;
  limestone.wrapS = limestone.wrapT = MirroredRepeatWrapping;
  limestone.anisotropy = 4;
  const cliff = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  const facing = normalWorld
    .dot(vec3(-0.64, 0.53, -0.54))
    .mul(0.27)
    .add(0.88);
  cliff.colorNode = mix(
    texture(limestone).rgb.mul(vertexColor().rgb.mul(0.65).add(0.58)).mul(facing).mul(sunlight),
    vec3(0.42, 0.51, 0.53),
    smoothstep(400, 2300, distance(cameraPosition, positionWorld)).mul(0.72),
  );
  const heath = new MeshBasicNodeMaterial({ side: DoubleSide });
  const grassGrain = texture(limestone).r.mul(0.37).add(0.8);
  heath.colorNode = vertexColor().rgb.mul(grassGrain).mul(sunlight);
  const ocean = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  const along = uv().x,
    off = uv().y.oneMinus();
  const phase = off
    .mul(0.125)
    .add(sin(along.mul(0.013)).mul(2.1))
    .add(time);
  const crest = sin(phase);
  const chop = sin(along.mul(0.075).add(off.mul(0.13)).sub(time.mul(0.76)));
  const shallow = smoothstep(8, 150, off).oneMinus();
  const breaking = smoothstep(0.62, 0.92, crest.add(chop.mul(0.16))).mul(shallow);
  // The GLB packs positions relative to each chunk. Keep swell height in world metres.
  const metresPerUnit = vec3(modelScale).y;
  ocean.positionNode = positionLocal.add(
    vec3(0, crest.mul(0.64).add(chop.mul(0.14)).div(metresPerUnit), 0),
  );
  const sea = mix(vec3(0.025, 0.115, 0.173), vec3(0.072, 0.32, 0.34), shallow)
    .mul(crest.mul(0.14).add(1))
    .mul(sunlight);
  ocean.colorNode = mix(
    mix(sea, vec3(0.73, 0.82, 0.78), breaking),
    vec3(0.4, 0.54, 0.59),
    smoothstep(350, 3600, off).mul(0.74),
  );
  const wash = new MeshBasicNodeMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  const pulse = sin(time.add(positionWorld.x.mul(0.19)).add(positionWorld.z.mul(0.21)));
  wash.colorNode = vec3(0.73, 0.82, 0.8);
  wash.opacityNode = smoothstep(-0.6, 0.95, pulse).mul(0.6).add(0.12);
  const spindrift = canvasTexture(160, 128, (ctx) => {
    for (let i = 0; i < 160; i++) {
      const x = 80 + 62 * Math.sin(i * 32.6) * Math.sin(i * 2.86),
        y = 118 - (99 * ((i * 71) % 161)) / 161,
        r = 3 + (i % 9);
      const fade = ctx.createRadialGradient(x, y, 0, x, y, r);
      fade.addColorStop(0, 'rgba(243,248,240,.65)');
      fade.addColorStop(1, 'rgba(227,238,231,0)');
      ctx.fillStyle = fade;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  });
  spindrift.flipY = false;
  const spray = new MeshBasicNodeMaterial({
    map: spindrift,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  spray.opacityNode = texture(spindrift)
    .a.mul(smoothstep(-0.4, 0.94, pulse))
    .mul(0.72);
  const canopy = new TextureLoader().load('courses/greatocean-botany.webp');
  canopy.flipY = false;
  canopy.colorSpace = SRGBColorSpace;
  const plants = new MeshBasicMaterial({
    map: canopy,
    side: DoubleSide,
    alphaTest: 0.66,
    color: 0xbfc7ae,
  });
  const lettering = canvasTexture(1536, 192, (g) => {
    for (let i = 0; i < 4; i++) {
      const x = i * 384;
      if (i === 0) {
        g.fillStyle = '#60452f';
        g.fillRect(x, 0, 384, 192);
        g.fillStyle = '#e8dbb9';
        g.font = 'bold 39px sans-serif';
        g.textAlign = 'center';
        g.fillText('GREAT OCEAN ROAD', x + 192, 91, 359);
        g.font = 'bold 25px sans-serif';
        g.fillText('MEMORIAL ARCH', x + 192, 140);
      } else if (i === 1) {
        g.fillStyle = '#ebb12f';
        g.fillRect(x, 0, 384, 192);
        g.fillStyle = '#282b28';
        g.beginPath();
        g.moveTo(x + 88, 16);
        g.lineTo(x + 177, 16);
        g.lineTo(x + 277, 96);
        g.lineTo(x + 177, 176);
        g.lineTo(x + 88, 176);
        g.lineTo(x + 180, 96);
        g.closePath();
        g.fill();
      } else {
        g.fillStyle = i === 2 ? '#f2f1df' : '#3a5947';
        g.fillRect(x, 0, 384, 192);
        g.strokeStyle = i === 2 ? '#383c39' : '#ede9d1';
        g.lineWidth = 6;
        g.strokeRect(x + 5, 5, 374, 182);
        g.fillStyle = g.strokeStyle;
        g.textAlign = 'center';
        g.font = 'bold 47px sans-serif';
        g.fillText(i === 2 ? 'DRIVE ON' : 'SCENIC', x + 192, 82);
        g.fillText(i === 2 ? 'LEFT' : 'LOOKOUT', x + 192, 144);
      }
    }
  });
  lettering.flipY = false;
  const signs = new MeshBasicMaterial({ map: lettering, side: DoubleSide }),
    timber = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  const marks = new Map<string, Vector3>(),
    projected = new Vector3();
  function landmark(kind: string, mesh: Mesh) {
    if (['PortLimestone', 'Apostle', 'LondonArch'].includes(kind))
      mesh.geometry.computeVertexNormals();
    if (!['Apostle', 'LondonArch', 'MemorialArch'].includes(kind)) return;
    const box = new Box3().setFromObject(mesh, true),
      target = box.getCenter(new Vector3());
    target.y = box.max.y - (kind === 'MemorialArch' ? 0.6 : 4);
    const prev = marks.get(kind);
    if (!prev || target.y > prev.y) marks.set(kind, target);
  }
  function screenX(kind: string, camera: Camera) {
    const target = marks.get(kind);
    if (!target) return Infinity;
    projected.copy(target).project(camera);
    return Math.abs(projected.z) <= 1 ? projected.x : Infinity;
  }
  return {
    landmark,
    materials: {
      Clifftop: heath,
      SaltSpray: spray,
      RockWash: wash,
      OtwayPlants: plants,
      PortLimestone: cliff,
      Apostle: cliff,
      LondonArch: cliff,
      CoastSigns: signs,
      MemorialArch: timber,
      SouthernOcean: ocean,
    },
    update(seconds: number) {
      time.value = (seconds % 2400) * 0.85;
      sunlight.value = 0.88 + 0.12 * Math.sin(seconds * 0.09);
    },
    report(camera: Camera) {
      return {
        waveCrest: time.value,
        coastalLight: sunlight.value,
        archX: screenX('MemorialArch', camera),
        apostleX: screenX('Apostle', camera),
        bridgeX: screenX('LondonArch', camera),
      };
    },
    dispose() {
      wash.dispose();
      spray.dispose();
      spindrift.dispose();
      heath.dispose();
      canopy.dispose();
      plants.dispose();
      limestone.dispose();
      cliff.dispose();
      ocean.dispose();
      lettering.dispose();
      signs.dispose();
      timber.dispose();
      marks.clear();
    },
  };
}
