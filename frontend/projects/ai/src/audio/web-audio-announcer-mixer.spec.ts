// Unit test
// Traces to: L2-169 AC3; L2-171 AC3, AC4
import { WebAudioAnnouncerMixer } from './web-audio-announcer-mixer';

describe('WebAudioAnnouncerMixer (L2-169 AC3, L2-171 AC3, AC4)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('allocates zero AudioContext when unused and ducks while playing', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const setTargetAtTime = vi.fn();
    const hooks: { onEnded?: () => void } = {};
    const createContext = vi.fn(
      () =>
        ({
          state: 'running',
          currentTime: 0,
          destination: {},
          resume: vi.fn().mockResolvedValue(undefined),
          close,
          createGain: () => ({
            gain: { value: 1, setTargetAtTime },
            connect: vi.fn(),
            disconnect: vi.fn(),
          }),
          createBuffer: (_c: number, len: number) => ({
            getChannelData: () => new Float32Array(len),
          }),
          createBufferSource: () => ({
            buffer: null,
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            set onended(cb: () => void) {
              hooks.onEnded = cb;
            },
          }),
        }) as unknown as AudioContext,
    );

    const mixer = new WebAudioAnnouncerMixer(createContext);
    expect(createContext).not.toHaveBeenCalled();

    const playing = mixer.play(new Float32Array([0.1, 0.2]), 85);
    expect(createContext).toHaveBeenCalledTimes(1);
    expect(mixer.ducking()).toBe(true);

    mixer.setVolume(50);
    expect(setTargetAtTime).toHaveBeenCalledWith(0.5, 0, 0.03);

    hooks.onEnded?.();
    await playing;
    vi.advanceTimersByTime(250);
    expect(mixer.ducking()).toBe(false);

    mixer.dispose();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
