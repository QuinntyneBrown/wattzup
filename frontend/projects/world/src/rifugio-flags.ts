import {
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
} from 'three/webgpu';
import type { Course } from './course';

const colours = [
  [0x188655, 0xfff4dc, 0xd1473b],
  [0x3b84bc, 0xfff4dc, 0x548b56],
  [0xfff4dc, 0xcd4031, 0xcd4031],
] as const;

/** Cloth is anchored to the exact native pole positions on the twelve hotel terraces. */
export function rifugioFlags(course: Course) {
  const root = new Group();
  const paint = new MeshBasicMaterial({ side: DoubleSide, vertexColors: true });
  const flags = (course.file.rifugioFlags ?? []).map((site) => {
    const geometry = new PlaneGeometry(1.8, 1, 9, 3).toNonIndexed();
    geometry.translate(0.9, -0.5, 0);
    const positions = geometry.getAttribute('position');
    const colour = new Color();
    const rgb: number[] = [];
    for (let face = 0; face < positions.count; face += 3) {
      const uv = geometry.getAttribute('uv');
      const vertical = site.pattern === 0;
      const coordinate = (i: number) => (vertical ? uv.getX(i) : 1 - uv.getY(i));
      const band = Math.min(
        2,
        Math.floor(coordinate(face) + coordinate(face + 1) + coordinate(face + 2)),
      );
      colour.setHex(colours[site.pattern]![band]!);
      for (let k = 0; k < 3; k++) rgb.push(colour.r, colour.g, colour.b);
    }
    geometry.setAttribute('color', new Float32BufferAttribute(rgb, 3));
    const mesh = new Mesh(geometry, paint);
    mesh.rotation.y = site.yaw;
    mesh.position.set(...site.position);
    root.add(mesh);
    return { site, mesh, positions };
  });
  return {
    root,
    update(metres: number, time: number) {
      let nearest = Infinity,
        tip: number | null = null;
      for (const { site, mesh, positions } of flags) {
        const distance = Math.abs(metres - site.station);
        mesh.visible = distance < 210;
        if (!mesh.visible) continue;
        const phase = time * 3.8 + site.station * 0.003 + site.pattern * 0.45;
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          positions.setZ(
            i,
            x *
              (0.12 * Math.sin(x * 4 - phase) +
                0.051 * Math.sin(x * 7 - phase * 1.7 + positions.getY(i))),
          );
          if (distance < nearest && x > 1.79) {
            tip = positions.getZ(i);
            nearest = distance;
          }
        }
        positions.needsUpdate = true;
      }
      return tip;
    },
    dispose() {
      root.clear();
      for (const { mesh } of flags) mesh.geometry.dispose();
      paint.dispose();
    },
  };
}
