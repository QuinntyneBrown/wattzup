import { Color, type Group, type Mesh, MeshStandardMaterial, Vector3 } from 'three/webgpu';
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

    // 2 tyres + 1 saddle merged into 1 shadow-casting rubber mesh.
    const rubberMeshes = withMaterial(kit.rubber);
    expect(rubberMeshes).toHaveLength(1);
    expect(rubberMeshes[0]?.castShadow).toBe(true);

    // 2 rims + 1 chainring merged into 1 static metal mesh, plus 2 animated cranks = 3 metal meshes.
    const metalMeshes = withMaterial(kit.metal);
    expect(metalMeshes).toHaveLength(3);

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

    expect(bodyWithMaterial(cyclist.jersey)).toHaveLength(1);
    expect(bodyWithMaterial(kit.skin)).toHaveLength(1);
    expect(bodyWithMaterial(kit.rubber)).toHaveLength(1);
    expect(bodyMeshes).toHaveLength(6);

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

    cyclist.pose(Math.PI / 2, 0.12, 0.8);
    expect(cyclist.group.rotation.z).toBeCloseTo(0.12 + (0.03 + 0.09 * 0.8), 5);

    const frameMesh = cyclist.group.children.find(
      (c): c is Mesh => (c as Mesh).isMesh && (c as Mesh).material === frame,
    )!;
    const disposeSpy = vi.spyOn(frameMesh.geometry, 'dispose');
    kit.dispose();
    expect(disposeSpy).toHaveBeenCalledOnce();
    frame.dispose();
  });
});
