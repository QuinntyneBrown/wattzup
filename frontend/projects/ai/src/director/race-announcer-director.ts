import type { RaceAnnouncerSnapshot, RaceCallout, RaceCalloutKind } from '@telo/api';
import { sanitizeCalloutLabel } from './callout-sanitizer';

const COOLDOWN_MS = 20_000;
const MAX_STALE_MS = 5_000;
const HISTORY_LIMIT = 64;

const PRIORITY: Record<RaceCalloutKind, number> = {
  finish: 100,
  finalSprint: 90,
  countdown: 80,
  overtake: 70,
  ghostSplit: 65,
  climb: 50,
  cadenceLock: 40,
};

const BADGE: Record<RaceCalloutKind, string> = {
  finish: 'Finish',
  finalSprint: 'Final sprint',
  countdown: 'Start',
  overtake: 'Overtake',
  ghostSplit: 'Ghost split',
  climb: 'Climb',
  cadenceLock: 'Cadence',
};

function ordinalPlace(place: number): string {
  const mod100 = place % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`;
  switch (place % 10) {
    case 1:
      return `${place}st`;
    case 2:
      return `${place}nd`;
    case 3:
      return `${place}rd`;
    default:
      return `${place}th`;
  }
}

/**
 * Pure, deterministic race callout director (L2-170, L2-173 AC4):
 * detects countdown, overtakes, climbs, 30 s cadence lock / uphill drift, ghost splits, and final
 * sprint/finish; enforces priority order, 20 s normal cooldown, 5 s stale drop, and a 64-entry
 * bounded history ring buffer.
 */
export class RaceAnnouncerDirector {
  private prev: RaceAnnouncerSnapshot | null = null;
  private lastPlayedAtMs = -Infinity;
  private sequence = 0;
  private cadenceLockedSinceMs: number | null = null;
  private cadenceLockAnnounced = false;
  private finalSprintAnnounced = false;
  private finishAnnounced = false;
  private queue: RaceCallout[] = [];
  private readonly historyRing: RaceCallout[] = [];

  get history(): readonly RaceCallout[] {
    return this.historyRing;
  }

  evaluate(snapshot: RaceAnnouncerSnapshot, nowMs: number): RaceCallout | null {
    if (snapshot.paused) {
      this.queue = [];
      this.prev = snapshot;
      return null;
    }

    const candidates = this.detectEvents(snapshot, nowMs);
    for (const candidate of candidates) {
      this.enqueue(candidate);
    }
    this.prev = snapshot;

    // Drop stale queued callouts older than 5 seconds (L2-170 AC4).
    this.queue = this.queue.filter((item) => nowMs - item.createdAtMs <= MAX_STALE_MS);
    if (this.queue.length === 0) return null;

    this.queue.sort((a, b) => b.priority - a.priority || a.createdAtMs - b.createdAtMs);
    const next = this.queue[0];

    const exemptCooldown = next.kind === 'countdown' || next.kind === 'finish';
    if (!exemptCooldown && nowMs - this.lastPlayedAtMs < COOLDOWN_MS) {
      return null;
    }

    // Consume highest-priority callout and drop superseded lower-priority events (L2-170 AC2).
    this.queue = [];
    this.lastPlayedAtMs = nowMs;
    this.recordHistory(next);
    return next;
  }

  clearPending(): void {
    this.queue = [];
  }

  reset(): void {
    this.prev = null;
    this.lastPlayedAtMs = -Infinity;
    this.cadenceLockedSinceMs = null;
    this.cadenceLockAnnounced = false;
    this.finalSprintAnnounced = false;
    this.finishAnnounced = false;
    this.queue = [];
    this.historyRing.length = 0;
  }

  private detectEvents(snapshot: RaceAnnouncerSnapshot, nowMs: number): RaceCallout[] {
    const events: RaceCallout[] = [];
    const prev = this.prev;

    // 1. Finish (L2-170 AC1)
    if (snapshot.finished && !this.finishAnnounced) {
      this.finishAnnounced = true;
      events.push(
        this.make(
          'finish',
          `Finish! You crossed the line in ${ordinalPlace(snapshot.position)} of ${snapshot.totalRiders}.`,
          nowMs,
        ),
      );
      return events;
    }

    // 2. Start countdown & launch (L2-170 AC1)
    if (
      snapshot.countdownSeconds !== null &&
      snapshot.countdownSeconds <= 3 &&
      snapshot.countdownSeconds >= 0 &&
      snapshot.countdownSeconds !== prev?.countdownSeconds
    ) {
      const text = snapshot.countdownSeconds === 0 ? 'GO!' : `${snapshot.countdownSeconds}!`;
      events.push(this.make('countdown', text, nowMs));
    }

    if (!snapshot.running) return events;

    // 3. Final sprint (L2-170 AC1)
    if (
      !this.finalSprintAnnounced &&
      (snapshot.remainingMeters <= 500 || snapshot.remainingSeconds <= 30) &&
      snapshot.remainingMeters > 0
    ) {
      this.finalSprintAnnounced = true;
      events.push(
        this.make(
          'finalSprint',
          `Final sprint! ${Math.round(snapshot.remainingMeters)} m to the line.`,
          nowMs,
        ),
      );
    }

    // 4. Position change & overtake / closing within 15 m (L2-170 AC1)
    if (prev && snapshot.position < prev.position) {
      events.push(
        this.make(
          'overtake',
          snapshot.position === 1
            ? 'You took the lead!'
            : `Overtake! Up to ${ordinalPlace(snapshot.position)} place.`,
          nowMs,
        ),
      );
    } else if (prev && snapshot.position > prev.position) {
      events.push(
        this.make('overtake', `Passed! Dropped to ${ordinalPlace(snapshot.position)}.`, nowMs),
      );
    } else if (
      snapshot.aheadName &&
      snapshot.aheadGapMeters !== null &&
      snapshot.aheadGapMeters > 0 &&
      snapshot.aheadGapMeters <= 15 &&
      (prev?.aheadGapMeters === null || prev === null || prev.aheadGapMeters > 15)
    ) {
      const name = sanitizeCalloutLabel(snapshot.aheadName);
      events.push(
        this.make(
          'overtake',
          `Closing on ${name}, ${Math.round(snapshot.aheadGapMeters)} m ahead!`,
          nowMs,
        ),
      );
    }

    // 5. Personal-best ghost split (L2-170 AC1)
    if (prev?.ghostGapMeters !== null && prev !== null && snapshot.ghostGapMeters !== null) {
      if (prev.ghostGapMeters <= 0 && snapshot.ghostGapMeters > 0) {
        events.push(
          this.make(
            'ghostSplit',
            `Ahead of your personal-best ghost by ${Math.round(snapshot.ghostGapMeters)} m!`,
            nowMs,
          ),
        );
      } else if (prev.ghostGapMeters >= 0 && snapshot.ghostGapMeters < 0) {
        events.push(
          this.make(
            'ghostSplit',
            `Personal-best ghost ahead by ${Math.abs(Math.round(snapshot.ghostGapMeters))} m.`,
            nowMs,
          ),
        );
      }
    }

    // 6. Climb & stage transition (target resistance rises by >= 3 levels) (L2-170 AC1)
    if (prev && snapshot.stageIndex !== prev.stageIndex) {
      const delta = snapshot.targetResistance - prev.targetResistance;
      const stage = sanitizeCalloutLabel(snapshot.stageTitle, 'Climb');
      if (delta >= 3) {
        events.push(
          this.make(
            'climb',
            `${stage}! Target resistance up to ${snapshot.targetResistance}, hold ${snapshot.targetCadenceRpm} rpm.`,
            nowMs,
          ),
        );
      } else if (delta <= -3) {
        events.push(
          this.make(
            'climb',
            `Crested the climb! Target resistance down to ${snapshot.targetResistance}.`,
            nowMs,
          ),
        );
      }
    }

    // 7. Stage cadence lock (within +-5 rpm for 30 s) or uphill drift (> 10 rpm under) (L2-170 AC1)
    const diff = snapshot.cadenceRpm - snapshot.targetCadenceRpm;
    if (snapshot.targetCadenceRpm > 0 && Math.abs(diff) <= 5) {
      if (this.cadenceLockedSinceMs === null) {
        this.cadenceLockedSinceMs = nowMs;
      } else if (!this.cadenceLockAnnounced && nowMs - this.cadenceLockedSinceMs >= 30_000) {
        this.cadenceLockAnnounced = true;
        events.push(
          this.make('cadenceLock', `Cadence locked at ${snapshot.targetCadenceRpm} rpm!`, nowMs),
        );
      }
    } else {
      this.cadenceLockedSinceMs = null;
      this.cadenceLockAnnounced = false;
      if (snapshot.targetResistance >= 15 && diff < -10 && snapshot.cadenceRpm > 0) {
        events.push(
          this.make(
            'cadenceLock',
            `Lift cadence toward ${snapshot.targetCadenceRpm} rpm on this climb.`,
            nowMs,
          ),
        );
      }
    }

    return events;
  }

  private enqueue(callout: RaceCallout): void {
    this.queue.push(callout);
  }

  private make(kind: RaceCalloutKind, text: string, createdAtMs: number): RaceCallout {
    this.sequence += 1;
    return {
      id: `callout-${this.sequence}`,
      kind,
      badge: BADGE[kind],
      text,
      priority: PRIORITY[kind],
      createdAtMs,
    };
  }

  private recordHistory(callout: RaceCallout): void {
    if (this.historyRing.length >= HISTORY_LIMIT) {
      this.historyRing.shift();
    }
    this.historyRing.push(callout);
  }
}
