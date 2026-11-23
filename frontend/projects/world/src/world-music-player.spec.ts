import { WorldMusicPlayer } from './world-music-player';

/** A stand-in for HTMLAudioElement that records what the player asks of it. */
class FakeAudio {
  src = '';
  loop = false;
  volume = 1;
  paused = true;
  plays = 0;
  refuse = false;
  setAttribute(name: string, value: string): void {
    if (name === 'src') this.src = value;
  }
  removeAttribute(name: string): void {
    if (name === 'src') this.src = '';
  }
  loads = 0;
  load(): void {
    this.loads++;
  }
  play(): Promise<void> {
    this.plays++;
    if (this.refuse) return Promise.reject(new DOMException('no gesture', 'NotAllowedError'));
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
}

const flush = () => new Promise((r) => setTimeout(r));

describe('WorldMusicPlayer (L2-128)', () => {
  let audio: FakeAudio;
  let player: WorldMusicPlayer;
  beforeEach(() => {
    audio = new FakeAudio();
    player = new WorldMusicPlayer(() => audio as unknown as HTMLAudioElement, document);
  });

  it("loads the world's track looping at half volume (AC2)", () => {
    player.load('oldtown');
    expect(audio.src).toBe('music/oldtown.ogg');
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(0.5);
  });

  it('plays and pauses as told (AC2, AC3)', async () => {
    player.load('oldtown');
    player.sync(true);
    await flush();
    expect(audio.paused).toBe(false);
    player.sync(false);
    expect(audio.paused).toBe(true);
  });

  it('plays nothing before a world is loaded', async () => {
    player.sync(true);
    await flush();
    expect(audio.plays).toBe(0);
  });

  it('tries again at the next press when the browser refuses to start (AC6)', async () => {
    audio.refuse = true;
    player.load('oldtown');
    player.sync(true);
    await flush();
    expect(audio.paused).toBe(true);
    audio.refuse = false;
    document.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(audio.paused).toBe(false);
  });

  it('does not start at the next press if music was turned off meanwhile', async () => {
    audio.refuse = true;
    player.load('oldtown');
    player.sync(true);
    await flush();
    player.sync(false);
    audio.refuse = false;
    document.dispatchEvent(new Event('keydown'));
    await flush();
    expect(audio.paused).toBe(true);
  });

  it('stops and drops the track when destroyed (AC7)', async () => {
    player.load('oldtown');
    player.sync(true);
    await flush();
    player.destroy();
    expect(audio.paused).toBe(true);
    expect(audio.src).toBe('');
  });
});
