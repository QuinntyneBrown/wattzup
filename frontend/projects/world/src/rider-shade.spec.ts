import { occlusion } from './rider-shade';

/** A square of points on the plane y = `y`, facing `ny`, `size` across about the origin. */
function sheet(y: number, ny: number, size: number, step = 0.02): { p: number[]; n: number[] } {
  const p: number[] = [];
  const n: number[] = [];
  for (let x = -size / 2; x <= size / 2 + 1e-9; x += step) {
    for (let z = -size / 2; z <= size / 2 + 1e-9; z += step) {
      p.push(x, y, z);
      n.push(0, ny, 0);
    }
  }
  return { p, n };
}

describe('the shade where parts of a rider meet (L2-166 AC32)', () => {
  it('leaves a surface in the open unshaded', () => {
    const floor = sheet(0, 1, 0.4);
    const shade = occlusion(new Float32Array(floor.p), new Float32Array(floor.n), 0.15);
    expect(Math.max(...shade)).toBeLessThan(0.02);
  });

  it('shades a surface that another lies close over, most where it is covered', () => {
    const floor = sheet(0, 1, 0.4);
    const lid = sheet(0.04, -1, 0.1);
    const p = new Float32Array([...floor.p, ...lid.p]);
    const n = new Float32Array([...floor.n, ...lid.n]);
    const shade = occlusion(p, n, 0.15);
    const at = (x: number, z: number) => {
      for (let i = 0; i < floor.p.length / 3; i++) {
        if (Math.abs(floor.p[i * 3]! - x) < 1e-6 && Math.abs(floor.p[i * 3 + 2]! - z) < 1e-6) {
          return shade[i]!;
        }
      }
      throw new Error('no such point');
    };
    expect(at(0, 0)).toBeGreaterThan(0.3);
    expect(at(0, 0)).toBeGreaterThan(at(0.08, 0));
    expect(at(0.2, 0.2)).toBeLessThan(0.05);
  });

  it('never shades by more than all', () => {
    const floor = sheet(0, 1, 0.2, 0.01);
    const lid = sheet(0.01, -1, 0.2, 0.01);
    const shade = occlusion(
      new Float32Array([...floor.p, ...lid.p]),
      new Float32Array([...floor.n, ...lid.n]),
      0.15,
    );
    expect(Math.max(...shade)).toBeLessThanOrEqual(1);
    expect(Math.min(...shade)).toBeGreaterThanOrEqual(0);
  });
});
