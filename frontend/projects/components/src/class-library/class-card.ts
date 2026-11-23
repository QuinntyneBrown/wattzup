import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment } from '@telo/api';
import { formatClock } from '../metric/format-clock';
import { ClassProfile } from './class-profile';

/**
 * A class card of the Class Library (design-system block class-card): the cover with the class's length, its resistance
 * profile, its title and "{channel} · {focus}" (L2-081 AC4). The page puts it on a link to the class's Class Start when
 * it is open; locked, on a button that stays focusable with `aria-disabled="true"`, a lock and "Opens at level {n}" in
 * its name (L2-082 AC2). An open card shows its next group session's chip, "Group in 6 min · 5/10" (L2-083 AC2), and
 * none while group sessions cannot be read (L2-081 AC6).
 */
@Component({
  selector: 'a[wz-class-card], button[wz-class-card]',
  imports: [ClassProfile],
  templateUrl: './class-card.html',
  styleUrl: './class-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'class-card',
    '[class.class-card--locked]': 'opensAtLevel() !== null',
    '[attr.aria-disabled]': "opensAtLevel() === null ? null : 'true'",
  },
})
export class ClassCard {
  readonly title = input.required<string>();
  readonly channel = input.required<string>();
  readonly focus = input.required<string>();
  readonly cover = input.required<string>();
  readonly lengthSeconds = input.required<number>();
  readonly segments = input.required<readonly Segment[]>();
  /** The rider level the class opens at while it is locked; null when it is open. */
  readonly opensAtLevel = input<number | null>(null);
  /** The next group session's chip, "Group in 6 min · 5/10"; null for none. A locked card shows none. */
  readonly group = input<string | null>(null);

  protected readonly time = computed(() => formatClock(this.lengthSeconds()));
}
