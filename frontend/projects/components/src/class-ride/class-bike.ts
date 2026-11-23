import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The bike panel under the video (design-system block class-bike): two columns on a phone, one row of four from md
 * (L2-089 AC5). It lays out the segment card, the stats and the stepper the page projects into it.
 */
@Component({
  selector: 'wz-class-bike',
  templateUrl: './class-bike.html',
  styleUrl: './class-bike.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassBike {}
