import { describe, expect, it, vi } from 'vitest';
import { float, vec4 } from 'three/tsl';
import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial } from 'three/webgpu';
import { inkOutline } from './world-ink';
import { ToonLook } from './world-toon';

describe('inkOutline and ToonLook drawn-look shaders (L2-111 AC11)', () => {
  it('samples depth, normal and ink 5 times each with VarNode memoization and zero deprecation warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const counts: Record<string, number> = { depth: 0, normal: 0, ink: 0 };
    const scenePass = {
      getTextureNode: (name: string) => ({
        sample: () => {
          counts[name] = (counts[name] ?? 0) + 1;
          return vec4(float(0.5), 0.5, 0.5, 1);
        },
      }),
    };

    const result = inkOutline(vec4(float(0.8), 0.7, 0.6, 1), scenePass as never) as unknown as {
      traverse: (cb: (n: { isVarNode?: boolean }) => void) => void;
    };

    let varNodeCount = 0;
    result.traverse((n) => {
      if (n.isVarNode) varNodeCount++;
    });

    expect(warnSpy).not.toHaveBeenCalled();
    expect(varNodeCount).toBeGreaterThanOrEqual(6);
    expect(counts['depth']).toBe(5);
    expect(counts['normal']).toBe(5);
    expect(counts['ink']).toBe(5);
    warnSpy.mockRestore();
  });

  it('shares toon twins and dither/rim nodes across meshes and restores originals on disable', () => {
    const toon = new ToonLook();
    const root = new Group();
    const matA = new MeshStandardMaterial({ color: 0xcc6644 });
    const matB = new MeshStandardMaterial({ color: 0x4466cc, alphaTest: 0.5 });
    const matC = new MeshStandardMaterial({ color: 0x22aa55, alphaTest: 0.5 });
    const m1 = new Mesh(new BoxGeometry(1, 1, 1), matA);
    const m2 = new Mesh(new BoxGeometry(1, 1, 1), matA);
    const m3 = new Mesh(new BoxGeometry(1, 1, 1), matB);
    const m4 = new Mesh(new BoxGeometry(1, 1, 1), matC);
    root.add(m1, m2, m3, m4);

    toon.apply(root, true, new Color(0x88bbee));
    expect(m1.material).not.toBe(matA);
    expect(m1.material).toBe(m2.material);
    expect(toon.dithered(root)).toBe(2);
    expect((m3.material as { alphaTestNode?: unknown }).alphaTestNode).toBe(
      (m4.material as { alphaTestNode?: unknown }).alphaTestNode,
    );

    toon.apply(root, false, new Color(0x88bbee));
    expect(m1.material).toBe(matA);
    expect(m2.material).toBe(matA);
    expect(m3.material).toBe(matB);
    expect(m4.material).toBe(matC);

    toon.dispose();
    matA.dispose();
    matB.dispose();
    matC.dispose();
  });
});
