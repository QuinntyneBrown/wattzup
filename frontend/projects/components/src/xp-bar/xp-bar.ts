import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The XP bar (block xp-bar, docs/design-system/): a gold fill on a raised track, filled to `fillPercent` (0 to 100) through
 * `--value`. Beside text that names the XP (the header's level) it carries no label; given a `label` it is an image named
 * by it ("1,840 of 2,600 XP", Profile, L2-109 AC1). `lg` is Profile's taller bar.
 */
@Component({
  selector: 'wz-xp-bar',
  templateUrl: './xp-bar.html',
  styleUrl: './xp-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'xp-bar',
    '[class.xp-bar--lg]': "size() === 'lg'",
    '[style.--value]': 'value()',
    '[attr.role]': "label() ? 'img' : null",
    '[attr.aria-label]': 'label()',
  },
})
export class XpBar {
  readonly fillPercent = input.required<number>();
  readonly label = input<string | null>(null);
  readonly size = input<'md' | 'lg'>('md');

  protected readonly value = computed(() => `${this.fillPercent()}%`);
}
