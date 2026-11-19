// The only owner of the EventSource and its reconnect logic (L2-044, L2-018, L2-054).
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  ApiKeyStore,
  type BikeState,
  type StreamMessage,
  BIKE_API,
  type StreamConnection,
} from '@wattzup/api';

export const RECONNECT_DELAY_MS = 2000;

@Injectable({ providedIn: 'root' })
export class LiveStateService {
  private readonly api = inject(BIKE_API);
  private readonly keys = inject(ApiKeyStore);

  private readonly _state = signal<BikeState | null>(null);
  private readonly _connection = signal<StreamConnection>('connecting');
  private readonly _lastStateAt = signal<Date | null>(null);
  private readonly _loadFailed = signal(false);
  private readonly _loadStatus = signal<number | null>(null);
  /** Incremented on every stream (re)open, so dependants can reload history. */
  private readonly _streamEpoch = signal(0);

  readonly state = this._state.asReadonly();
  readonly connection = this._connection.asReadonly();
  readonly lastStateAt = this._lastStateAt.asReadonly();
  readonly loadFailed = this._loadFailed.asReadonly();
  readonly loadStatus = this._loadStatus.asReadonly();
  readonly streamEpoch = this._streamEpoch.asReadonly();
  /** Kept from every state, so a page sees an error the next message already cleared. */

  private started = false;
  private locked = false;
  private source: EventSource | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private connecting = false;

  /** Loads the state and opens the stream once; later calls do nothing. */
  ensureStarted(): void {
    if (this.started) return;
    this.started = true;
    void this.load();
  }

  /** Repeats the initial GET /api/status (`Try again`). */
  reload(): void {
    void this.load();
  }

  /** Starts over, for example after the rider unlocks the server with a key. */
  restart(): void {
    this.closeSource();
    this.clearRetry();
    this.started = false;
    this.locked = false;
    this.ensureStarted();
  }

  /** Cancels the pending delay and reconnects at once (`Retry now`). */
  retryNow(): void {
    this.clearRetry();
    void this.connect();
  }

  private async load(): Promise<void> {
    try {
      const state = await this.api.status();
      this.setState(state);
      this._lastStateAt.set(new Date());
      this._loadFailed.set(false);
      this._loadStatus.set(null);
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) {
        this.locked = true;
        return;
      }
      this._loadFailed.set(true);
      this._loadStatus.set(e instanceof HttpErrorResponse ? e.status : null);
    }
    if (!this.source && !this.retryTimer) void this.connect();
  }

  private async connect(): Promise<void> {
    if (this.locked || this.connecting) return;
    this.connecting = true;
    this.closeSource();
    let url = '/api/events';
    try {
      if (this.keys.key()) {
        url += `?token=${encodeURIComponent(await this.api.eventToken())}`;
      }
    } catch {
      this.connecting = false;
      this.goOffline();
      return;
    }
    this.connecting = false;
    const source = new EventSource(url);
    this.source = source;
    source.onmessage = (event: MessageEvent<string>) => {
      if (this.source !== source) return;
      let next: StreamMessage;
      try {
        next = JSON.parse(event.data) as StreamMessage;
      } catch {
        return;
      }
      if (this._connection() !== 'open') {
        this._connection.set('open');
        this._streamEpoch.update((n) => n + 1);
      }
      this.setState(next);
      this._lastStateAt.set(new Date());
      this._loadFailed.set(false);
    };
    source.onerror = () => {
      if (this.source !== source) return;
      this.closeSource();
      this.goOffline();
    };
  }

  private setState(state: BikeState): void {
    this._state.set(state);
  }

  private goOffline(): void {
    this._connection.set('offline');
    this.clearRetry();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.connect();
    }, RECONNECT_DELAY_MS);
  }

  private closeSource(): void {
    this.source?.close();
    this.source = null;
  }

  private clearRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }
}
