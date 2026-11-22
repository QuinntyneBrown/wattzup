import type { Locator, Page } from '@playwright/test';

/** Class Ride at `/classes/:id/ride` (docs/mocks/pages/class-ride/): the header, the video and the bike panel. */
export class ClassRidePage {
  readonly name: Locator;
  readonly clock: Locator;
  readonly finish: Locator;
  readonly segmentKind: Locator;
  readonly segmentLeft: Locator;
  readonly segmentFill: Locator;
  readonly profile: Locator;
  readonly cover: Locator;
  readonly pause: Locator;
  readonly resume: Locator;
  readonly leave: Locator;
  readonly paused: Locator;
  readonly lost: Locator;
  readonly reconnect: Locator;
  readonly videoNotice: Locator;
  readonly power: Locator;
  readonly powerHint: Locator;
  readonly cadence: Locator;
  readonly cadenceHint: Locator;
  readonly resistance: Locator;
  readonly level: Locator;
  readonly raise: Locator;
  /** Waiting for a group session's start: "Starts in 9:00" over the parked video (L2-087 AC4). */
  readonly wait: Locator;
  readonly waitTime: Locator;
  readonly waitNote: Locator;
  readonly lower: Locator;

  constructor(private readonly page: Page) {
    this.name = page.locator('.class-ride__name');
    this.clock = page.locator('.class-ride__clock');
    this.finish = page
      .getByRole('link', { name: 'Finish' })
      .or(page.getByRole('button', { name: 'Finish' }));
    this.segmentKind = page.locator('.class-segment__kind');
    this.segmentLeft = page.locator('.class-segment__left');
    this.segmentFill = page.locator('.class-segment__fill');
    this.profile = page.getByRole('img', { name: 'Resistance profile' });
    this.cover = page.locator('.class-video .photo');
    this.pause = page.getByRole('button', { name: 'Pause', exact: true });
    this.resume = page.getByRole('button', { name: 'Resume', exact: true });
    this.leave = page.getByRole('link', { name: 'Leave class' });
    this.paused = page.locator('.class-video__paused');
    this.lost = page.getByRole('alert').filter({ hasText: 'Lost the bike' });
    this.reconnect = page.getByRole('button', { name: 'Reconnect' });
    this.videoNotice = page.locator('.class-video__notice');
    const stat = (label: string) =>
      page.locator('.class-stat').filter({ has: page.getByText(label, { exact: true }) });
    this.power = stat('Power').locator('.class-stat__number');
    this.powerHint = stat('Power').locator('.class-stat__hint');
    this.cadence = stat('Cadence').locator('.class-stat__number');
    this.cadenceHint = stat('Cadence').locator('.class-stat__hint');
    this.resistance = page.locator('.class-resist__value');
    this.level = page.locator('.class-resist__level');
    this.raise = page.getByRole('button', { name: 'Raise resistance' });
    this.wait = page.locator('.class-video__wait');
    this.waitTime = this.wait.getByRole('timer');
    this.waitNote = page.locator('.class-video__wait-note');
    this.lower = page.getByRole('button', { name: 'Lower resistance' });
  }

  /** Opens the ride in a group session, as Class Start does once the rider has joined it. */
  async openGroup(classId: string, sessionId: string): Promise<void> {
    await this.page.goto(`/classes/${classId}/ride?session=${sessionId}`);
  }

  async open(classId: string): Promise<void> {
    await this.page.goto(`/classes/${classId}/ride?mode=solo`);
  }

  /** The width the segment's progress bar is filled to, as a share of the bar (0 to 1). */
  segmentProgress(): Promise<number> {
    return this.segmentFill.evaluate(
      (fill) =>
        fill.getBoundingClientRect().width / fill.parentElement!.getBoundingClientRect().width,
    );
  }
}
