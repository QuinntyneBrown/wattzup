import { vi } from 'vitest';
import { Mesh, type BufferAttribute, type BufferGeometry } from 'three/webgpu';
import { OldTownStreet } from './world-oldtown';
import { Corners } from './world-corners';
import { apexes } from './scene-bend';
import { worldById } from './worlds';

describe('OldTownStreet and Corners (L2-101 AC1, L2-110 AC9, L2-111 AC10)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initialises vertex normals on every street mesh at build time, before lay() runs', () => {
    const disposables: { dispose(): void }[] = [];
    const street = new OldTownStreet((t) => t, disposables);
    street.build(3.5, 161);

    const missingNormals: string[] = [];
    street.group.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const geometry = obj.geometry as BufferGeometry;
      if (!geometry.getAttribute('normal')) {
        missingNormals.push(obj.type);
      }
    });
    expect(missingNormals).toEqual([]);

    const points = Array.from({ length: 161 }, (_, i) => ({
      metres: (i - 10) * 2,
      height: (i - 10) * 0.04,
    }));
    street.lay(points, 42);
    street.place(42, (m) => m * 0.02);

    for (const d of disposables) d.dispose();
  });

  it('places corners at the bend apexes ahead, mirrored for turn direction and pitched on ramps', () => {
    const disposables: { dispose(): void }[] = [];
    const corners = new Corners(disposables);
    corners.build(3.5, 0.15, 3.9);

    const world = worldById('oldtown');
    const expected = apexes(world, -30, 400);
    corners.place(world, 0, (m) => m * 0.06);

    const visible = corners.group.children.filter((c) => c.visible);
    expect(visible.length).toBe(Math.min(expected.length, corners.group.children.length));
    visible.forEach((corner, i) => {
      expect(corner.scale.x).toBe(expected[i]!.turn);
      expect(corner.position.z).toBeCloseTo(-expected[i]!.s, 5);
      expect(corner.rotation.x).toBeCloseTo(Math.atan(0.06), 5);
    });

    // Advancing s updates corner positions and waves the marshal's flag.
    const beforePosZ = visible[0]!.position.z;
    corners.place(world, 5, (m) => m * 0.06);
    expect(visible[0]!.position.z).toBeCloseTo(beforePosZ + 5, 5);

    // Every corner mesh has normals ready for lighting and bending.
    corners.group.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const normal = (obj.geometry as BufferGeometry).getAttribute('normal') as
        BufferAttribute | undefined;
      expect(normal).toBeDefined();
    });

    for (const d of disposables) d.dispose();
  });
});
