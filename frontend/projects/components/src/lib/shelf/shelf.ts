import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A shelf of the class library: its title, tagline and count, with its cards (L2-079 AC4). */
@Component({
  selector: 'wz-shelf',
  templateUrl: './shelf.html',
  styleUrl: './shelf.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shelf {
  /** Unique within the page; labels the section. */
  readonly shelfId = input.required<string>();
  readonly title = input.required<string>();
  readonly tagline = input('');
  /** `1 class` or `<n> classes`. */
  readonly count = input.required<string>();
}
