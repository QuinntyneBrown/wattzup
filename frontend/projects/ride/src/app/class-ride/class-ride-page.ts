import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { WORLD_DOWNLOADER } from '@telo/api';
import {
  BackLink,
  Banner,
  Button,
  ClassPlan,
  ClassStartHeader,
  LoadCard,
  Pill,
} from '@telo/components';
import { FetchWorldDownloader } from '@telo/domain';
import { LiveSessionStore } from '../live/live-session-store';
import { ClassRideSession } from './class-ride-session';
import { WorldLoadStore } from './world-load-store';

/**
 * `/classes/:id/ride`: World loading (docs/mocks/pages/world-loading/) until the class's world is ready and the rider
 * presses Start riding, then the class ride at the same address (L2-151). World loading is the class over its world's
 * panorama and the load card; the ride's own providers come with `ClassRideSession`, so its clock and its first
 * command wait for Start riding. Leaving releases what the load acquired (AC5).
 */
@Component({
  selector: 'wz-class-ride-page',
  imports: [
    BackLink,
    Banner,
    Button,
    ClassPlan,
    ClassRideSession,
    ClassStartHeader,
    LoadCard,
    Pill,
    RouterLink,
  ],
  templateUrl: './class-ride-page.html',
  styleUrl: './class-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The group session's store lives with the page, so World loading's join lasts through the class ride (slice 16.4).
  providers: [
    WorldLoadStore,
    LiveSessionStore,
    { provide: WORLD_DOWNLOADER, useClass: FetchWorldDownloader },
  ],
})
export default class ClassRidePage {
  protected readonly load = inject(WorldLoadStore);
  private readonly start = viewChild('start', { read: ElementRef<HTMLButtonElement> });

  constructor() {
    // Start riding takes focus when the world is ready (L2-153 AC2).
    effect(() => this.start()?.nativeElement.focus());
  }
}
