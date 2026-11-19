import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'bluetooth'
  | 'bluetooth-scan'
  | 'bluetooth-off'
  | 'wifi-off'
  | 'minus'
  | 'plus'
  | 'stop'
  | 'pause'
  | 'play'
  | 'link'
  | 'arrow-left'
  | 'reset'
  | 'activity'
  | 'sliders'
  | 'close'
  | 'bell'
  | 'bell-off'
  | 'sun'
  | 'moon'
  | 'alert-circle'
  | 'info'
  | 'check-circle'
  | 'warning'
  | 'refresh'
  | 'copy'
  | 'key'
  | 'flag'
  | 'bike'
  | 'target'
  | 'edit'
  | 'chevron-up'
  | 'chevron-down'
  | 'trash'
  | 'trophy'
  | 'search'
  | 'chevron-right'
  | 'trending-up'
  | 'grid';

/** The mocks' stroke icons, always decorative (`aria-hidden`). */
@Component({
  selector: 'wz-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly spin = input(false);
}
