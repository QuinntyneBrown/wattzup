import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
} from '@angular/core';

/** One rider on the group board: place, name, jersey token suffix (`nova` reads `--jersey-nova`) and output in kJ. */
export interface ClassBoardRow {
  readonly position: number;
  readonly name: string;
  readonly jersey: string;
  readonly kj: number;
  readonly you: boolean;
}

/**
 * The group output board (design-system block class-board, L2-090 AC1): "Output" with the rider's place over the
 * field, then every rider by output, highest first, the rider's own row marked `aria-current="true"`. When the order
 * changes each row slides from where it was over `--duration-fast` (150 ms, none under reduced motion, AC2). It only
 * draws what it is given.
 */
@Component({
  selector: 'wz-class-board',
  templateUrl: './class-board.html',
  styleUrl: './class-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassBoard {
  /** The rider's place, "5th"; `null` while they are not on the board. */
  readonly place = input<string | null>(null);
  readonly total = input.required<number>();
  readonly rows = input.required<readonly ClassBoardRow[]>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Where each rider's row was drawn last, by jersey, for the slide. */
  private readonly tops = new Map<string, number>();

  constructor() {
    afterRenderEffect(() => {
      this.rows();
      this.slide();
    });
  }

  /** Slides each row that moved from its last place to its new one (FLIP). */
  private slide(): void {
    const host = this.host.nativeElement;
    const duration = parseFloat(getComputedStyle(host).getPropertyValue('--duration-fast')) || 0;
    const seen = new Set<string>();
    for (const row of host.querySelectorAll<HTMLElement>('.class-board-row')) {
      const key = row.dataset['jersey'] ?? '';
      seen.add(key);
      const top = row.offsetTop;
      const was = this.tops.get(key);
      this.tops.set(key, top);
      if (was === undefined || was === top || duration <= 0 || typeof row.animate !== 'function')
        continue;
      row.animate([{ transform: `translateY(${was - top}px)` }, { transform: 'none' }], {
        duration,
        easing: 'ease-out',
      });
    }
    for (const key of [...this.tops.keys()]) if (!seen.has(key)) this.tops.delete(key);
  }
}
