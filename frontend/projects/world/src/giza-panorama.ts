import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';

/** Saddled dromedaries and a two-wheeled horse cart at Panorama Point. Local +Z faces forward. */
export function gizaPanorama(course: Course) {
  const group = new Group(),
    actors = new Group();
  const shapes = {
    hide: new SphereGeometry(1, 12, 8),
    rail: new CylinderGeometry(1, 1, 1, 8),
    cart: new BoxGeometry(1, 1, 1),
    rim: new TorusGeometry(1, 0.072, 6, 22),
  };
  type Shape = keyof typeof shapes;
  const parts: { node: Object3D; shape: Shape; colour: number }[] = [];
  const up = new Vector3(0, 1, 0),
    delta = new Vector3();
  function node(parent: Object3D, x: number, y: number, z: number) {
    const item = new Object3D();
    item.position.set(x, y, z);
    parent.add(item);
    return item;
  }
  function form(
    parent: Object3D,
    shape: Shape,
    colour: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
  ) {
    const item = node(parent, x, y, z);
    item.scale.set(w, h, l);
    parts.push({ node: item, shape, colour });
    return item;
  }
  function rod(parent: Object3D, colour: number, from: number[], to: number[], r: number) {
    const [x, y, z] = from as [number, number, number],
      [u, v, w] = to as [number, number, number];
    const item = form(parent, 'rail', colour, (x + u) / 2, (y + v) / 2, (z + w) / 2, r, 1, r);
    delta.set(u - x, v - y, w - z);
    item.scale.y = delta.length();
    item.quaternion.setFromUnitVectors(up, delta.normalize());
    return item;
  }
  function rider(parent: Object3D, y: number, cloth: number) {
    const skin = 0xa67952;
    form(parent, 'hide', cloth, 0, y + 0.18, 0, 0.2, 0.32, 0.15);
    form(parent, 'hide', skin, 0, y + 0.61, 0.025, 0.113, 0.145, 0.111);
    form(parent, 'hide', 0xe2dbc5, 0, y + 0.7, 0, 0.124, 0.08, 0.13);
    for (const side of [-1, 1]) {
      rod(parent, 0x504840, [side * 0.17, y - 0.02, 0], [side * 0.31, y - 0.28, 0.18], 0.085);
      rod(parent, 0x504840, [side * 0.31, y - 0.28, 0.18], [side * 0.33, y - 0.54, 0.1], 0.065);
      rod(parent, cloth, [side * 0.17, y + 0.36, 0], [side * 0.24, y + 0.17, 0.14], 0.075);
      rod(parent, skin, [side * 0.24, y + 0.17, 0.14], [side * 0.14, y + 0.2, 0.35], 0.055);
    }
  }
  const camelStations = [128, 1541, 6828, 6842, 6855, 6870, 6883];
  const camels = camelStations.map((distance, i) => {
    const root = node(actors, 0, 0, 0),
      hide = [0xb88650, 0xd0ae79, 0x9c6f48][i % 3]!;
    const seated = i === 3 || i === 5;
    const belly = seated ? 0.59 : 1.5;
    form(root, 'hide', hide, 0, belly, 0, 0.42, 0.55, 1.03);
    form(root, 'hide', hide, 0, belly + 0.43, -0.14, 0.33, 0.52, 0.5);
    const neck = node(root, 0, belly + 0.01, 0.65);
    rod(neck, hide, [0, 0.08, 0], [0, 0.29, 0.53], 0.2);
    rod(neck, hide, [0, 0.26, 0.5], [0, 0.98, 0.67], 0.142);
    form(neck, 'hide', hide, 0, 1.0, 0.79, 0.15, 0.17, 0.27);
    form(neck, 'hide', 0xad835a, 0, 0.94, 1.04, 0.135, 0.095, 0.16);
    for (const side of [-1, 1]) {
      form(neck, 'hide', hide, side * 0.095, 1.15, 0.68, 0.045, 0.086, 0.05);
      form(neck, 'hide', 0x322722, side * 0.138, 1.04, 0.83, 0.024, 0.023, 0.031);
      for (const z of [-0.62, 0.66]) {
        const kneeZ = z + (seated ? 0.35 : 0.065);
        rod(
          root,
          hide,
          [side * 0.24, belly - 0.1, z],
          [side * 0.27, seated ? 0.15 : 0.69, kneeZ],
          0.1,
        );
        rod(
          root,
          hide,
          [side * 0.27, seated ? 0.15 : 0.69, kneeZ],
          [side * 0.29, 0.1, z + (seated ? -0.22 : 0.025)],
          0.06,
        );
        form(root, 'hide', 0x6c523d, side * 0.29, 0.085, z + 0.08, 0.082, 0.072, 0.14);
      }
    }
    const rug = form(
      root,
      'hide',
      i % 2 ? 0x973a2d : 0x315568,
      0,
      belly + 0.22,
      -0.3,
      0.438,
      0.35,
      0.54,
    );
    rug.rotation.x = 0.06;
    for (const z of [-0.58, -0.42, -0.16, 0.02])
      form(root, 'hide', 0xd7a958, 0, belly + 0.23, z, 0.438, 0.32, 0.045);
    if (!seated && i % 2 === 0) rider(root, belly + 0.74, 0x736c58);
    const at = course.place(distance, i % 2 ? 8.2 : -9.4);
    root.position.set(at.x, at.y - 0.25, at.z);
    root.rotation.y = at.heading + 1.65 + i * 0.29;
    return neck;
  });
  const cart = node(actors, 0, 0, 0),
    horse = node(cart, 0, 0, 1.93),
    hide = 0x79472e;
  form(horse, 'hide', hide, 0, 1.25, 0, 0.33, 0.43, 0.82);
  const neck = node(horse, 0, 1.28, 0.44);
  rod(neck, hide, [0, 0, 0], [0, 0.68, 0.3], 0.202);
  form(neck, 'hide', hide, 0, 0.69, 0.47, 0.13, 0.18, 0.28);
  form(neck, 'hide', 0x49332a, 0, 0.57, 0.69, 0.117, 0.1, 0.14);
  form(neck, 'hide', 0x392c26, 0, 0.41, 0.09, 0.12, 0.41, 0.105);
  for (const side of [-1, 1]) form(neck, 'hide', hide, side * 0.08, 0.87, 0.32, 0.04, 0.125, 0.05);
  const legs: Object3D[] = [];
  for (const side of [-1, 1])
    for (const z of [-0.45, 0.48]) {
      const leg = node(horse, side * 0.195, 1.13, z);
      legs.push(leg);
      rod(leg, hide, [0, 0, 0], [0, -0.5, 0.012], 0.088);
      rod(leg, 0x554033, [0, -0.5, 0.012], [0, -1.01, -0.025], 0.05);
      form(leg, 'hide', 0x362e29, 0, -1.02, 0.006, 0.074, 0.093, 0.1);
    }
  form(horse, 'hide', 0x322822, 0, 1.01, -0.82, 0.089, 0.42, 0.12);
  form(cart, 'cart', 0x365d55, 0, 0.68, -0.4, 1.12, 0.15, 1.36);
  form(cart, 'cart', 0x836346, 0, 0.99, -0.81, 1.12, 0.5, 0.1);
  form(cart, 'cart', 0x8a362c, 0, 0.9, -0.22, 0.99, 0.18, 0.53);
  const wheels: Object3D[] = [];
  for (const side of [-1, 1]) {
    rod(cart, 0x64452e, [side * 0.48, 0.57, -0.7], [side * 0.38, 1.02, 1.9], 0.04);
    const wheel = node(cart, side * 0.63, 0.51, -0.43);
    wheels.push(wheel);
    form(wheel, 'rim', 0x3e3730, 0, 0, 0, 0.49, 0.49, 0.49).rotation.y = Math.PI / 2;
    for (let j = 0; j < 8; j++) {
      const a = (j * Math.PI) / 8,
        dy = 0.47 * Math.sin(a),
        dz = 0.47 * Math.cos(a);
      rod(wheel, 0xa28256, [0, -dy, -dz], [0, dy, dz], 0.016);
    }
    rod(cart, 0x775837, [side * 0.54, 0.86, -1.04], [side * 0.54, 0.86, 0.29], 0.045);
    rod(cart, 0x4b382a, [side * 0.17, 1.65, 0.23], [side * 0.12, 1.95, 2.68], 0.014);
  }
  const driver = node(cart, 0, 0, -0.22);
  rider(driver, 1.15, 0x4d616e);
  const material = new MeshLambertMaterial();
  const batches = (Object.keys(shapes) as Shape[]).map((shape) => {
    const items = parts.filter((p) => p.shape === shape);
    const batch = new InstancedMesh(shapes[shape], material, items.length);
    batch.frustumCulled = false;
    const colour = new Color();
    items.forEach((p, i) => batch.setColorAt(i, colour.setHex(p.colour)));
    group.add(batch);
    return { batch, items };
  });
  const pose = course.place(6810, 9);
  const state = { camelHead: 0, cartPosition: 0 };
  function update(time: number) {
    camels.forEach((neck, i) => {
      neck.rotation.x = 0.065 * Math.sin(time * 1.35 + i * 1.84);
      neck.rotation.y = 0.16 * Math.sin(time * 0.63 + i);
    });
    const distance = 6812 + 22 * Math.sin(time * 0.089);
    const forward = Math.cos(time * 0.089);
    const angle = (Math.tanh(forward * 5) + 1) * Math.PI * 0.5;
    course.place(distance, 9, pose);
    cart.position.set(pose.x, pose.y - 0.25, pose.z);
    cart.rotation.y = pose.heading + angle;
    neck.rotation.x = 0.045 * Math.sin(time * 3.8);
    legs.forEach(
      (leg, i) =>
        (leg.rotation.x = 0.18 * Math.sin(time * 4.3 + (i === 0 || i === 3 ? 0 : Math.PI))),
    );
    for (const wheel of wheels) wheel.rotation.x = time * 3.8;
    actors.updateMatrixWorld(true);
    for (const { batch, items } of batches) {
      items.forEach((p, i) => batch.setMatrixAt(i, p.node.matrixWorld));
      batch.instanceMatrix.needsUpdate = true;
    }
    state.camelHead = camels[2]!.rotation.x;
    state.cartPosition = cart.position.x;
  }
  update(0);
  return {
    group,
    state,
    update,
    dispose() {
      group.removeFromParent();
      for (const { batch } of batches) batch.dispose();
      for (const geometry of Object.values(shapes)) geometry.dispose();
      material.dispose();
      actors.clear();
      group.clear();
    },
  };
}
