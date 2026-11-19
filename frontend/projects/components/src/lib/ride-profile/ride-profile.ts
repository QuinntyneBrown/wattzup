import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProfileTone = 'is-work' | 'is-rest' | 'is-easy';

export interface ProfileBar {
  x: number;
  width: number;
  y: number;
  height: number;
  tone: ProfileTone;
}

export interface SummaryRow {
  term: string;
  value: string;
}

/** What the panel shows. */
export interface RidePreview {
  totalSeconds: number;
  total: string;
  structure: string;
  timeUnderLoad: string | null;
  profileLabel: string;
  profile: ProfileBar[];
  /** The profile's view box height: one unit per level, 32. */
  profileHeight: number;
  rows: SummaryRow[];
  legend: ('work' | 'rest' | 'steady')[];
}

/** The Your ride panel's total, profile, summary and legend (L2-059). */
@Component({
  selector: 'wz-ride-profile',
  templateUrl: './ride-profile.html',
  styleUrl: './ride-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideProfile {
  /** The last valid preview; kept while the form is invalid. */
  readonly preview = input<RidePreview | null>(null);
  readonly valid = input(true);
  protected readonly total = computed(() => (this.valid() ? (this.preview()?.total ?? '—') : '—'));
  protected readonly legendLabels = { work: 'Work', rest: 'Recover', steady: 'Steady' } as const;
}
