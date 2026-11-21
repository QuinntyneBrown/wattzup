import type { Segment } from '@wattzup/api';
import { BEND_SAMPLES, bendAhead } from './scene-bend';
import {
  type MutableRoadPoint,
  nextArch,
  nextRamp,
  RAMP_FROM,
  roadAhead,
  type RoadPoint,
} from './scene-road';
import { targetGrade, worldById } from './worlds';

const seg = (kind: Segment['kind'], start: number, duration: number): Segment => ({
  kind,
  start,
  duration,
  level: 10,
  cadence: 80,
  round: kind === 'work' || kind === 'rest' ? 1 : null,
});

const plan: Segment[] = [
  seg('warmup', 0, 300),
  seg('work', 300, 30),
  seg('rest', 330, 60),
  seg('cooldown', 390, 120),
];
const oldTown = worldById('oldtown');

describe('nextArch (L2-110 AC2)', () => {
  it("stands where the next work segment starts, with the world's effort name", () => {
    // 10 s to go at 5 m/s.
    expect(nextArch(oldTown, plan, 290, 5)).toEqual({ label: 'Cobbled sprint', metres: 50 });
  });

  it('is absent when the next segment is not work', () => {
    expect(nextArch(oldTown, plan, 310, 5)).toBeNull();
  });

  it('reads Finish at the end of the last segment', () => {
    expect(nextArch(oldTown, plan, 500, 4)).toEqual({ label: 'Finish', metres: 40 });
  });

  it('floors the speed at 3 m/s, so a stopped rider still sees it ahead', () => {
    expect(nextArch(oldTown, plan, 290, 0)).toEqual({ label: 'Cobbled sprint', metres: 30 });
  });
});

describe('roadAhead (L2-110 AC1)', () => {
  it('eases towards the target grade of the segment the rider will be in', () => {
    // 2 m steps at 5 m/s: step 30 (60 m) is reached at 302 s, inside the work segment.
    const road = roadAhead(oldTown, plan, { t: 290, s: 1000, speed: 5, grade: 0.5 }, 40);
    expect(road).toHaveLength(41);
    expect(road[0]).toEqual({ metres: 0, height: 0, grade: 0.5 });
    const before = road[20]!.grade;
    const after = road[40]!.grade;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(targetGrade(oldTown, 'work', 1080));
  });

  it('raises the road by grade ÷ 100 × 2 m each step', () => {
    const road = roadAhead(oldTown, plan, { t: 0, s: 0, speed: 5, grade: 0.5 }, 3);
    for (let i = 1; i < road.length; i++) {
      expect(road[i]!.height - road[i - 1]!.height).toBeCloseTo((road[i]!.grade / 100) * 2, 9);
    }
  });
});

describe('nextRamp (L2-110 AC9)', () => {
  const road = (grades: number[]): RoadPoint[] =>
    grades.map((grade, i) => ({ metres: i * 2, height: 0, grade }));

  it('finds no ramp on a road that never rises through the threshold', () => {
    expect(nextRamp(road([0.5, 1, 2, 2.9, 2, 0]))).toBeNull();
    expect(nextRamp(road([4, 5, 6, 5]))).toBeNull();
  });

  it('stands at the foot of the first ramp, where the gradient rises through the threshold', () => {
    const ramp = nextRamp(road([0.5, 1, 2, RAMP_FROM, 4.4, 5.6, 6, 5.8, 1, 0, 2, 4, 9]));
    expect(ramp?.metres).toBe(6);
  });

  it('gives the steepest gradient of the ramp, in whole percent', () => {
    expect(nextRamp(road([1, 3.2, 4.4, 5.6, 6.3, 5.8]))?.grade).toBe(6);
  });
});

describe('zero-allocation per-frame roadAhead and bendAhead buffers', () => {
  it('fills pre-allocated RoadPoint and Float32Array buffers in place with identical values', () => {
    const roadBuf: MutableRoadPoint[] = Array.from({ length: 41 }, () => ({
      metres: 0,
      height: 0,
      grade: 0,
    }));
    const firstPointRef = roadBuf[0];
    const freshRoad = roadAhead(oldTown, plan, { t: 290, s: 1000, speed: 5, grade: 0.5 }, 40);
    const reusedRoad = roadAhead(
      oldTown,
      plan,
      { t: 290, s: 1000, speed: 5, grade: 0.5 },
      40,
      roadBuf,
    );

    expect(reusedRoad).toBe(roadBuf);
    expect(reusedRoad[0]).toBe(firstPointRef);
    expect(reusedRoad).toEqual(freshRoad);

    const bendBuf = new Float32Array(BEND_SAMPLES * 4);
    const freshBend = bendAhead(oldTown, 250);
    const reusedBend = bendAhead(oldTown, 250, bendBuf);
    expect(reusedBend).toBe(bendBuf);
    expect(Array.from(reusedBend)).toEqual(Array.from(freshBend));
  });
});
