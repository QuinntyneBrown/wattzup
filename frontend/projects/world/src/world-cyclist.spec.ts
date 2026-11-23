import {
  BatchedMesh,
  type BufferGeometry,
  Color,
  type Group,
  Matrix4,
  type Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';
import { CyclistKit } from './world-cyclist';

describe('CyclistKit rigid bike and body sub-assemblies', () => {
  it('merges rigid frame, rubber, metal, spoke-lace and wheel-blur bike parts into single meshes per material', () => {
    const frame = new MeshStandardMaterial({ color: 0xeeeeea });
    const kit = new CyclistKit(frame);
    const cyclist = kit.make(new Color(0xd7ff3a), 4, frame);

    const directMeshes = cyclist.group.children.filter((c): c is Mesh => (c as Mesh).isMesh);
    const withMaterial = (m: unknown) => directMeshes.filter((mesh) => mesh.material === m);

    // 16 frame + handlebar cylinders merged into 1 shadow-casting frame mesh.
    const frameMeshes = withMaterial(frame);
    expect(frameMeshes).toHaveLength(1);
    expect(frameMeshes[0]?.castShadow).toBe(true);

    // 2 tyres + 1 saddle + 1 bottle + 2 thighs + 2 shins-with-socks + 2 feet batched into 1
    // shadow-casting BatchedMesh (7 instances) on cyclist.group.
    const solidMeshes = withMaterial(kit.solid);
    expect(solidMeshes).toHaveLength(1);
    expect(solidMeshes[0]).toBeInstanceOf(BatchedMesh);
    expect((solidMeshes[0] as BatchedMesh).instanceCount).toBe(7);
    expect(solidMeshes[0]?.castShadow).toBe(true);

    // 2 rims + 1 chainring + 2 animated cranks batched into 1 BatchedMesh (3 instances).
    const metalMeshes = withMaterial(kit.metal);
    expect(metalMeshes).toHaveLength(1);
    expect(metalMeshes[0]).toBeInstanceOf(BatchedMesh);
    expect((metalMeshes[0] as BatchedMesh).instanceCount).toBe(3);

    // Front and rear spoke lace & blur discs merged into 1 mesh each.
    expect(withMaterial(kit.spokeLace)).toHaveLength(1);
    expect(withMaterial(kit.spokes)).toHaveLength(1);
    expect(cyclist.wheelBlur).toHaveLength(1);

    kit.dispose();
    frame.dispose();
  });

  it('merges rigid upper-body jersey, skin and chin-strap parts and runs pose() with zero Vector3 clones', () => {
    const frame = new MeshStandardMaterial({ color: 0xeeeeea });
    const kit = new CyclistKit(frame);
    const cyclist = kit.make(new Color(0xd7ff3a), 4, frame);

    const bodyGroup = cyclist.group.children.find(
      (c): c is Group => !(c as Mesh).isMesh && c.children.length > 0,
    )!;
    const bodyMeshes = bodyGroup.children.filter((c): c is Mesh => (c as Mesh).isMesh);
    const bodyWithMaterial = (m: unknown) => bodyMeshes.filter((mesh) => mesh.material === m);

    expect(bodyWithMaterial(kit.apparel)).toHaveLength(1);
    expect(bodyWithMaterial(kit.solid)).toHaveLength(1);
    expect(bodyMeshes).toHaveLength(2);

    let totalMeshes = 0;
    cyclist.group.traverse((o) => {
      if ((o as Mesh).isMesh) totalMeshes++;
    });
    expect(totalMeshes).toBeLessThanOrEqual(7);

    const other = kit.make(new Color(0x3a9ad9), 2, frame, {
      helmetColor: 0xf2f2ee,
      frameColor: 0xb3262c,
    });
    expect(other.apparel).toBe(cyclist.apparel);

    const cloneSpy = vi.spyOn(Vector3.prototype, 'clone');
    cyclist.pose(1.1, -0.08, 0.5);
    expect(cloneSpy).not.toHaveBeenCalled();
    cloneSpy.mockRestore();

    kit.dispose();
    frame.dispose();
  });

  it('animates cranks, legs, lean and standing body pivot in pose() and disposes shared geometries', () => {
    const frame = new MeshStandardMaterial({ color: 0xb3262c });
    const kit = new CyclistKit(frame);
    const cyclist = kit.make(new Color(0x3a9ad9), 2, frame);

    const solidBatch = cyclist.group.children.find(
      (c): c is BatchedMesh => c instanceof BatchedMesh && c.material === kit.solid,
    )!;
    const beforeThigh = new Matrix4();
    const afterThigh = new Matrix4();
    solidBatch.getMatrixAt(1, beforeThigh);
    cyclist.pose(Math.PI / 2, 0.12, 0.8);
    solidBatch.getMatrixAt(1, afterThigh);
    expect(afterThigh.elements[13]).not.toBeCloseTo(beforeThigh.elements[13]!, 3);
    expect(cyclist.group.rotation.z).toBeCloseTo(0.12 + (0.03 + 0.09 * 0.8), 5);

    const frameMesh = cyclist.group.children.find(
      (c): c is Mesh => (c as Mesh).isMesh && (c as Mesh).material === frame,
    )!;
    const disposeSpy = vi.spyOn(frameMesh.geometry, 'dispose');
    kit.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
    frame.dispose();
  });

  it('toggles shadow casting across all cyclist shadow-casting meshes via setCastShadow()', () => {
    const frame = new MeshStandardMaterial({ color: 0xeeeeea });
    const kit = new CyclistKit(frame);
    const cyclist = kit.make(new Color(0xd7ff3a), 4, frame);

    const countCasters = () => {
      let n = 0;
      cyclist.group.traverse((o) => {
        if ((o as Mesh).isMesh && o.castShadow) n++;
      });
      return n;
    };

    const initial = countCasters();
    expect(initial).toBeGreaterThan(0);

    cyclist.setCastShadow(false);
    expect(countCasters()).toBe(0);

    cyclist.setCastShadow(true);
    expect(countCasters()).toBe(initial);

    kit.dispose();
    frame.dispose();
  });

  it('keeps per-cyclist geometry within 3,300 triangles across bike and rider meshes', () => {
    const frame = new MeshStandardMaterial({ color: 0xeeeeea });
    const kit = new CyclistKit(frame);
    const cyclist = kit.make(new Color(0xd7ff3a), 4, frame);

    let triangles = 0;
    cyclist.group.traverse((o) => {
      if (!(o as Mesh).isMesh) return;
      const geo = (o as Mesh).geometry as BufferGeometry;
      triangles += geo.index ? geo.index.count / 3 : geo.getAttribute('position').count / 3;
    });

    expect(triangles).toBeGreaterThan(1500);
    expect(triangles).toBeLessThan(3300);

    kit.dispose();
    frame.dispose();
  });
});
