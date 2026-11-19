import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DialogLauncher } from '../../core/dialog-launcher';
import { formatDuration } from '../../core/format-duration';
import { type StartPlan, WORKOUT_API } from '@wattzup/api';
import { planVideo } from '../../core/video-link';
import { LiveStateService } from '../../core/live-state.service';
import { liveConnectionStatus } from '../../core/connection-status';
import { MotionPreference } from '../../core/motion-preference';
import { planSummary } from '../../core/plan-expansion';
import { PlanDraftStore } from '../../core/plan-draft.store';
import {
  INTERVAL_PRESETS,
  type IntervalPresetId,
  type StretchKind,
  addSet,
  applyIntervalPreset,
  moveSet,
  removeSet,
  replaceSet,
  setStretch,
  toIntervalsPlan,
  setListView,
  validateIntervals,
} from '../../core/intervals-form';
import {
  type DraftField,
  type PlanDraft,
  type PresetId,
  PRESETS,
  applyPreset,
  editDraft,
  stepDraft,
  toPlan,
  validateDraft,
} from '../../core/plan-form';
import { type RidePreview as Preview, previewOf, withVideoRow } from '../../core/ride-preview';
import { isActive } from '../../core/workout-status';
import {
  Alert,
  FormSummary,
  Icon,
  Slider,
  RadioGroup,
  NumberStepper,
  type PresetChip,
  Presets,
  Switch,
  SetList,
  RideProfile,
  StatusLine,
} from '@wattzup/components';
import { VideoLink } from '../video-link/video-link';

/** The input id of each draft field; the form summary links to them. */
export const FIELD_IDS: Record<DraftField, string> = {
  rounds: 'rounds',
  work: 'work',
  rest: 'rest',
  workLevel: 'work-level',
  restLevel: 'rest-level',
  flatLevel: 'flat-level',
  minutes: 'duration',
  cadence: 'cadence',
};

type StartError = { kind: 'invalid'; messages: string[] } | { kind: 'failed' };

