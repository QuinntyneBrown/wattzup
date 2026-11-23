import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

/** One length tab: the shelf id it shows ('all' for every shelf) and its label. */
export interface TierTab {
  readonly id: string;
  readonly label: string;
}

/**
 * The "Class length" tab list of the Class Library (design-system block tier-tabs; WAI-ARIA tabs with automatic
 * activation): the chosen tab carries `aria-selected="true"` and is the only one in the tab order; the arrow keys, Home
 * and End move to another tab and choose it (L2-081 AC2). It names the panel it controls.
 */
@Component({
  selector: 'wz-tier-tabs',
  templateUrl: './tier-tabs.html',
  styleUrl: './tier-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierTabs {
  readonly tabs = input.required<readonly TierTab[]>();
  readonly selected = input.required<string>();
  /** The id of the panel the tabs show. */
  readonly controls = input.required<string>();
  readonly choose = output<string>();

  // The tabs are found in the host rather than by viewChildren, whose code would join the initial bundle (AGENTS.md).
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected move(event: KeyboardEvent, index: number): void {
    const last = this.tabs().length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    this.choose.emit(this.tabs()[next].id);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
}
