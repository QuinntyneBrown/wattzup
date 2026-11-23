import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant =
  'default' | 'primary' | 'raised' | 'outline' | 'danger' | 'gold' | 'light' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * A button or a link drawn as one (design-system block btn). Put it on the native element so the element keeps its
 * own role and keyboard behaviour: `<a wz-button variant="primary" size="lg" routerLink="/">`.
 */
@Component({
  selector: 'a[wz-button], button[wz-button]',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn',
    '[class.btn--primary]': 'variant() === "primary"',
    '[class.btn--raised]': 'variant() === "raised"',
    '[class.btn--outline]': 'variant() === "outline"',
    '[class.btn--danger]': 'variant() === "danger"',
    '[class.btn--gold]': 'variant() === "gold"',
    '[class.btn--light]': 'variant() === "light"',
    '[class.btn--quiet]': 'variant() === "quiet"',
    '[class.btn--sm]': 'size() === "sm"',
    '[class.btn--lg]': 'size() === "lg"',
    '[class.btn--xl]': 'size() === "xl"',
    '[class.btn--block]': 'block()',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('md');
  /** Fills the width of its container. */
  readonly block = input(false);
}
