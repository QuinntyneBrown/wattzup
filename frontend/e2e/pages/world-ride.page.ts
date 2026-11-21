import { expect, type Locator, type Page } from '@playwright/test';
import { ClassesPage } from './classes.page';
import { RidePage } from './ride.page';

/** World Ride at `/classes/:id/world` (L2-102 to L2-110). Owns every World Ride selector. */
export class WorldRidePage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly bar: Locator;
  readonly lockup: Locator;
  readonly classLink: Locator;
  readonly classLine: Locator;
  readonly bike: Locator;
  readonly clock: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly endButton: Locator;
  readonly musicButton: Locator;
  readonly rideSoundButton: Locator;
  readonly notFoundTitle: Locator;
  readonly metrics: Locator;
  readonly power: Locator;
  readonly powerUnit: Locator;
  readonly target: Locator;
  readonly segment: Locator;
  readonly segmentLabel: Locator;
  readonly segmentLeft: Locator;
  readonly segmentProgress: Locator;
  readonly next: Locator;
  readonly resistance: Locator;
  readonly level: Locator;
  readonly levelCaption: Locator;
  readonly lower: Locator;
  readonly raise: Locator;
  readonly hud: Locator;
  readonly scene: Locator;
  readonly sceneNotice: Locator;
  readonly profile: Locator;
  readonly board: Locator;
  readonly boardTitle: Locator;
  readonly boardNote: Locator;
  readonly riders: Locator;
  readonly you: Locator;
  readonly profileGrade: Locator;
  readonly profileClimbed: Locator;
  readonly profileDistance: Locator;
  readonly routeImage: Locator;
  readonly pausedOverlay: Locator;
  readonly lostOverlay: Locator;
  readonly reconnectButton: Locator;
  readonly endedOverlay: Locator;
  readonly seeYourRide: Locator;
  readonly rideAnotherClass: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main.world-ride');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.bar = this.main.locator('.world-ride__bar');
    this.lockup = this.bar.getByRole('link', { name: 'Wattzup dashboard' });
    this.classLink = this.bar.getByRole('link', { name: 'Class', exact: true });
    this.classLine = this.bar.locator('.world-ride__class .world-ride__muted');
    this.bike = this.bar.locator('.world-ride__bike');
    this.clock = this.bar.locator('.world-ride__clock');
    this.pauseButton = this.bar.getByRole('button', { name: 'Pause' });
    this.resumeButton = this.bar.getByRole('button', { name: 'Resume' });
    this.endButton = this.bar.getByRole('button', { name: 'End' });
    this.musicButton = this.bar.getByRole('button', { name: 'Music' });
    this.rideSoundButton = this.bar.getByRole('button', { name: /^Ride sound (on|off)$/ });
    this.notFoundTitle = page.getByRole('heading', { level: 1, name: "We can't find that class" });
    this.metrics = this.main.getByRole('region', { name: 'Live metrics' });
    this.power = this.metrics.locator('.world-ride__power');
    this.powerUnit = this.metrics.locator('.world-ride__unit');
    this.target = this.metrics.locator('.world-ride__target');
    this.segment = this.main.getByRole('region', { name: 'Current segment' });
    this.segmentLabel = this.segment.locator('.world-ride__segment-label');
    this.segmentLeft = this.segment.getByRole('timer');
    this.segmentProgress = this.segment.getByRole('progressbar', { name: 'Segment progress' });
    this.next = this.segment.locator('.world-ride__next');
    this.resistance = this.main.getByRole('region', { name: 'Resistance' });
    this.level = this.resistance.getByRole('status', { name: 'Resistance' });
    this.levelCaption = this.resistance.locator('.world-ride__caption');
    this.lower = this.resistance.getByRole('button', { name: 'Lower resistance' });
    this.raise = this.resistance.getByRole('button', { name: 'Raise resistance' });
    this.hud = this.main.locator('.world-ride__hud');
    this.scene = this.main.locator('canvas');
    this.sceneNotice = this.main.locator('.world-ride__source[role="status"]');
    this.profile = this.main.getByRole('region', { name: 'Route profile' });
    this.board = this.main.getByRole('complementary', { name: /^Riders nearby/ });
    this.boardTitle = this.board.getByRole('heading', { level: 2 });
    this.boardNote = this.board.locator('.world-ride__muted');
    this.riders = this.board.getByRole('listitem');
    this.you = this.board.locator('li[aria-current="true"]');
    this.profileGrade = this.profile.locator('.world-ride__metric');
    this.profileClimbed = this.profile.locator('.world-ride__climbed');
    this.profileDistance = this.profile.locator('.world-ride__distance');
    this.routeImage = this.profile.getByRole('img');
    this.pausedOverlay = this.main.locator('.world-ride__overlay[role="status"]', {
      hasText: 'Paused on',
    });
    this.lostOverlay = this.main.getByRole('alert');
    this.reconnectButton = this.lostOverlay.getByRole('button', { name: 'Reconnect' });
    this.endedOverlay = this.main.locator('.world-ride__overlay', { hasText: 'See your ride' });
    this.seeYourRide = this.endedOverlay.getByRole('link', { name: 'See your ride' });
    this.rideAnotherClass = this.endedOverlay.getByRole('link', { name: 'Ride another class' });
  }

  /**
   * Records every `Audio` the page makes, so `music()` can read the world track's player
   * (L2-128). Call before the page loads.
   */
  async probeMusic(): Promise<void> {
    await this.page.addInitScript(() => {
      const made: HTMLAudioElement[] = [];
      const Native = window.Audio;
      (window as unknown as { __wzAudio: HTMLAudioElement[] }).__wzAudio = made;
      window.Audio = function (src?: string) {
        const audio = new Native(src);
        made.push(audio);
        return audio;
      } as unknown as typeof Audio;
    });
  }

  /** The world track's player as the page left it, or null before one is made (L2-128). */
  async music(): Promise<{
    src: string;
    paused: boolean;
    loop: boolean;
    volume: number;
    time: number;
  } | null> {
    return this.page.evaluate(() => {
      const made = (window as unknown as { __wzAudio?: HTMLAudioElement[] }).__wzAudio ?? [];
      const a = made.at(-1);
      return a
        ? {
            src: a.getAttribute('src') ?? '',
            paused: a.paused,
            loop: a.loop,
            volume: a.volume,
            time: a.currentTime,
          }
        : null;
    });
  }

  /** A metric of the panel's description list by its term: `Cadence`, `Heart` or `Speed`. */
  stat(term: string): Locator {
    return this.metrics.locator(`dt:text-is("${term}") + dd`);
  }

  /** The accessible names of the app bar's controls, in Tab order. */
  async barOrder(): Promise<string[]> {
    return this.bar
      .locator('a, button')
      .evaluateAll((els) =>
        els.map((e) => e.getAttribute('aria-label') ?? e.textContent?.trim() ?? ''),
      );
  }

  /**
   * Connects the fake bike, then opens the class `id` (whose card reads `title`) through the
   * app's own links and presses its `Ride in …` button, whatever its world.
   */
  async startClass(id: string, title: string): Promise<void> {
    const ride = new RidePage(this.page);
    await ride.open();
    await ride.connect();
    await expect(ride.statusState).toHaveText('Connected');
    const classes = new ClassesPage(this.page);
    await this.page.getByRole('banner').getByRole('link', { name: 'Library' }).click();
    await this.page.waitForURL(/\/classes$/);
    await classes.card(title).click();
    await classes.rideInAnyWorld.click();
    await this.page.waitForURL(new RegExp(`/classes/${id}/world$`));
  }

  /** Loads `/classes/<id>/world` straight away. */
  async open(id = '30-minute-hiit-cardio'): Promise<void> {
    await this.page.goto(`/classes/${id}/world`);
  }

  /**
   * Connects the fake bike, then goes through the app's own links (a reload would drop the bike)
   * to the class page and presses `Ride in <world name>`, so the ride runs in its world
   * (L2-102 AC1-3).
   */
  async startFromClass(
    title = '30 Minute HIIT Cardio',
    worldName = 'Old Town Criterium',
    id = '30-minute-hiit-cardio',
  ): Promise<void> {
    const ride = new RidePage(this.page);
    await ride.open();
    await ride.connect();
    await expect(ride.statusState).toHaveText('Connected');
    const classes = new ClassesPage(this.page);
    await this.page.getByRole('banner').getByRole('link', { name: 'Library' }).click();
    await this.page.waitForURL(/\/classes$/);
    await classes.card(title).click();
    await classes.rideIn(worldName).click();
    await this.page.waitForURL(new RegExp(`/classes/${id}/world$`));
  }
}
