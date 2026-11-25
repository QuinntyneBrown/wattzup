import { mix, positionWorld, sin, smoothstep, uniform, vec3 } from 'three/tsl';
import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshBasicNodeMaterial,
  PlaneGeometry,
} from 'three/webgpu';
import type { Course } from './course';
import { canvasTexture, seeded } from './world-kit';

export function northFace(course: Course) {
  const phase = uniform(0);
  const water = new MeshBasicNodeMaterial({ side: DoubleSide });
  // Wave crests follow the fall of the baked streambed, in metres.
  const wave = sin(positionWorld.y.mul(4.2).add(positionWorld.x.mul(0.35)).add(phase));
  water.colorNode = mix(
    vec3(0.12, 0.28, 0.32),
    vec3(0.62, 0.84, 0.9),
    smoothstep(0.24, 0.97, wave),
  );
  const texture = canvasTexture(384, 96, (ctx) => {
    const rand = seeded(2131);
    for (let i = 0; i < 90; i++) {
      const x = rand() * 384,
        y = 32 + rand() * 28,
        radius = 8 + rand() * 24;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, 'rgba(189,199,218,.24)');
      g.addColorStop(1, 'rgba(163,180,204,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
    }
  });
  const mist = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const plane = new PlaneGeometry(235, 27);
  const group = new Group();
  const banks = [3520, 3745, 6160, 9320, 12550, 15120].map((d, i) => {
    const anchor = course.place(d, Math.sin(course.place(d).heading) > 0 ? -75 : 75);
    const mesh = new Mesh(plane, mist);
    mesh.position.set(anchor.x, anchor.y - 23, anchor.z);
    mesh.rotation.y = course.place(d).heading + (i % 2 ? -0.48 : 0.34);
    group.add(mesh);
    return { mesh, x: anchor.x };
  });
  return {
    group,
    water,
    update(seconds: number) {
      phase.value = (seconds % 240) * 3;
      for (const [i, bank] of banks.entries())
        bank.mesh.position.x = bank.x + 21 * Math.sin(seconds * 0.032 + i);
    },
    report() {
      return { meltwater: phase.value, mistPosition: banks[0]!.mesh.position.x };
    },
    dispose() {
      group.removeFromParent();
      group.clear();
      plane.dispose();
      mist.dispose();
      texture.dispose();
      water.dispose();
    },
  };
}
