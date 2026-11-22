import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BIKE_CONNECTION,
  BLUETOOTH_SUPPORT,
  GRAPHICS_SUPPORT,
  type GraphicsApi,
  REMEMBERED_BIKE,
  RIDE_SETTINGS,
} from '@telo/api';
import {
  BackLink,
  Banner,
  DeviceCheck,
  Pill,
  Setting,
  SettingRow,
  SettingsReset,
  SettingsSection,
  SideNav,
  SideNavLink,
  type SideNavIcon,
  SwitchRow,
  WorldSettings,
} from '@telo/components';
import { deviceCheckResult, deviceCheckRunning } from '@telo/domain';
import { bikeRow } from '../profile/bike-row';
import { DeviceCheckStore } from './device-check-store';

/**
 * Settings at `/settings` (docs/mocks/pages/settings/, L2-158): its five sections and their nav, each control
 * applying at once through `RIDE_SETTINGS` with no Save, Reset to recommended, and the warning when the browser
 * refuses to keep anything. Opened at a section (`/settings#world`), it shows that section. Slice 20.1 builds the
 * page and its first control, Keep the screen awake; slice 20.2 the World controls; slice 20.3 Check this device;
 * slices 20.4 and 20.5 fill the rest.
 */
@Component({
  selector: 'wz-settings-page',
  imports: [
    RouterLink,
    BackLink,
    Banner,
    DeviceCheck,
    Pill,
    Setting,
    SettingRow,
    SettingsReset,
    SettingsSection,
    SideNav,
    SideNavLink,
    SwitchRow,
    WorldSettings,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  providers: [DeviceCheckStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsPage {
  protected readonly store = inject(RIDE_SETTINGS);
  private readonly injector = inject(Injector);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);

  /**
   * What a screen reader hears after a change it cannot see (L2-158 AC6), through the page's own polite status region:
   * CDK's LiveAnnouncer would bring Angular's HTML sanitizer into the initial bundle (AGENTS.md, lazy loading first).
   */
  protected readonly announcement = signal('');
  protected readonly settings = this.store.settings;
  protected readonly persisted = this.store.persisted;
  /** What this browser draws worlds with, for the World section (L2-159 AC1, L2-161). */
  protected readonly graphicsApi = inject(GRAPHICS_SUPPORT).api;
  protected readonly apiName: Record<GraphicsApi, string> = {
    webgpu: 'WebGPU',
    webgl2: 'WebGL 2',
    none: 'Panorama only',
  };
  /** "Check this device": running, or what it found on this device (L2-162 AC2, AC3). */
  protected readonly deviceCheck = inject(DeviceCheckStore);
  protected readonly checkRunning = computed(() => {
    const progress = this.deviceCheck.progress();
    return progress && { ...deviceCheckRunning(progress), percent: progress.percent };
  });
  protected readonly checkResult = computed(() => {
    const result = this.settings().deviceCheck;
    return result && deviceCheckResult(result, new Date());
  });

  protected readonly sections: readonly { name: string; heading: string; icon: SideNavIcon }[] = [
    { name: 'world', heading: 'World', icon: 'world' },
    { name: 'sound', heading: 'Sound', icon: 'sound' },
    { name: 'display', heading: 'Motion and display', icon: 'display' },
    { name: 'bike', heading: 'Bike', icon: 'bike' },
    { name: 'device', heading: 'This device', icon: 'device' },
  ];

  /** The Bike section's row, as Profile's (L2-112 AC1, AC2); Diagnostics takes its place in slice 25.1. */
  protected readonly bike = computed(() =>
    bikeRow(
      this.connection.ble(),
      this.support.state(),
      (this.connection.bike() ?? this.remembered)?.name ?? null,
    ),
  );

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    // Shows the section the address names, on opening and from the section nav.
    afterRenderEffect(() => {
      const name = this.fragment();
      if (name) host.querySelector(`#${CSS.escape(name)}`)?.scrollIntoView();
    });
  }

  protected setKeepAwake(on: boolean): void {
    this.store.set('keepAwake', on);
  }

  protected reset(): void {
    this.store.reset();
    // Emptied first, so a second reset is heard again.
    this.announcement.set('');
    afterNextRender(() => this.announcement.set('Settings reset'), { injector: this.injector });
  }
}
