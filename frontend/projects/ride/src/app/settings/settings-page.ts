import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
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
import { bikeRow } from '../profile/bike-row';

/**
 * Settings at `/settings` (docs/mocks/pages/settings/, L2-158): its five sections and their nav, each control
 * applying at once through `RIDE_SETTINGS` with no Save, Reset to recommended, and the warning when the browser
 * refuses to keep anything. Opened at a section (`/settings#world`), it shows that section. Slice 20.1 builds the
 * page and its first control, Keep the screen awake; slice 20.2 the World controls; slices 20.3 to 20.5 fill the rest.
 */
@Component({
  selector: 'wz-settings-page',
  imports: [
    RouterLink,
    BackLink,
    Banner,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsPage {
  protected readonly store = inject(RIDE_SETTINGS);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);

  protected readonly settings = this.store.settings;
  protected readonly persisted = this.store.persisted;
  /** What this browser draws worlds with, for the World section (L2-159 AC1, L2-161). */
  protected readonly graphicsApi = inject(GRAPHICS_SUPPORT).api;
  protected readonly apiName: Record<GraphicsApi, string> = {
    webgpu: 'WebGPU',
    webgl2: 'WebGL 2',
    none: 'Panorama only',
  };

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
    void this.announcer.announce('Settings reset');
  }
}
