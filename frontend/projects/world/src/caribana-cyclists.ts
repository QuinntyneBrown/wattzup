import type { Color, Material, Mesh } from 'three/webgpu';
import type { Cyclist } from './world-cyclist';
import { CourseCyclistKit } from './ride-one/course-cyclist';
import { RiderBody } from './ride-one/rider-body';

export type SceneRider = Pick<Cyclist, 'group' | 'pose' | 'wheelBlur' | 'setCastShadow'>;

export async function caribanaCyclists(plain: Material, low: boolean) {
  const body = await RiderBody.load('/riders/rider.glb');
  const kit = new CourseCyclistKit(plain, body, false, low);
  const owned: { dispose(): void }[] = [];
  const spokes = kit.shapes().spokes;
  return {
    spokes,
    spokeLace: spokes,
    make(jersey: Color, number: number): SceneRider {
      const rider = kit.make(jersey, number, true, low && number !== 4 ? 0.65 : 1);
      owned.push(...rider.owned);
      const meshes: Mesh[] = [];
      rider.group.traverse((part) => {
        const mesh = part as Mesh;
        if (mesh.isMesh && !mesh.userData['shadowNone']) meshes.push(mesh);
      });
      let lastCast: boolean | undefined;
      return {
        group: rider.group,
        wheelBlur: [],
        pose(angle, lean = 0, standing = 0) {
          rider.group.rotation.z = lean;
          rider.pose(angle, standing);
        },
        setCastShadow(value) {
          if (lastCast === value) return;
          lastCast = value;
          for (const mesh of meshes) mesh.castShadow = value;
        },
      };
    },
    roll(metres: number) {
      kit.roll(metres);
    },
    dispose() {
      for (const item of owned) item.dispose();
      kit.dispose();
      body.dispose();
    },
  };
}
