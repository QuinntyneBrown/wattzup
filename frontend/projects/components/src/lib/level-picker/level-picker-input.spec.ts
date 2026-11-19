import { levelAtFraction, levelForKey } from './level-picker-input';

describe('levelForKey', () => {
  const cases: [string, number | null, number | null][] = [
    ['ArrowRight', 18, 19],
    ['ArrowUp', 18, 19],
    ['ArrowLeft', 18, 17],
    ['ArrowDown', 18, 17],
    ['PageUp', 18, 22],
    ['PageDown', 18, 14],
    ['Home', 18, 1],
    ['End', 18, 32],
    ['ArrowRight', 32, 32],
    ['ArrowLeft', 1, 1],
    ['PageUp', 30, 32],
    ['PageDown', 2, 1],
    ['ArrowRight', null, 13],
    ['ArrowLeft', null, 11],
    ['Enter', 18, null],
    ['a', 18, null],
  ];
  for (const [key, current, expected] of cases) {
    it(`${key} from ${current} is ${expected}`, () => {
      expect(levelForKey(key, current)).toBe(expected);
    });
  }
});

describe('levelAtFraction', () => {
  const cases: [number, number][] = [
    [0, 1],
    [0.01, 1],
    [1 / 32, 2],
    [0.5, 17],
    [0.99, 32],
    [1, 32],
    [-0.2, 1],
    [1.3, 32],
  ];
  for (const [fraction, expected] of cases) {
    it(`${fraction} is level ${expected}`, () => {
      expect(levelAtFraction(fraction)).toBe(expected);
    });
  }
});
