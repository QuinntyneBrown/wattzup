import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A shelf of the Class Library (design-system block class-shelf): its title and tagline over a hairline, and its class
 * cards, projected, in a grid of one column on a phone, two at sm and three at lg (L2-081 AC3, AC5).
 */
@Component({
  selector: 'wz-class-shelf',
  templateUrl: './class-shelf.html',
  styleUrl: './class-shelf.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassShelf {
  readonly shelfId = input.required<string>();
  readonly title = input.required<string>();
  readonly tagline = input.required<string>();
}
