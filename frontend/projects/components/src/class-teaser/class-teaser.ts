import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The featured class in Home's Classes door (block class-teaser, L2-035 AC2): its cover with its length, its title, and
 * the page's actions in the `actions` slot.
 */
@Component({
  selector: 'wz-class-teaser',
  templateUrl: './class-teaser.html',
  styleUrl: './class-teaser.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassTeaser {
  readonly title = input.required<string>();
  /** "30:00". */
  readonly length = input.required<string>();
  readonly coverUrl = input.required<string>();
}
