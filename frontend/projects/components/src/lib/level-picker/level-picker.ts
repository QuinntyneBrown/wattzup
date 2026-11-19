import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LEVEL_RANGE, levelAtFraction, levelForKey } from './level-picker-input';

/** What a level picker shows: the lit bars, the pressed (set) level and the plan's level. */
export interface ResistanceView {
  valueText: string;
  settingText: string | null;
  litUpTo: number;
  pressedLevel: number | null;
  planLevel: number | null;
}

/**
 * One bar per level as one slider: the bike's 32 levels (L2-019, L2-020). A single Tab stop operated by arrow, Page
 * and Home/End keys, and by tapping anywhere on the bars, so the whole track is one target well
 * over 44 × 44 px (L2-041, WCAG 2.2 target size).
 */
@Component({
  selector: 'wz-level-picker',
  templateUrl: './level-picker.html',
  styleUrl: './level-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelPicker {
  readonly view = input.required<ResistanceView>();
  readonly disabled = input(false);
  readonly fieldId = input<string | null>(null);
  /** The id of the visible label; without it the slider is named `Resistance level`. */
  readonly labelledBy = input<string | null>(null);
  /** The accessible name when there is no visible label; `Resistance level` by default. */
  readonly label = input('Resistance level');
  /** Overrides the bike's `Level <n> of 32`. */
  readonly valueText = input<string | null>(null);
  readonly pick = output<number>();

  protected readonly range = computed(() => LEVEL_RANGE);
  protected readonly levels = computed(() => {
    const { min, max } = this.range();
    return Array.from({ length: max - min + 1 }, (_, i) => ({ level: min + i }));
  });
  protected readonly value = computed(() => this.view().pressedLevel);
  protected readonly text = computed(() => {
    const own = this.valueText();
    if (own !== null) return own;
    const v = this.value();
    return v === null ? 'No level yet' : `Level ${v} of 32`;
  });

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    const track = event.currentTarget as HTMLElement;
    const box = track.getBoundingClientRect();
    this.pick.emit(levelAtFraction((event.clientX - box.left) / box.width, this.range()));
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const next = levelForKey(event.key, this.value(), this.range());
    if (next === null) return;
    event.preventDefault();
    this.pick.emit(next);
  }
}
