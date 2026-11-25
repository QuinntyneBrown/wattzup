import {
  cameraPosition,
  distance,
  mix,
  positionWorld,
  sin,
  smoothstep,
  texture,
  uniform,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three/webgpu';
import type { Course } from './course';
import { canvasTexture, seeded } from './world-kit';

/** Desert View Drive's moving shuttle and the cloud shadows that cross the canyon's terraces. */
export function desertViewDrive(course: Course) {
  const group = new Group(),
    owned: { dispose(): void }[] = [];
  const grain = new TextureLoader().load('courses/grandcanyon-strata.webp');
  grain.colorSpace = SRGBColorSpace;
  grain.wrapS = grain.wrapT = RepeatWrapping;
  grain.anisotropy = 4;
  const shadowOffset = uniform(0),
    cliff = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  const light = sin(positionWorld.x.mul(0.0028).add(positionWorld.z.mul(0.004)).add(shadowOffset))
    .mul(0.18)
    .add(0.88);
  const relief = texture(grain).rgb.mul(0.62).add(0.56).mul(vertexColor().rgb).mul(light).mul(1.34);
  cliff.colorNode = mix(
    relief,
    vec3(0.56, 0.39, 0.39),
    smoothstep(520, 3650, distance(cameraPosition, positionWorld)).mul(0.59),
  );
  owned.push(grain, cliff);
  const body = new Group(),
    box = new BoxGeometry(1, 1, 1),
    tyre = new CylinderGeometry(0.49, 0.49, 0.23, 14);
  owned.push(box, tyre);
  function paint(hex: number) {
    const m = new MeshLambertMaterial({ color: hex });
    owned.push(m);
    return m;
  }
  const cream = paint(0xd7d7bd),
    blue = paint(0x467482),
    glass = paint(0x314952),
    black = paint(0x313338),
    hub = paint(0xa8a99f),
    lamp = paint(0xe6ca83);
  function panel(
    mat: MeshLambertMaterial,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const part = new Mesh(box, mat);
    part.scale.set(w, h, d);
    part.position.set(x, y, z);
    body.add(part);
  }
  panel(cream, 0, 1.53, 0, 2.44, 2.17, 9.4);
  panel(blue, 0, 0.96, 0, 2.5, 0.41, 9.44);
  panel(cream, 0, 2.74, 0.23, 2.1, 0.21, 6.15);
  panel(glass, 0, 1.98, -4.72, 2.16, 1.02, 0.06);
  panel(glass, 0, 1.98, 4.72, 1.87, 0.8, 0.06);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++)
      panel(glass, side * 1.234, 1.98, -3.84 + i * 0.91, 0.042, 0.88, 0.79);
    for (const z of [-2.83, 2.72]) {
      const wheel = new Mesh(tyre, black);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.19, 0.51, z);
      body.add(wheel);
      const cap = new Mesh(tyre, hub);
      cap.rotation.z = Math.PI / 2;
      cap.scale.set(0.54, 0.11, 0.54);
      cap.position.set(side * 1.32, 0.51, z);
      body.add(cap);
    }
    panel(lamp, side * 0.89, 0.89, -4.74, 0.31, 0.16, 0.08);
  }
  const label = canvasTexture(512, 96, (g) => {
    g.fillStyle = '#243737';
    g.fillRect(0, 0, 512, 96);
    g.font = 'bold 51px sans-serif';
    g.fillStyle = '#ffe4a5';
    g.textAlign = 'center';
    g.fillText('DESERT VIEW', 256, 66);
  });
  const signMaterial = new MeshBasicMaterial({ map: label }),
    signGeometry = new PlaneGeometry(1.74, 0.34);
  const sign = new Mesh(signGeometry, signMaterial);
  sign.rotation.y = Math.PI;
  sign.position.set(0, 2.47, -4.77);
  body.add(sign);
  owned.push(label, signMaterial, signGeometry);
  group.add(body);
  const cloudTexture = canvasTexture(512, 180, (g) => {
    const rng = seeded(2130);
    g.clearRect(0, 0, 512, 180);
    for (let i = 0; i < 130; i++) {
      const x = 58 + rng() * 394,
        y = 80 + rng() * 43,
        r = 13 + rng() * 42;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(252,223,186,.34)');
      grad.addColorStop(0.46, 'rgba(232,211,196,.23)');
      grad.addColorStop(1, 'rgba(181,168,177,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  const vapour = new MeshBasicMaterial({
    map: cloudTexture,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const cloudGeometry = new PlaneGeometry(870, 173);
  owned.push(cloudTexture, vapour, cloudGeometry);
  const banks = Array.from({ length: 10 }, (_, i) => {
    const anchor = course.place(650 + i * 1340, -660 - (i % 3) * 130);
    const mesh = new Mesh(cloudGeometry, vapour);
    mesh.rotation.y = anchor.heading + 0.34;
    group.add(mesh);
    return { mesh, anchor, phase: i * 1.88 };
  });
  const position = course.place(0);
  const state = { shuttleMetres: 0, cloudShadow: 0 };
  function update(seconds: number, metres: number, reduced: boolean) {
    const t = reduced ? 0 : seconds;
    shadowOffset.value = t * 0.043;
    state.cloudShadow = shadowOffset.value;
    const angle = t * 0.037;
    const station = 10199 + 37 * Math.sin(angle);
    course.place(station, 5.95, position);
    body.position.set(position.x, position.y, position.z);
    body.rotation.y = position.heading + (Math.cos(angle) < 0 ? Math.PI : 0);
    body.visible = Math.abs(station - metres) < 320;
    state.shuttleMetres = body.position.x;
    for (const { mesh, anchor, phase } of banks) {
      mesh.position.set(
        anchor.x + 19 * Math.sin(t * 0.02 + phase),
        anchor.y + 97 + 15 * Math.sin(phase),
        anchor.z,
      );
    }
  }
  update(0, 0, false);
  return {
    group,
    state,
    update,
    cliff,
    dispose() {
      group.removeFromParent();
      for (const item of owned) item.dispose();
      group.clear();
    },
  };
}
