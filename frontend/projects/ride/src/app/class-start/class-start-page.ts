import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BackLink,
  ClassPlan,
  ClassStartHeader,
  ClassStartVideo,
  ClassSync,
  Button,
  RideChoice,
  ClassSession,
} from '@telo/components';
import { ClassStartStore } from './class-start-store';

/**
 * Class Start at `/classes/:id` (L2-084, L2-085): the class between the library and its ride, with "← Classes" back to
 * the library, and Start class into the ride alone.
 */
@Component({
  selector: 'wz-class-start-page',
  imports: [
    ClassSession,
    RouterLink,
    BackLink,
    Button,
    ClassPlan,
    ClassStartHeader,
    ClassStartVideo,
    ClassSync,
    RideChoice,
  ],
  templateUrl: './class-start-page.html',
  styleUrl: './class-start-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClassStartStore],
})
export default class ClassStartPage {
  protected readonly store = inject(ClassStartStore);
  private readonly router = inject(Router);

  /** Start class: the class ride, alone, at once (L2-085 AC4). */
  protected start(id: string): void {
    void this.router.navigate(['/classes', id, 'ride'], { queryParams: { mode: 'solo' } });
  }

  /**
   * Opens the group ride with its session, which holds the hub connection (L2-085 AC3, L2-120 AC1). Slice 14.3 asks the
   * hub for the seat first, and offers the next session when it is refused.
   */
  protected join(id: string, sessionId: string): void {
    void this.router.navigate(['/classes', id, 'ride'], { queryParams: { session: sessionId } });
  }
}
