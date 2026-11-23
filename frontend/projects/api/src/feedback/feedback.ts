import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Bug, Improvement or Kudos (L2-116 AC2). */
export type FeedbackKind = 'bug' | 'improvement' | 'kudos';

/** One line of the ride's context: "Elapsed", "6:52 / 30:00" (L2-117 AC2). */
export interface FeedbackFact {
  readonly term: string;
  readonly value: string;
}

/** What the dialog says it attaches from the screen it opened on: its name, a summary and its facts. */
export interface FeedbackContext {
  /** "Ride". */
  readonly screen: string;
  /** "HIIT · 8 × 0:30 · Recover · 6:52 in". */
  readonly summary: string;
  readonly facts: readonly FeedbackFact[];
}

/** A bug report's diagnostics: the last 1 MB of the packet log, as JSON Lines, and the app version (L2-117 AC4). */
export interface FeedbackDiagnostics {
  readonly appVersion: string;
  readonly packetLog: string;
}

/** What `POST /api/feedback` carries; the session travels as its cookie, never in the body. */
export interface FeedbackRequest {
  readonly kind: FeedbackKind;
  readonly message: string;
  readonly context: readonly FeedbackFact[];
  readonly diagnostics: FeedbackDiagnostics | null;
}

/** The longest message the rider can send (L2-116 AC3). */
export const FEEDBACK_MAX_LENGTH = 2000;

/** Sends a rider's feedback to the team; it completes once the backend has accepted it, and errors otherwise. */
export interface FeedbackApi {
  send(request: FeedbackRequest): Observable<void>;
}

export const FEEDBACK_API = new InjectionToken<FeedbackApi>('FeedbackApi');
