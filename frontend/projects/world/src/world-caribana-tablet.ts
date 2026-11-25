import { Group, Mesh, type Material } from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { SceneStreet, StreetFactory } from './world-kit';

const SECTION = 24;
const LOOP = 360;
const DRAW_AHEAD = 160;

/** The authored blocks have local origins on the road centre at the start of each section. */
export async function loadTabletCaribana(): Promise<StreetFactory> {
  const asset = await new GLTFLoader().loadAsync('worlds/caribana/caribana-tablet.glb');
  return (_track, disposables): SceneStreet => {
    const group = new Group();
    const backdrop: Mesh[] = [];
    const sections: { mesh: Mesh; start: number }[] = [];
    const materials = new Set<Material>();
    for (const part of asset.scene.children) {
      const mesh = part as Mesh;
      if (!mesh.isMesh) continue;
      const placed = mesh.clone();
      group.add(placed);
      disposables.push(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
      }
      if (mesh.name === 'Toronto_skyline') {
        // RoadBend attaches its vertex shader to materials. Give the skyline its own copy.
        placed.material = (mesh.material as Material).clone();
        disposables.push(placed.material);
        backdrop.push(placed);
      } else {
        sections.push({ mesh: placed, start: -mesh.position.z });
      }
    }
    for (const material of materials) {
      const map = (material as Material & { map?: { dispose(): void } }).map;
      if (map) disposables.push(map);
    }
    disposables.push(...materials);
    return {
      group,
      backdrop,
      build() {},
      lay() {},
      setTime() {},
      place(distance, heightAt) {
        for (const section of sections) {
          const ahead = ((((section.start - distance + 48) % LOOP) + LOOP) % LOOP) - 48;
          const mesh = section.mesh;
          mesh.visible = ahead >= -48 && ahead < DRAW_AHEAD;
          if (!mesh.visible) continue;
          const height = heightAt(ahead);
          const rise = heightAt(ahead + SECTION) - height;
          mesh.position.set(0, height, -ahead);
          // Shear the section to grade so neighbouring end points meet on every frame.
          mesh.matrixAutoUpdate = false;
          mesh.matrix.makeShear(0, 0, 0, 0, 0, -rise / SECTION);
          mesh.matrix.setPosition(mesh.position);
          mesh.matrixWorldNeedsUpdate = true;
        }
      },
    };
  };
}
