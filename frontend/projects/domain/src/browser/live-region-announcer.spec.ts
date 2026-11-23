// Unit test
// Traces to: L2-141 AC2
// Description: the announcer's one polite live region takes each message a beat after it is asked, empty in between so
// a repeat is heard as a change; only the last of two quick messages is said; the region goes with its owner.
import { TestBed } from '@angular/core/testing';
import { LiveRegionAnnouncer } from './live-region-announcer';

describe('LiveRegionAnnouncer', () => {
  let announcer: LiveRegionAnnouncer;
  const region = () => document.querySelector('.live-announcer');

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [LiveRegionAnnouncer] });
    announcer = TestBed.inject(LiveRegionAnnouncer);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('says a message a beat later in a polite, atomic region of its own', () => {
    announcer.announce('Work, 0:30');

    expect(region()?.getAttribute('aria-live')).toBe('polite');
    expect(region()?.getAttribute('aria-atomic')).toBe('true');
    expect(region()?.textContent).toBe('');
    vi.advanceTimersByTime(100);
    expect(region()?.textContent).toBe('Work, 0:30');
  });

  it('empties the region before a repeat, and says only the last of two quick messages', () => {
    announcer.announce('Work, 0:30');
    vi.advanceTimersByTime(100);
    announcer.announce('Recover, 1:30');
    announcer.announce('Work, 0:30');

    expect(region()?.textContent).toBe('');
    vi.advanceTimersByTime(100);
    expect(region()?.textContent).toBe('Work, 0:30');
    expect(document.querySelectorAll('.live-announcer')).toHaveLength(1);
  });

  it('takes its region away, and says nothing more, when its owner goes', () => {
    announcer.announce('Work, 0:30');

    TestBed.resetTestingModule();
    vi.advanceTimersByTime(100);

    expect(region()).toBeNull();
  });
});
