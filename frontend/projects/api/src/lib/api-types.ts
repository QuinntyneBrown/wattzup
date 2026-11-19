// The one module that names the generated OpenAPI types (src/app/api/schema.d.ts, written by
// `npm run generate:api`). If the generated schema names change, only these aliases change.
import type { components } from '../generated/schema';

type Schemas = components['schemas'];

export type BikeState = Schemas['BikeState'];
/** A message on /api/events: the state plus the server's send time (not part of BikeState). */
export type StreamMessage = BikeState & { ts?: number };
export type WorkoutSnapshot = Schemas['WorkoutSnapshot'];
export type Segment = Schemas['Segment'];
export type SegmentKind = Segment['kind'];
export type WorkoutStatus = WorkoutSnapshot['status'];
export type CommandEntry = Schemas['CommandEntry'];
export type HiitPlan = Schemas['WorkoutPlanHiitPlan'];
export type FlatPlan = Schemas['WorkoutPlanFlatPlan'];
export type IntervalsPlan = Schemas['WorkoutPlanIntervalsPlan'];
export type IntervalSet = Schemas['IntervalSet'];
export type Stretch = Schemas['Stretch'];
export type WorkoutPlan = Schemas['WorkoutPlan'];
export type RideVideo = Schemas['RideVideo'];
export type RideVideoLink = Schemas['RideVideoLink'];
/**
 * A plan as `POST /api/workout` takes it: its `video` is a link and a start point (L2-010 AC14),
 * and `class_id` names the class it was started from, for the session (L2-081 AC7).
 */
export type StartPlan = WorkoutPlan extends infer P
  ? P extends WorkoutPlan
    ? Omit<P, 'video'> & { video: RideVideoLink | null; class_id?: string }
    : never
  : never;
export type PowerTrace = Schemas['PowerTrace'];
export type RecentPackets = Schemas['RecentPackets'];
export type EventToken = Schemas['EventToken'];
export type HealthReport = Schemas['HealthReport'];
export type ProblemDetails = Schemas['ProblemDetails'];
export type ValidationProblemDetails = Schemas['HttpValidationProblemDetails'];
export type SetResistanceRequest = Schemas['SetResistanceRequest'];
export type ResistanceSent = Schemas['ResistanceSent'];
export type WorkoutStarted = Schemas['WorkoutStarted'];
export type WorkoutStopped = Schemas['WorkoutStopped'];
export type WorkoutChanged = Schemas['WorkoutChanged'];
export type ClassCatalogue = Schemas['ClassCatalogueResponse'];
export type ClassShelf = Schemas['ClassShelfResponse'];
export type ClassEntry = Schemas['ClassResponse'];
export type ShelfRef = Schemas['ShelfRef'];
export type SessionSummary = Schemas['SessionSummary'];
export type SessionDetail = Schemas['SessionDetail'];
export type SessionList = Schemas['SessionList'];
export type Dip = Schemas['Dip'];
export type ProgressReport = Schemas['ProgressReport'];
export type StreakFigures = Schemas['StreakFigures'];
export type ClassAttempts = Schemas['ClassAttempts'];
export type AchievementFigures = Schemas['AchievementFigures'];
