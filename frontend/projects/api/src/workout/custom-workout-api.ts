import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CustomWorkoutDraft } from './custom-workout';
import type { Plan } from './plan';

/** The rider's custom workout on their account (docs/detailed-designs/custom-workout/ride-a-custom-workout). */
export interface CustomWorkoutApi {
  /**
   * The settings last saved, as the backend kept them (L2-094 AC3); `null` with none saved or when the backend cannot
   * be reached, so Custom workout opens on GCN 30-min HIIT. They are checked before use.
   */
  load(): Observable<unknown>;
  /** Saves the workout Start ride rides and the plan it expands to (L2-099 AC4). */
  save(draft: CustomWorkoutDraft, plan: Plan): Observable<void>;
}

export const CUSTOM_WORKOUT_API = new InjectionToken<CustomWorkoutApi>('CUSTOM_WORKOUT_API');
