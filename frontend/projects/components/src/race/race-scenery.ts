import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import type { RealPlace, SceneryState } from '@telo/api';

/**
 * The race's offer to stream the real place a map follows as photorealistic 3D Tiles (design-system block
 * race-scenery, docs/mocks/pages/race/default, scenery-streaming, scenery-refused; L2-066): "Ride the real Bruges ·
 * Steenstraat to the Markt", a field for the rider's Google Maps Platform key and "Stream it", disabled while the
 * field is empty (AC1, AC2). Told `refused`, it marks the field invalid and says so (AC4); told `streaming`, it reads
 * "Streaming the real Bruges · …" over Google's attribution (AC7). The key is data, shown only in the field.
 */
@Component({
  selector: 'wz-race-scenery',
  templateUrl: './race-scenery.html',
  styleUrl: './race-scenery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceScenery {
  readonly place = input.required<RealPlace>();
  /** The key this device holds, which the field starts with (AC8). */
  readonly key = input('');
  readonly state = input<SceneryState | null>(null);
  /** The rider pressed "Stream it" with this key, trimmed. */
  readonly streamKey = output<string>();

  protected readonly value = linkedSignal(() => this.key());
  protected readonly empty = computed(() => this.value().trim() === '');
  protected readonly refused = computed(() => this.state()?.status === 'refused');
  protected readonly credit = computed(() => {
    const state = this.state();
    return state?.status === 'streaming' ? state.credit : null;
  });

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.empty()) this.streamKey.emit(this.value().trim());
  }
}
