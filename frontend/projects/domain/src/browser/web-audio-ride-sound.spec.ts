// Unit test
// Traces to: L2-163 AC1, AC2, AC3
// Description: ride sound makes its audio context only while a ride plays with "Ride sound" on, and closes it when
// either ends. Its master level is the volume while the ride runs and the tab shows, follows a volume change at once
// with a time constant that passes 95 % within 100 ms, and goes silent under a playing class video only while "Mute
// ride sound under a class video" is on.
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RIDE_SETTINGS, type RideSettings, type RideSoundSource } from '@telo/api';
import { RECOMMENDED_SETTINGS } from '../storage/local-ride-settings-store';
import { SETTING_S, WebAudioRideSound } from './web-audio-ride-sound';

class FakeParam {
  value = 0;
  readonly targets: [number, number, number][] = [];
  setTargetAtTime(value: number, at: number, constant: number): this {
    this.targets.push([value, at, constant]);
    this.value = value;
    return this;
  }
}

class FakeNode {
  connect<T>(node: T): T {
    return node;
  }
}

class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
}

class FakeFilter extends FakeNode {
  type = '';
  readonly frequency = new FakeParam();
}

class FakeSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  start(): void {
    /* a fake plays nothing */
  }
}

class FakeContext {
  static made: FakeContext[] = [];
  readonly gains: FakeGain[] = [];
  readonly destination = new FakeNode();
  state = 'running';
  currentTime = 4;
  sampleRate = 8000;
  closed = false;

  constructor() {
    FakeContext.made.push(this);
  }

  /** The first gain made is the master level. */
  get master(): FakeGain {
    return this.gains[0]!;
  }

  createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }

  createBufferSource(): FakeSource {
    return new FakeSource();
  }

  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }

  close(): Promise<void> {
    this.closed = true;
    return Promise.resolve();
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }
}

describe('WebAudioRideSound', () => {
  let settings: ReturnType<typeof signal<RideSettings>>;
  let source: {
    running: ReturnType<typeof signal<boolean>>;
    videoPlaying: ReturnType<typeof signal<boolean>>;
  } & RideSoundSource;

  function sound(): WebAudioRideSound {
    const player = TestBed.inject(WebAudioRideSound);
    TestBed.tick();
    return player;
  }

  function change(fields: Partial<RideSettings>): void {
    settings.update((current) => ({ ...current, ...fields }));
    TestBed.tick();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    FakeContext.made = [];
    vi.stubGlobal('AudioContext', FakeContext);
    settings = signal(RECOMMENDED_SETTINGS);
    const running = signal(true);
    const videoPlaying = signal(false);
    source = {
      cadence: signal(90),
      speedKmh: signal(30),
      resistance: signal(12),
      running,
      videoPlaying,
    };
    TestBed.configureTestingModule({
      providers: [
        WebAudioRideSound,
        {
          provide: RIDE_SETTINGS,
          useValue: { settings, persisted: signal(true), set: vi.fn(), reset: vi.fn() },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('makes no audio context with ride sound off, while a ride plays (AC3)', () => {
    change({ rideSound: false });
    sound().play(source);
    TestBed.tick();

    expect(FakeContext.made).toHaveLength(0);
  });

  it('makes one audio context while a ride plays, and closes it when the ride stops (AC3)', () => {
    const player = sound();
    expect(FakeContext.made).toHaveLength(0);

    player.play(source);
    TestBed.tick();
    expect(FakeContext.made).toHaveLength(1);

    player.stop();
    TestBed.tick();
    expect(FakeContext.made[0]!.closed).toBe(true);
  });

  it('closes the context when ride sound is turned off mid-ride, and makes a new one when it comes back (AC3)', () => {
    sound().play(source);
    TestBed.tick();

    change({ rideSound: false });
    expect(FakeContext.made[0]!.closed).toBe(true);

    change({ rideSound: true });
    expect(FakeContext.made).toHaveLength(2);
    expect(FakeContext.made[1]!.closed).toBe(false);
  });

  it('closes the context when its owner is destroyed', () => {
    sound().play(source);
    TestBed.tick();

    TestBed.resetTestingModule();

    expect(FakeContext.made[0]!.closed).toBe(true);
  });

  it('plays at the volume, and follows a change at once, past 95 % within 100 ms with no click (AC2)', () => {
    sound().play(source);
    TestBed.tick();
    const master = FakeContext.made[0]!.master.gain;
    expect(master.value).toBeCloseTo(0.7, 9);

    change({ rideSoundVolume: 40 });

    expect(master.targets.at(-1)).toEqual([0.4, 4, SETTING_S]);
    expect(1 - Math.exp(-0.1 / SETTING_S)).toBeGreaterThan(0.95);
  });

  it.each([
    ['the ride paused', { running: false, videoPlaying: false }, true, 0],
    ['a class video playing, muted under it', { running: true, videoPlaying: true }, true, 0],
    [
      'a class video playing, not muted under it',
      { running: true, videoPlaying: true },
      false,
      0.7,
    ],
    ['a class video paused, muted under it', { running: true, videoPlaying: false }, true, 0.7],
  ])('with %s, the master level is %#', (_, state, muteUnderVideo, level) => {
    change({ muteUnderVideo });
    sound().play(source);
    TestBed.tick();

    source.running.set(state.running);
    source.videoPlaying.set(state.videoPlaying);
    TestBed.tick();

    expect(FakeContext.made[0]!.master.gain.value).toBeCloseTo(level, 9);
  });
});
