// Unit test
// Traces to: L2-164 AC6
// Description: a ride's start press enters full screen only when Settings asks for it, the browser can, and the app
// is not in full screen already.
import { signal } from '@angular/core';
import type { Fullscreen } from '@telo/api';
import { RECOMMENDED_SETTINGS } from '../storage/local-ride-settings-store';
import { enterFullScreenOnStart } from './full-screen-on-start';

function fullscreen(available: boolean, active: boolean): Fullscreen {
  return { available: signal(available), active: signal(active), enter: vi.fn(), exit: vi.fn() };
}

describe('enterFullScreenOnStart', () => {
  it.each([
    ['asked for, available and not in full screen', true, true, false, true],
    ['not asked for', false, true, false, false],
    ['asked for where the browser cannot', true, false, false, false],
    ['asked for when already in full screen', true, true, true, false],
  ])('%s', (_, asked, available, active, enters) => {
    const screen = fullscreen(available, active);
    enterFullScreenOnStart({ ...RECOMMENDED_SETTINGS, fullScreenOnStart: asked }, screen);
    expect(screen.enter).toHaveBeenCalledTimes(enters ? 1 : 0);
  });
});
