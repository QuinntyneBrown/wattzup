/// <reference types="web-bluetooth" />
import { DOCUMENT, Injectable, type OnDestroy, inject, signal } from '@angular/core';
import type { BluetoothSupport, BluetoothSupportState } from '@telo/api';

/**
 * Reads whether this browser and page can reach the bike. The secure context comes first: on a plain `http` page a
 * Chromium browser has no `navigator.bluetooth` either, and the fix there is the HTTPS page, not another browser.
 * Then the radio: `getAvailability()` resolving `false` means Bluetooth is off (L2-018), and `availabilitychanged`
 * keeps the state current until the route that provides this is left.
 */
@Injectable()
export class WebBluetoothSupport implements BluetoothSupport, OnDestroy {
  private readonly window = inject(DOCUMENT).defaultView as Window;
  private readonly current = signal(this.read());
  private readonly bluetooth = this.current() === 'ready' ? this.window.navigator.bluetooth : null;
  private readonly onAvailability = (event: Event): void =>
    this.current.set(
      (event as Event & { value?: boolean }).value === false ? 'adapter-off' : this.read(),
    );

  readonly state = this.current.asReadonly();

  constructor() {
    this.bluetooth?.addEventListener('availabilitychanged', this.onAvailability);
    void this.recheck();
  }

  async recheck(): Promise<BluetoothSupportState> {
    const state = this.read();
    this.current.set(state === 'ready' && !(await this.available()) ? 'adapter-off' : state);
    return this.current();
  }

  secureUrl(): string {
    const { host, pathname, search, hash } = this.window.location;
    return `https://${host}${pathname}${search}${hash}`;
  }

  ngOnDestroy(): void {
    this.bluetooth?.removeEventListener('availabilitychanged', this.onAvailability);
  }

  private read(): BluetoothSupportState {
    if (!this.window.isSecureContext) return 'insecure-context';
    if (!('bluetooth' in this.window.navigator)) return 'unsupported-browser';
    return 'ready';
  }

  /** A browser without `getAvailability()`, or one that fails to answer, counts as on. */
  private async available(): Promise<boolean> {
    const bluetooth = this.window.navigator.bluetooth;
    if (typeof bluetooth?.getAvailability !== 'function') return true;
    try {
      return await bluetooth.getAvailability();
    } catch {
      return true;
    }
  }
}
