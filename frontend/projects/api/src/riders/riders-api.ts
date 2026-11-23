import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Who is signed in (Stay signed in). */
export interface RiderMe {
  readonly id: string;
  readonly displayName: string | null;
}

/**
 * The signed-in rider: `GET /api/riders/me`, which answers 401 when there is no session,
 * `PUT /api/riders/me/display-name` and `DELETE /api/riders/me`.
 */
export interface RidersApi {
  me(): Observable<RiderMe>;
  /** Saves the name other riders see; a 400 with `display_name_invalid` when it breaks the rule (L2-005 AC2). */
  setDisplayName(name: string): Observable<RiderMe>;
  /** Deletes the account: every session ends and the cookie is cleared (204, L2-006 AC3). */
  deleteMe(): Observable<void>;
}

export const RIDERS_API = new InjectionToken<RidersApi>('RIDERS_API');
