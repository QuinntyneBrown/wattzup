import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SESSION_API, type ProgressReport, type SessionDetail } from '@wattzup/api';
import { DipList, Icon, SessionTraces, StatStrip, WeekStrip } from '@wattzup/components';
import {
  calendarOf,
  dateLine,
  deltaOf,
  dipListView,
  endedEarly,
  totals,
  tracesView,
  weekLine,
} from '../../core/session-view';

type Phase = 'loading' | 'ready' | 'not-found' | 'error';

interface Loaded {
  readonly session: SessionDetail;
  readonly progress: ProgressReport;
}

/** Route `/sessions/:id`: one saved ride, read against the last attempt (L2-085). */
@Component({
  selector: 'wz-session-page',
  imports: [DipList, Icon, RouterLink, SessionTraces, StatStrip, WeekStrip],
  templateUrl: './session-page.html',
  styleUrl: './session-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionPage {
  private readonly sessions = inject(SESSION_API);
  readonly id = input.required<string>();

  private readonly location = inject(Location);
  private readonly arrival = this.location.getState() as Record<string, unknown> | null;
  /** Set by End ride and the ride overlays; cleared once shown, so a reload reads All sessions (AC2). */
  protected readonly justFinished = this.arrival?.['justFinished'] === true;
  protected readonly phase = signal<Phase>('loading');
  private readonly loaded = signal<Loaded | null>(null);
  /** The dip the dip list has hovered or focused, joined to the traces (AC10). */
  protected readonly focusDip = signal<number | null>(null);

  protected readonly view = computed(() => {
    const data = this.loaded();
    if (!data) return null;
    const { session, progress } = data;
    return {
      session,
      date: dateLine(session.ended_at, this.justFinished),
      delta: deltaOf(session),
      early: endedEarly(session),
      streak: progress.streak,
      week: calendarOf(progress),
      weekLine: weekLine(progress.week),
      traces: tracesView(session),
      dips: dipListView(session),
      totals: totals(session),
    };
  });

  constructor() {
    if (this.justFinished) {
      // The browser keeps history.state across a reload; drop the flag from this entry.
      afterNextRender(() =>
        this.location.replaceState(this.location.path(), '', {
          ...this.arrival,
          justFinished: false,
        }),
      );
    }
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
  }

  /** Both requests together; Try again repeats both (AC12). */
  protected async load(id = this.id()): Promise<void> {
    this.phase.set('loading');
    this.focusDip.set(null);
    try {
      const [session, progress] = await Promise.all([
        this.sessions.get(id),
        this.sessions.progress(),
      ]);
      if (session === 'not-found') {
        this.phase.set('not-found');
        return;
      }
      this.loaded.set({ session, progress });
      this.phase.set('ready');
    } catch {
      this.phase.set('error');
    }
  }
}
