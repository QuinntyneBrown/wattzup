import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  input,
  linkedSignal,
  viewChildren,
} from '@angular/core';
import { formatClock } from '../metric/format-clock';
import type { TraceSegment } from './ride-kind';
import { RideProgress } from './ride-progress';
import { RideTrace } from './ride-trace';
import { rideTicks } from './ride-trace-geometry';

/** What the main view shows. */
export type RideViewTab = 'video' | 'chart';

/**
 * The main view (design-system block ride-view, L2-103): the tab list "Main view" with "Video", when the workout has
 * one, and "Power vs. plan"; the video the page projects, captioned "In sync · pauses with the ride", or the trace
 * with its legend; the time ticks under both. Without a video it opens on "Power vs. plan" (L2-098 AC6). The panels
 * stay in the page when hidden, so the video keeps playing behind the trace.
 */
@Component({
  selector: 'wz-ride-view',
  imports: [RideProgress, RideTrace],
  templateUrl: './ride-view.html',
  styleUrl: './ride-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-view', '[attr.data-state]': 'tab()' },
})
export class RideView {
  readonly hasVideo = input(false);
  readonly segments = input.required<readonly TraceSegment[]>();
  readonly averages = input.required<readonly number[]>();
  readonly bucket = input.required<number>();
  readonly elapsed = input.required<number>();
  readonly total = input.required<number>();
  readonly max = input.required<number>();
  readonly traceLabel = input.required<string>();
  /** The progress strip's label, "Ride progress: 6:52 of 30:00" (L2-103 AC4). */
  readonly progressLabel = input('');

  protected readonly tab = linkedSignal<RideViewTab>(() => (this.hasVideo() ? 'video' : 'chart'));
  protected readonly tabs = computed<RideViewTab[]>(() =>
    this.hasVideo() ? ['video', 'chart'] : ['chart'],
  );
  protected readonly ticks = computed(() => rideTicks(this.total(), formatClock));
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected choose(tab: RideViewTab): void {
    this.tab.set(tab);
  }

  /** Arrow keys, Home and End move between the tabs and choose the one they reach. */
  protected move(event: KeyboardEvent): void {
    const tabs = this.tabs();
    const at = tabs.indexOf(this.tab());
    const to =
      event.key === 'ArrowRight'
        ? (at + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (at - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : null;
    if (to === null) return;
    event.preventDefault();
    this.tab.set(tabs[to]!);
    this.buttons()[to]?.nativeElement.focus();
  }
}
