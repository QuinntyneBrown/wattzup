import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '@wattzup/components';

/** `We can't find that class` in place of the class page (L2-080 criterion 13). */
@Component({
  selector: 'wz-class-not-found',
  imports: [Icon, RouterLink],
  templateUrl: './class-not-found.html',
  styleUrl: './class-not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassNotFound {}
