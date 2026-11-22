import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ToastTone = 'info' | 'success';

/**
 * A toast (design-system block toast): its tone's icon, a title, a figure set in the display face and its text, and
 * × ("Dismiss"). Put it in a `wz-toast-region`, whose polite live region reads it. Who raised it closes it, on
 * `dismissed` or after its own time.
 */
@Component({
  selector: 'wz-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'toast',
    role: 'status',
    '[class.toast--info]': 'tone() === "info"',
    '[class.toast--success]': 'tone() === "success"',
  },
})
export class Toast {
  readonly tone = input<ToastTone>('info');
  readonly title = input.required<string>();
  /** A number the text starts with ("61 MB"), set in the display face. */
  readonly figure = input('');
  readonly text = input('');
  readonly dismissed = output<void>();
}
