import type { Segment } from '@telo/api';
import { classStepAnnouncement, customStepAnnouncement } from './step-announcement';

// Traces to: L2-141 AC2
// What a screen reader hears as a step starts, one case per kind of step: a custom ride's kind, round, length and
// level, and a class's kind and length.
const segment = (kind: Segment['kind'], duration: number, level: number): Segment => ({
  kind,
  duration,
  level,
  cadenceAim: 80,
});

describe('customStepAnnouncement', () => {
  it.each([
    [segment('warm-up', 300, 8), null, 'Warm-up: 5:00 at level 8'],
    [segment('work', 30, 24), { number: 1, of: 8 }, 'Work, round 1 of 8: 0:30 at level 24'],
    [segment('recover', 90, 6), { number: 8, of: 8 }, 'Recover, round 8 of 8: 1:30 at level 6'],
    [segment('steady', 1200, 12), null, 'Steady: 20:00 at level 12'],
    [segment('cool-down', 240, 4), null, 'Cool-down: 4:00 at level 4'],
  ])('says %o in round %o as "%s"', (step, round, heard) => {
    expect(customStepAnnouncement(step, round)).toBe(heard);
  });
});

describe('classStepAnnouncement', () => {
  it.each([
    [segment('warm-up', 300, 8), 'Warm-up, 5:00'],
    [segment('work', 30, 24), 'Work, 0:30'],
    [segment('recover', 90, 6), 'Recover, 1:30'],
  ])('says %o as "%s"', (step, heard) => {
    expect(classStepAnnouncement(step)).toBe(heard);
  });
});
