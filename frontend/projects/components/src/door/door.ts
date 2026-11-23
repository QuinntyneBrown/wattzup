import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One of Home's two doors (block door, L2-034, L2-035): a section named by its heading, with the page's link to the full
 * list in the `link` slot, a one-line summary in the `summary` slot, and the door's content below.
 */
@Component({
  selector: 'wz-door',
  templateUrl: './door.html',
  styleUrl: './door.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Door {
  readonly heading = input.required<string>();
  /** The heading's id, which names the section. */
  readonly headingId = input.required<string>();
}
