import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CLASS_API, type ClassEntry, WORKOUT_API } from '@wattzup/api';
import { Alert, Icon, LevelRow, NumberStepper, StatusLine } from '@wattzup/components';
import {
  cadenceLine,
  type ClassDraft,
  draftOf,
  isEdited,
  type LevelRowName,
  levelRows,
  shiftLevels,
  toSetupDrafts,
  toStartRequest,
  stretchLine,
  structureLine,
} from '../../core/class-draft';
import { liveConnectionStatus } from '../../core/connection-status';
import { ClassNotFound } from '../class-not-found/class-not-found';
import { DialogLauncher } from '../../core/dialog-launcher';
import { formatDuration } from '../../core/format-duration';
import { LiveStateService } from '../../core/live-state.service';
import { MachineHistoryStore } from '../../core/machine-history.store';
import { planSummary } from '../../core/plan-expansion';
import { PlanDraftStore } from '../../core/plan-draft.store';
import { isActive } from '../../core/workout-status';
import { bikeOnly } from '../../core/machine-guards';
import { MotionPreference } from '../../core/motion-preference';
import { previewOf } from '../../core/ride-preview';
import { formatStart, linkError, parseStart, stepStart, videoIdOf } from '../../core/video-link';
import { type PlayerHandle, YOUTUBE_PLAYER } from '../../core/youtube-player';

type Phase = 'loading' | 'ready' | 'not-found';

/** Route `/classes/:id`: one class, its video and plan, and Start ride (L2-080). */
@Component({
  selector: 'wz-class-page',
  imports: [Alert, ClassNotFound, Icon, LevelRow, NumberStepper, RouterLink, StatusLine],
  templateUrl: './class-page.html',
  styleUrl: './class-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassPage {
  /** The route's `:id`. */
  readonly id = input.required<string>();

  private readonly classes = inject(CLASS_API);
  private readonly players = inject(YOUTUBE_PLAYER);
  private readonly title = inject(Title);
  private readonly live = inject(LiveStateService);
  private readonly workouts = inject(WORKOUT_API);
  private readonly dialogs = inject(DialogLauncher);
  private readonly history = inject(MachineHistoryStore);
  private readonly router = inject(Router);
  private readonly drafts = inject(PlanDraftStore);

  protected readonly status = liveConnectionStatus();
  protected readonly reducedMotion = inject(MotionPreference).reduced;
  protected readonly phase = signal<Phase>('loading');
  protected readonly entry = signal<ClassEntry | null>(null);
  protected readonly draft = signal<ClassDraft | null>(null);
  protected readonly busy = signal(false);
  protected readonly startFailed = signal(false);

  protected readonly preview = computed(() => {
    const d = this.draft();
    return d ? previewOf(d.plan) : null;
  });
  protected readonly rows = computed(() => {
    const d = this.draft();
    return d ? levelRows(d.plan) : [];
  });
  protected readonly lines = computed(() => {
    const d = this.draft();
    return d
      ? {
          structure: structureLine(d.plan),
          cadence: cadenceLine(d.plan),
          stretches: stretchLine(d.plan),
        }
      : null;
  });
  protected readonly videoId = computed(() => {
    const d = this.draft();
    return d ? videoIdOf(d.url) : null;
  });
  protected readonly cuedAt = computed(() => formatStart(this.draft()?.start ?? 0));
  /** The start point as typed; committed on Enter or leaving the field. */
  protected readonly startText = linkedSignal(() => this.cuedAt());
  protected readonly linkError = computed(() => {
    const d = this.draft();
    return d ? linkError({ on: true, url: d.url, start: d.start }) : null;
  });
  protected readonly edited = computed(() => {
    const d = this.draft();
    const e = this.entry();
    return !!d && !!e && isEdited(d, e);
  });
  protected readonly legendLabels = { work: 'Work', rest: 'Recover', steady: 'Steady' } as const;

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  private readonly player = signal<PlayerHandle | null>(null);

  constructor() {
    bikeOnly();
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
    // The preview: the YouTube player cued at the start point (L2-080 AC2).
    effect((onCleanup) => {
      const id = this.videoId();
      const host = this.host()?.nativeElement;
      if (!id || !host) return;
      let handle: PlayerHandle | null = null;
      let gone = false;
      onCleanup(() => {
        gone = true;
        handle?.destroy();
        this.player.set(null);
      });
      this.players
        .create(
          host,
          id,
          untracked(() => this.draft()?.start ?? 0),
        )
        .then((h) => {
          if (gone) return h.destroy();
          handle = h;
          this.player.set(h);
        })
        .catch(() => undefined);
    });
  }

  private async load(id: string): Promise<void> {
    this.phase.set('loading');
    try {
      const entry = await this.classes.get(id);
      if (entry === 'not-found') {
        this.phase.set('not-found');
        this.title.setTitle('Class not found · Wattzup');
        return;
      }
      this.entry.set(entry);
      this.draft.set(draftOf(entry));
      this.title.setTitle(`${entry.title} · Wattzup`);
      this.phase.set('ready');
    } catch {
      this.phase.set('not-found');
    }
  }

  protected stepLevel(row: LevelRowName, dir: 1 | -1): void {
    this.draft.update((d) => d && { ...d, plan: shiftLevels(d.plan, row, dir) });
  }

  protected setUrl(url: string): void {
    this.draft.update((d) => d && { ...d, url });
  }

  protected stepStart(dir: 1 | -1): void {
    this.setStart(stepStart(this.draft()?.start ?? 0, dir));
  }

  protected commitStart(): void {
    const start = parseStart(this.startText());
    if (start === null || start === this.draft()?.start) this.startText.set(this.cuedAt());
    else this.setStart(start);
  }

  /** Puts back the class's plan, link and start point (L2-080 AC9). */
  protected reset(): void {
    const e = this.entry();
    if (!e) return;
    const original = draftOf(e);
    this.draft.set(original);
    this.player()?.seek(original.start);
  }

  private setStart(start: number): void {
    this.draft.update((d) => d && { ...d, start });
    this.player()?.seek(start);
  }

  /** Start ride: replace-ride first with a workout active, else POST the plan as shown (L2-080 AC10, AC11). */
  protected async start(): Promise<void> {
    const d = this.draft();
    if (!d || this.busy()) return;
    const plan = toStartRequest(d);
    const workout = this.live.state()?.workout ?? null;
    if (isActive(workout)) {
      const started = await this.dialogs.openReplaceRide({
        plan,
        elapsed: formatDuration(workout.elapsed_seconds),
        currentSummary: workout.summary,
        newSummary: planSummary(d.plan),
      });
      if (started) {
        this.history.recordStart('bike', planSummary(d.plan), new Date());
        await this.router.navigateByUrl('/');
      }
      return;
    }
    this.busy.set(true);
    this.startFailed.set(false);
    try {
      const snapshot = await this.workouts.start(plan);
      this.history.recordStart('bike', snapshot.summary, new Date());
      await this.router.navigateByUrl('/');
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      this.startFailed.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  /** Writes this page's plan and video as setup's drafts, replacing them, and opens setup (L2-080 AC12). */
  protected openFullSetup(event: MouseEvent): void {
    const d = this.draft();
    if (
      !d ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const { plan, intervals, video } = toSetupDrafts(d);
    this.drafts.save(plan);
    if (intervals) this.drafts.saveIntervals(intervals);
    this.drafts.saveVideo(video);
    void this.router.navigateByUrl('/setup');
  }
}
