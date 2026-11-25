import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three/webgpu';
import type { Course } from './course';
import { blossomShore } from './cherryblossom-shore';

/** The eight rental boats and fifteen tethered kites use the ride clock and fixed instance buffers. */
export async function blossomFestival(course: Course) {
  const shore = await blossomShore(course);
  const root = new Group();
  root.add(shore.root);
  const oval = new SphereGeometry(1, 12, 7);
  const strip = new BoxGeometry(1, 1, 1);
  const cloth = new BufferGeometry();
  cloth.setAttribute(
    'position',
    new Float32BufferAttribute(
      [0, 1.1, 0, -0.82, 0, 0, 0, -1.7, 0, 0, 1.1, 0, 0, -1.7, 0, 0.82, 0, 0],
      3,
    ),
  );
  const sailColours = [0xffe39b, 0xffe39b, 0xd9a36e, 0xffffff, 0xffe2da, 0xffffff];
  cloth.setAttribute(
    'color',
    new Float32BufferAttribute(
      sailColours.flatMap((t) => new Color(t).toArray()),
      3,
    ),
  );
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const silk = new MeshBasicMaterial({ side: DoubleSide, vertexColors: true });
  const hulls = new InstancedMesh(oval, material, 8 * 9);
  const lines = new InstancedMesh(strip, material, 15 * 6);
  const sails = new InstancedMesh(cloth, silk, 15);
  for (const mesh of [hulls, lines, sails]) {
    mesh.frustumCulled = false;
    root.add(mesh);
  }
  const boats = Array.from({ length: 8 }, (_, i) => course.place(1437 + i * 14, -14 - (i % 3) * 4));
  const fields = Array.from({ length: 15 }, (_, i) =>
    course.place(2092 + i * 11, 14 + (i % 3) * 7),
  );
  const part = new Object3D(),
    tip = new Vector3(),
    unit = new Vector3(0, 1, 0);
  const at = new Vector3(),
    delta = new Vector3(),
    paint = new Color();
  let boatX = 0,
    kiteAngle = 0;
  function piece(
    mesh: InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    yaw: number,
    tint: number,
  ) {
    part.position.set(x, y, z);
    part.rotation.set(0, yaw, 0);
    part.scale.set(sx, sy, sz);
    part.updateMatrix();
    mesh.setMatrixAt(i, part.matrix);
    mesh.setColorAt(i, paint.setHex(tint));
  }
  function thread(i: number, width: number, tint: number) {
    delta.subVectors(tip, at);
    part.position.copy(at).addScaledVector(delta, 0.5);
    part.scale.set(width, delta.length(), width);
    part.quaternion.setFromUnitVectors(unit, delta.normalize());
    part.updateMatrix();
    lines.setMatrixAt(i, part.matrix);
    lines.setColorAt(i, paint.setHex(tint));
  }
  function update(seconds: number) {
    for (const [i, boat] of boats.entries()) {
      const t = seconds * 0.09 + i * 1.83,
        x = boat.x + Math.sin(t) * 3.3,
        z = boat.z + Math.cos(t) * 2.1;
      const h = boat.heading + 0.3 * Math.cos(t),
        y = 0.94 + 0.04 * Math.sin(t * 4);
      if (!i) boatX = x;
      piece(hulls, i * 9, x, 0.614, z, 1.25, 0.025, 1.95, h, 0x71969d);
      piece(hulls, i * 9 + 1, x, y, z, 0.96, 0.39, 1.65, h, 0x367dae);
      piece(hulls, i * 9 + 2, x, y + 0.19, z, 0.76, 0.26, 1.19, h, 0x72c3dd);
      for (let seat = 0; seat < 2; seat++) {
        const side = seat ? 0.38 : -0.38,
          px = x + side * Math.cos(h),
          pz = z - side * Math.sin(h),
          n = i * 9 + 3 + seat * 3;
        piece(hulls, n, px, y + 0.49, pz, 0.26, 0.38, 0.22, h, seat ? 0x9f6569 : 0xffbd64);
        piece(hulls, n + 1, px, y + 0.97, pz, 0.16, 0.19, 0.16, h, i % 2 ? 0xd8a883 : 0x9e715a);
        piece(hulls, n + 2, px, y + 1.1, pz, 0.19, 0.07, 0.19, h, i % 2 ? 0x64483c : 0xf1d7a8);
      }
    }
    for (const [i, field] of fields.entries()) {
      const angle = 0.32 * Math.sin(seconds * 0.61 + i),
        high = 12 + (i % 5) * 2.7;
      const x = field.x + Math.sin(seconds * 0.19 + i) * 1.7 + 5,
        z = field.z + Math.cos(seconds * 0.23 + i) * 1.3 - 4;
      const y = field.y + high;
      part.position.set(x, y, z);
      part.rotation.set(0.17, field.heading + 0.65, angle);
      part.scale.setScalar(1.25);
      part.updateMatrix();
      sails.setMatrixAt(i, part.matrix);
      const tint = [0xdb4961, 0x548eaa, 0xdf993c, 0x6ea26e, 0xb270aa][i % 5]!;
      sails.setColorAt(i, paint.setHex(tint));
      if (!i) kiteAngle = part.rotation.z;
      at.set(field.x, field.y + 1.3, field.z);
      tip.set(x, y, z);
      thread(i * 6, 0.029, 0xbcae94);
      at.set(x, y - 1.8, z);
      for (let j = 1; j <= 5; j++) {
        tip.set(at.x + 0.37 * Math.sin(seconds * 1.1 + i + j), at.y - 0.62, at.z + 0.21);
        thread(i * 6 + j, 0.14, j % 2 ? tint : 0xf0d8bc);
        at.copy(tip);
      }
    }
    for (const mesh of [hulls, lines, sails]) mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return {
    root,
    update,
    get boatX() {
      return boatX;
    },
    get kiteAngle() {
      return kiteAngle;
    },
    dispose() {
      root.clear();
      shore.dispose();
      for (const mesh of [hulls, lines, sails]) mesh.dispose();
      oval.dispose();
      strip.dispose();
      cloth.dispose();
      material.dispose();
      silk.dispose();
    },
  };
}
