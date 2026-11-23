import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  BLUETOOTH_SUPPORT,
  BUILD_INFO,
  CONNECTION_HISTORY,
  type Diagnostics,
  REMEMBERED_BIKE,
  RIDES_WAITING,
} from '@telo/api';
import { ResistanceController } from '../engine/resistance-controller';
import { type BrowserSource, diagnosticsFacts } from './diagnostics-facts';

/** The client hints a Chromium browser offers on `navigator.userAgentData`. */
interface UserAgentData {
  readonly brands?: readonly { readonly brand: string; readonly version: string }[];
  readonly platform?: string;
  getHighEntropyValues?(hints: string[]): Promise<{
    readonly fullVersionList?: readonly { readonly brand: string; readonly version: string }[];
    readonly platformVersion?: string;
  }>;
}

/**
 * `Diagnostics` in the browser (docs/detailed-designs/diagnostics/inspect-diagnostics): the facts from the browser,
 * Web Bluetooth, the bike link, the device's waiting rides and the build, kept current each second while the dialog
 * that provides it is open, and the last command sent where a ride's `ResistanceController` is in reach. Nothing
 * leaves the device. Its clock stops when its owner is destroyed.
 */
@Injectable()
export class BrowserDiagnostics implements Diagnostics {
  private readonly document = inject(DOCUMENT);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  private readonly rememberedBike = inject(REMEMBERED_BIKE);
  private readonly history = inject(CONNECTION_HISTORY);
  private readonly build = inject(BUILD_INFO);
  private readonly controller = inject(ResistanceController, { optional: true });
  private readonly now = signal(Date.now());
  private readonly waiting = signal<number | null>(null);
  private readonly browser = signal<BrowserSource>(this.fromNavigator());
  private readonly remembered = this.rememberedBike.get();
  private readonly lastSeen = this.rememberedBike.lastSeen();
  private readonly page = this.document.location.href;

  readonly facts = computed(() =>
    diagnosticsFacts({
      browser: this.browser(),
      support: this.support.state(),
      page: this.page,
      bike: this.connection.bike(),
      ble: this.connection.ble(),
      connectedSince: this.history.connectedSince(),
      reconnects: this.history.reconnects(),
      last: this.controller?.last() ?? null,
      remembered: this.remembered,
      lastSeen: this.lastSeen,
      waiting: this.waiting(),
      build: this.build,
      now: this.now(),
    }),
  );

  constructor() {
    const tick = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));
    inject(RIDES_WAITING)
      .oldestFirst()
      .then(
        (rides) => this.waiting.set(rides.length),
        () => this.waiting.set(null),
      );
    void this.refineBrowser();
  }

  private fromNavigator(): BrowserSource {
    const navigator = this.document.defaultView?.navigator;
    const hints = (navigator as { userAgentData?: UserAgentData } | undefined)?.userAgentData;
    return {
      userAgent: navigator?.userAgent ?? '',
      brands: hints?.brands,
      platform: hints?.platform,
    };
  }

  /** The system's version, which only the high-entropy client hints give ("macOS 14.5", not the frozen "10.15"). */
  private async refineBrowser(): Promise<void> {
    const navigator = this.document.defaultView?.navigator as
      { userAgentData?: UserAgentData } | undefined;
    try {
      const values = await navigator?.userAgentData?.getHighEntropyValues?.([
        'platformVersion',
        'fullVersionList',
      ]);
      if (values) {
        this.browser.update((source) => ({
          ...source,
          brands: values.fullVersionList ?? source.brands,
          platformVersion: values.platformVersion,
        }));
      }
    } catch {
      // The browser keeps its hints to itself: the user-agent string stands.
    }
  }
}
