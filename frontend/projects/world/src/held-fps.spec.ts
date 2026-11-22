// Unit test
// Traces to: L2-152 AC5
// Description: the frame rate World loading's warm-up held, from the times its frames arrived: the median interval,
// so one long frame while a program compiles does not drag it down, rounded to whole frames a second.
import { heldFps } from './held-fps';

describe('heldFps', () => {
  it('reads 60 fps from frames a display period apart', () => {
    expect(heldFps([0, 16.7, 33.3, 50, 66.7])).toBe(60);
  });

  it('takes the median interval, so one slow frame does not set the rate', () => {
    expect(heldFps([0, 16.7, 33.3, 150, 166.7, 183.3])).toBe(60);
  });

  it('reads 30 fps from frames two periods apart', () => {
    expect(heldFps([0, 33.3, 66.7, 100])).toBe(30);
  });

  it('reads nothing from fewer than two frames', () => {
    expect(heldFps([])).toBeNull();
    expect(heldFps([12])).toBeNull();
  });
});
