import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The ride header's workout link (design-system element ride-header__link, L2-101 AC3): the sliders icon before the
 * page's words, which name the workout and end in the hidden "— edit workout".
 */
@Component({
  selector: 'a[wz-ride-workout-link]',
  templateUrl: './ride-workout-link.html',
  styleUrl: './ride-workout-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-header__link' },
})
export class RideWorkoutLink {}