/** Route `/setup`: build a plan and start it (L2-029, L2-052, L2-059). */
@Component({
  selector: 'wz-setup-page',
  imports: [
    Alert,
    FormSummary,
    Icon,
    Slider,
    RadioGroup,
    NumberStepper,
    Presets,
    RideProfile,
    RouterLink,
    SetList,
    StatusLine,
    Switch,
    VideoLink,
  ],
  templateUrl: './setup-page.html',
  styleUrl: './setup-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupPage {
  private readonly live = inject(LiveStateService);
  private readonly store = inject(PlanDraftStore);
  private readonly workouts = inject(WORKOUT_API);
  private readonly dialogs = inject(DialogLauncher);
  private readonly router = inject(Router);
  protected readonly status = liveConnectionStatus();
  protected readonly reducedMotion = inject(MotionPreference).reduced;
  private readonly summary = viewChild(FormSummary);

  protected readonly ids = FIELD_IDS;
  protected readonly draft = signal<PlanDraft>(this.store.load());
  protected readonly idraft = signal(this.store.loadIntervals());
  protected readonly vdraft = signal(this.store.loadVideo());
  /** The Intervals mode (L2-029 AC10). */
  protected readonly intervals = computed(() => this.draft().mode === 'intervals');
  protected readonly setList = computed(() => setListView(this.idraft()));
  protected readonly ierrors = computed(() => validateIntervals(this.idraft()));
  protected readonly errors = computed(() => validateDraft(this.draft()));
  protected readonly errorFor = computed(() => {
    const map: Partial<Record<DraftField, string>> = {};
    for (const e of this.errors()) map[e.field] = e.message;
    return map;
  });
  protected readonly links = computed(() =>
    this.intervals()
      ? this.ierrors().map((e) => ({ fieldId: 'add-set', text: e.link }))
      : this.errors().map((e) => ({ fieldId: FIELD_IDS[e.field], text: e.link })),
  );
  private readonly plan = computed(() =>
    this.intervals() ? toIntervalsPlan(this.idraft()) : toPlan(this.draft()),
  );
  /** The preview of the last valid plan, kept while the form is invalid. */
  private readonly preview = computed(() => {
    const plan = this.plan();
    return plan ? previewOf(plan) : null;
  });
  protected readonly shownPreview = linkedSignal<Preview | null, Preview | null>({
    source: this.preview,
    computation: (next, previous) => next ?? previous?.value ?? null,
  });

  /** The shown preview with the `Video` row while the plan carries a video (L2-059 AC6). */
  protected readonly previewWithVideo = computed(() =>
    withVideoRow(this.shownPreview(), planVideo(this.vdraft())?.start_seconds ?? null),
  );

  protected readonly bikeChips = computed<PresetChip[]>(() =>
    PRESETS.map((p) => ({ id: p.id, label: p.label, pressed: this.draft().preset === p.id })),
  );
  protected readonly intervalChips = computed<PresetChip[]>(() =>
    INTERVAL_PRESETS.map((p) => ({
      id: p.id,
      label: p.label,
      pressed: this.idraft().preset === p.id,
    })),
  );
  /** `Fix the <n> fields marked in red to start.` */
  protected readonly startHint = computed(() => {
    const n = this.links().length;
    return `Fix the ${n} ${n === 1 ? 'field' : 'fields'} marked in red to start.`;
  });

  protected readonly loading = computed(() => !this.live.state() && !this.live.loadFailed());
  protected readonly busy = signal(false);
  protected readonly startError = signal<StartError | null>(null);

  constructor() {
    this.live.ensureStarted();
  }

  protected setMode(mode: 'hiit' | 'intervals' | 'flat'): void {
    this.draft.update((d) => editDraft(d, { mode }));
  }

  /** Edit set <i>: the dialog's saved set replaces it (L2-029 AC13). */
  protected async editSet(i: number): Promise<void> {
    const set = await this.dialogs.openEditSet({
      title: `Edit set ${i + 1}`,
      set: this.idraft().sets[i],
    });
    if (set) this.idraft.update((d) => replaceSet(d, i, set));
  }

  /** Add set: a copy of the last set, edited in the dialog before it is added (L2-029 AC12). */
  protected async addSet(): Promise<void> {
    const sets = this.idraft().sets;
    const set = await this.dialogs.openEditSet({ title: 'Add set', set: sets[sets.length - 1] });
    if (set) this.idraft.update((d) => addSet(d, set));
  }

  protected async editStretch(kind: StretchKind): Promise<void> {
    const stretch = await this.dialogs.openEditStretch({ kind, stretch: this.idraft()[kind] });
    if (stretch) this.idraft.update((d) => setStretch(d, kind, stretch));
  }

  protected toggleStretch(kind: StretchKind, on: boolean): void {
    this.idraft.update((d) => setStretch(d, kind, { ...d[kind], on }));
  }

  protected moveSet(index: number, dir: 1 | -1): void {
    this.idraft.update((d) => moveSet(d, index, dir));
  }

  protected removeSet(index: number): void {
    this.idraft.update((d) => removeSet(d, index));
  }

  protected edit(change: Partial<PlanDraft>): void {
    this.draft.update((d) => editDraft(d, change));
  }

  protected preset(id: string): void {
    if (this.intervals()) {
      this.idraft.update((d) => applyIntervalPreset(d, id as IntervalPresetId));
    } else this.draft.update((d) => applyPreset(d, id as PresetId));
  }

  protected step(field: DraftField, dir: 1 | -1): void {
    this.draft.update((d) => stepDraft(d, field, dir));
  }

  protected focusSummary(): void {
    this.summary()?.focus();
  }

  protected async start(): Promise<void> {
    const shape = this.plan();
    if (!shape || this.busy()) return;
    const plan: StartPlan = { ...shape, video: planVideo(this.vdraft()) };
    this.store.saveVideo(this.vdraft());
    this.store.save(this.draft());
    if (this.intervals()) this.store.saveIntervals(this.idraft());
    const workout = this.live.state()?.workout ?? null;
    if (isActive(workout) && workout) {
      const started = await this.dialogs.openReplaceRide({
        plan,
        elapsed: formatDuration(workout.elapsed_seconds),
        currentSummary: workout.summary,
        newSummary: planSummary(shape),
      });
      if (started) await this.router.navigateByUrl('/');
      return;
    }
    this.busy.set(true);
    this.startError.set(null);
    try {
      await this.workouts.start(plan);
      await this.router.navigateByUrl('/');
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      const errors = e instanceof HttpErrorResponse && e.status === 400 ? problemErrors(e) : null;
      this.startError.set(errors ? { kind: 'invalid', messages: errors } : { kind: 'failed' });
    } finally {
      this.busy.set(false);
    }
  }
}

/** The messages of a ProblemDetails `errors` map, in order. */
function problemErrors(e: HttpErrorResponse): string[] {
  const body = e.error as { errors?: Record<string, string[]>; detail?: string } | null;
  const messages = Object.values(body?.errors ?? {}).flat();
  return messages.length ? messages : [body?.detail ?? 'The plan was not accepted.'];
}
