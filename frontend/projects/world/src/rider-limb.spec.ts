import { bendLimb, limbSkin, lowerShare } from './rider-limb';

/** A turn of `angle` radians about x, then a move to `at`, as the sixteen numbers of a matrix, column by column. */
function turned(angle: number, at: readonly [number, number, number]): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, at[0], at[1], at[2], 1];
}

/**
 * The two bones of a limb along +y whose joint is `joint` metres down it, bent `angle` radians there: the upper
 * bone stays where it is, the lower one turns about the joint.
 */
function bones(joint: number, angle: number): { upper: number[]; lower: number[] } {
  // The lower bone takes a point at rest to: joint + turn x (point - joint).
  return {
    upper: turned(0, [0, 0, 0]),
    lower: turned(angle, [0, joint - Math.cos(angle) * joint, -Math.sin(angle) * joint]),
  };
}

describe('a limb of one skin over two bones (L2-166 AC26)', () => {
  const JOINT = 0.43;
  const REACH = 0.06;

  describe('how much of the lower bone each place along it follows', () => {
    it('is none of it above the joint and all of it below', () => {
      expect(lowerShare(0, JOINT, REACH)).toBe(0);
      expect(lowerShare(JOINT - REACH, JOINT, REACH)).toBe(0);
      expect(lowerShare(JOINT + REACH, JOINT, REACH)).toBe(1);
      expect(lowerShare(0.86, JOINT, REACH)).toBe(1);
    });

    it('is half of each at the joint', () => {
      expect(lowerShare(JOINT, JOINT, REACH)).toBeCloseTo(0.5);
    });

    it('passes from one bone to the other without a jump', () => {
      let before = 0;
      for (let along = JOINT - REACH; along <= JOINT + REACH; along += 0.002) {
        const share = lowerShare(along, JOINT, REACH);
        expect(share).toBeGreaterThanOrEqual(before);
        expect(share - before).toBeLessThan(0.06);
        before = share;
      }
    });
  });

  it('hangs each vertex on the upper bone, the lower bone, or both about the joint', () => {
    const positions = [0, 0.1, 0, 0, JOINT, 0.05, 0.05, 0.8, 0];

    const skin = limbSkin(positions, JOINT, REACH);

    expect([...skin.index]).toEqual([0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0]);
    expect([...skin.weight.slice(0, 4)]).toEqual([1, 0, 0, 0]);
    expect(skin.weight[4]).toBeCloseTo(0.5);
    expect(skin.weight[5]).toBeCloseTo(0.5);
    expect([...skin.weight.slice(8, 12)]).toEqual([0, 1, 0, 0]);
  });

  for (const degrees of [0, 30, 70, 110, 140]) {
    const angle = (degrees * Math.PI) / 180;

    it(`stays joined at the joint when the limb is bent ${degrees} degrees`, () => {
      // The middle of the joint, and a ring of skin about it.
      const positions = new Float32Array([0, JOINT, 0, 0.05, JOINT, 0, 0, JOINT, 0.05]);
      const normals = new Float32Array([0, 1, 0, 1, 0, 0, 0, 0, 1]);
      const { upper, lower } = bones(JOINT, angle);

      bendLimb(positions, normals, JOINT, REACH, upper, lower);

      // Both bones put the joint's middle in the same place, so the skin neither parts nor laps there.
      expect(positions[0]).toBeCloseTo(0);
      expect(positions[1]).toBeCloseTo(JOINT);
      expect(positions[2]).toBeCloseTo(0);
      // The skin to the side of the joint, on the axis the limb bends about, does not move at all.
      expect([...positions.slice(3, 6)].map((n) => +n.toFixed(6))).toEqual([0.05, JOINT, 0]);
      for (let i = 0; i < 9; i += 3) {
        expect(Math.hypot(normals[i]!, normals[i + 1]!, normals[i + 2]!)).toBeCloseTo(1);
      }
    });

    it(`moves the skin clear of the joint with its own bone when bent ${degrees} degrees`, () => {
      const positions = new Float32Array([0.04, 0.2, 0.03, 0.03, 0.7, 0.02]);
      const normals = new Float32Array([1, 0, 0, 0, 0, 1]);
      const { upper, lower } = bones(JOINT, angle);

      bendLimb(positions, normals, JOINT, REACH, upper, lower);

      // Above the joint nothing moves; below it the skin turns about the joint with the lower bone.
      expect(positions[0]).toBeCloseTo(0.04);
      expect(positions[1]).toBeCloseTo(0.2);
      expect(positions[2]).toBeCloseTo(0.03);
      const y = 0.7 - JOINT;
      expect(positions[3]).toBeCloseTo(0.03);
      expect(positions[4]).toBeCloseTo(JOINT + Math.cos(angle) * y - Math.sin(angle) * 0.02);
      expect(positions[5]).toBeCloseTo(Math.sin(angle) * y + Math.cos(angle) * 0.02);
      expect(normals[3]).toBeCloseTo(0);
      expect(normals[4]).toBeCloseTo(-Math.sin(angle));
      expect(normals[5]).toBeCloseTo(Math.cos(angle));
    });
  }
});
