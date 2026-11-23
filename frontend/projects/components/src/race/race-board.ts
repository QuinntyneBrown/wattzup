import {
  type AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { InlineMessage } from '../inline-message/inline-message';

/** One row of the standings board, formatted. */
export interface RaceBoardRow {
  readonly id: string;
  readonly place: number;
  readonly name: string;
  /** A design-system jersey name: `you`, `ghost`, or a bot's (`flint`). */
  readonly jersey: string;
  readonly bot: boolean;
  readonly you: boolean;
  /** "+0:07" ahead, "−0:05" behind, "DNF"; empty on the rider's row. */
  readonly gap: string;
  /** Whether the service marked the rider DNF (L2-124): the row is faint. */
  readonly dnf?: boolean;
}

/** How long a row slides to its new place (L2-060 AC3). */
const SLIDE_MS = 150;

/**
 * The standings board (design-system block race-board, docs/mocks/pages/race/): "Standings · 10 riders" or "You vs
 * your best", then every rider by place with a jersey dot, the name, a bot icon for a bot and the gap to the rider;
 * the rider's row is highlighted and `aria-current="true"` (L2-060 AC1, AC2, AC4). When places swap, a moved row slides
 * from its old place over 150 ms, and not at all with reduced motion (AC3). Shown from md (AC5).
 */
@Component({
  selector: 'wz-race-board',
  templateUrl: './race-board.html',
  styleUrl: './race-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InlineMessage],
})
export class RaceBoard implements AfterViewChecked {
  readonly heading = input.required<string>();
  readonly rows = input.required<readonly RaceBoardRow[]>();
  /** A status notice under the title, such as a lost service's (L2-126 AC1); its region stays in the page. */
  readonly notice = input<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Each row's top at the last check; at most one per rider, so it never grows past the field. */
  private tops = new Map<string, number>();
  /** The riders' order at the last measure: the rows are measured again only when it changes. */
  private order = '';

  /**
   * FLIP, after the view is updated and before it is painted: a row whose top moved since the last check starts at its
   * old place and slides to its new one. A lifecycle hook, not a render hook, keeps the initial bundle as it was. Reduced
   * motion, the rider's or the device's, zeroes the slide's token, `--duration-fast` (L2-164 AC2); it is read once a
   * row has moved.
   */
  ngAfterViewChecked(): void {
    // A row can only have moved if the order changed. Asking every row where it is makes the browser lay the page
    // out there and then, and this hook runs after every check of the view, twice a second through a race.
    const order = this.rows()
      .map((row) => row.id)
      .join(' ');
    if (order === this.order) return;
    this.order = order;
    let still: boolean | null = null;
    const tops = new Map<string, number>();
    for (const row of this.host.nativeElement.querySelectorAll<HTMLElement>('.race-board__row')) {
      const id = row.dataset['id'] ?? '';
      const top = row.offsetTop;
      const before = this.tops.get(id);
      tops.set(id, top);
      if (before === undefined || before === top) continue;
      still ??= !(parseFloat(getComputedStyle(row).getPropertyValue('--duration-fast')) > 0);
      if (still) continue;
      row.animate([{ translate: `0 ${before - top}px` }, { translate: '0 0' }], {
        duration: SLIDE_MS,
        easing: 'ease-out',
      });
    }
    this.tops = tops;
  }
}
