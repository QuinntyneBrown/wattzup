// Success and slow-confirm toasts for manual resistance commands (L2-048).
import { Injectable, effect, inject } from '@angular/core';
import type { BikeState, CommandEntry } from '@wattzup/api';
import { LiveStateService } from './live-state.service';
import { ToastService } from './toast.service';

export const SLOW_CONFIRM_MS = 5000;

interface Watched {
  status: CommandEntry['status'];
  timer: ReturnType<typeof setTimeout> | null;
  warning: number | null;
}

@Injectable({ providedIn: 'root' })
export class CommandFeedbackService {
  private readonly live = inject(LiveStateService);
  private readonly toasts = inject(ToastService);
  private readonly watched = new Map<string, Watched>();
  private primed = false;
  private latest: BikeState | null = null;

  constructor() {
    effect(() => {
      const state = this.live.state();
      if (state) this.observe(state);
    });
  }

  /** Called once by the dashboard so the effect is created. */
  start(): void {
    /* constructing the service starts it */
  }

  private observe(state: BikeState): void {
    this.latest = state;
    const manual = state.commands.filter((c) => c.source === 'manual');
    for (const entry of manual) {
      const key = `${entry.at}|${entry.level}`;
      const seen = this.watched.get(key);
      if (!seen) {
        const w: Watched = { status: entry.status, timer: null, warning: null };
        this.watched.set(key, w);
        if (!this.primed) continue;
        if (entry.status === 'sending')
          w.timer = setTimeout(() => this.slow(key, entry.level), SLOW_CONFIRM_MS);
        else if (entry.status === 'ack') this.confirmed(entry, state);
        continue;
      }
      if (seen.status === entry.status) continue;
      const was = seen.status;
      seen.status = entry.status;
      if (was !== 'sending') continue;
      this.settle(seen);
      if (entry.status === 'ack') this.confirmed(entry, state);
    }
    this.primed = true;
  }

  private slow(key: string, level: number): void {
    const w = this.watched.get(key);
    if (!w || w.status !== 'sending') return;
    w.timer = null;
    w.warning = this.toasts.show({
      tone: 'warning',
      title: 'Bike is slow to confirm',
      text: `Still setting level ${level} — Wattzup resends every 5 seconds until the bike reports it.`,
    });
  }

  private settle(w: Watched): void {
    if (w.timer) clearTimeout(w.timer);
    w.timer = null;
    if (w.warning !== null) this.toasts.dismiss(w.warning);
    w.warning = null;
  }

  private confirmed(entry: CommandEntry, state: BikeState): void {
    const bike = state.device_label ?? this.latest?.device_label ?? 'The bike';
    this.toasts.show({
      tone: 'success',
      title: `Resistance set to ${entry.level}`,
      text: `${bike} confirmed level ${entry.level} in ${entry.ack_ms} ms.`,
    });
  }
}
