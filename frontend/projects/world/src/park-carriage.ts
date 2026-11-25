import {
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three/webgpu';

/** The original Park Drive hansom and driver, with separately articulated legs and spoked wheels. */
export function parkCarriage(horseCoat: Material, paint: Material, owned: { dispose(): void }[]) {
  const g = new Group();
  const unit = new BoxGeometry(1, 1, 1);
  const wheel = new TorusGeometry(0.62, 0.05, 6, 20);
  const hub = new CylinderGeometry(0.08, 0.08, 0.12, 8);
  owned.push(unit, wheel, hub);
  const material = (options: ConstructorParameters<typeof MeshStandardMaterial>[0]) => {
    const result = new MeshStandardMaterial(options);
    owned.push(result);
    return result;
  };
  const wheels: Group[] = [];
  const black = material({ color: 0x111111, roughness: 0.6 });
  const add = (geometry: BufferGeometry, m: Material, x: number, y: number, z: number) => {
    const mesh = new Mesh(geometry, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  // The horse, facing -z, ahead of the carriage.
  const barrel = new CapsuleGeometry(0.36, 1.1, 4, 10);
  barrel.rotateX(Math.PI / 2);
  const neck = new CapsuleGeometry(0.17, 0.6, 4, 8);
  neck.rotateX(-0.75);
  const head = new CapsuleGeometry(0.12, 0.38, 4, 8);
  head.rotateX(Math.PI / 2 - 0.4);
  const legGeometry = new CylinderGeometry(0.06, 0.05, 0.95, 6);
  legGeometry.translate(0, -0.47, 0);
  owned.push(barrel, neck, head, legGeometry);
  add(barrel, horseCoat, 0, 1.3, -3.2);
  add(neck, horseCoat, 0, 1.75, -3.85);
  add(head, horseCoat, 0, 2.05, -4.25);
  const legs = [
    [-0.2, -3.75],
    [0.2, -3.75],
    [-0.2, -2.65],
    [0.2, -2.65],
  ].map(([x, z]) => add(legGeometry, horseCoat, x!, 1.0, z!));
  // Shafts from the carriage to the harness.
  for (const x of [-0.45, 0.45]) {
    const shaft = add(unit, black, x, 1.05, -2.4);
    shaft.scale.set(0.05, 0.05, 2.2);
  }
  // The carriage: a body, its seat, a folded hood and four wheels.
  const box = add(unit, paint, 0, 1.15, -0.4);
  box.scale.set(1.4, 0.7, 2.2);
  const seat = add(unit, paint, 0, 1.6, -1.25);
  seat.scale.set(1.3, 0.5, 0.6);
  const hood = new SphereGeometry(0.75, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  hood.scale(1, 0.8, 0.8);
  owned.push(hood);
  add(hood, black, 0, 1.5, 0.35);
  for (const [x, z, s] of [
    [-0.78, -1.2, 0.8],
    [0.78, -1.2, 0.8],
    [-0.78, 0.4, 1],
    [0.78, 0.4, 1],
  ] as const) {
    const axle = new Group();
    axle.position.set(x, 0.62 * s, z);
    g.add(axle);
    wheels.push(axle);
    const w = add(wheel, black, x, 0.62 * s, z);
    w.rotation.y = Math.PI / 2;
    w.scale.setScalar(s);
    for (let j = 0; j < 6; j++) {
      const spoke = new Mesh(unit, paint);
      spoke.scale.set(0.025, 0.026, 1.16 * s);
      spoke.rotation.x = (j * Math.PI) / 6;
      axle.add(spoke);
    }
    const h = add(hub, black, x, 0.62 * s, z);
    h.rotation.z = Math.PI / 2;
  }
  // The driver in a top hat.
  const coat = material({ color: 0x1d1f24, roughness: 0.8 });
  const driver = new CapsuleGeometry(0.2, 0.35, 4, 8);
  const face = new SphereGeometry(0.11, 10, 8);
  const hat = new CylinderGeometry(0.11, 0.11, 0.22, 10);
  owned.push(driver, face, hat);
  add(driver, coat, 0, 2.15, -1.3);
  add(face, material({ color: 0xc48a5f, roughness: 0.7 }), 0, 2.58, -1.3);
  add(hat, black, 0, 2.78, -1.3);
  return { group: g, legs, wheels };
}
