import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { XpEarnedView } from '@telo/api';

const NOTES = {
  waiting: 'Recording your ride…',
  offline: 'Your XP will be added when you’re back online.',
  notRecorded: 'This ride wasn’t recorded, so it earned no XP.',
} as const;

/**
 * Results' XP panel (block xp-earned, L2-074): a region named "XP earned" with the total ("+442") and each line in the
 * order the backend returned; while the ride is recorded, waits for a network or was not recorded, a status note in its
 * place. The region is polite, so the filled panel is announced.
 */
@Component({
  selector: 'wz-xp-earned',
  templateUrl: './xp-earned.html',
  styleUrl: './xp-earned.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpEarned {
  readonly view = input.required<XpEarnedView>();

  protected readonly note = computed(() => {
    const state = this.view().state;
    return state === 'ready' ? null : NOTES[state];
  });
}
