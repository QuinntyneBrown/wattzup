import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ReduceMotionChoice, RideSettings, ThemeChoice } from '@telo/api';
import { Segmented, type SegmentedOption } from '../segmented/segmented';
import { Setting } from '../settings/setting';
import { SwitchRow } from '../switch/switch-row';

const MOTIONS: readonly SegmentedOption<ReduceMotionChoice>[] = [
  { value: 'device', label: 'Match device' },
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
];

const THEMES: readonly SegmentedOption<ThemeChoice>[] = [
  { value: 'device', label: 'Match device' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const RIDE_NUMBERS: readonly SegmentedOption<RideSettings['rideNumbers']>[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Large' },
];

/**
 * Settings' Motion and display controls (docs/mocks/pages/settings/, L2-164): Reduce motion, saying whether this device
 * asks for it, Theme, Ride numbers, Keep the screen awake and Go full screen when a ride starts. Inputs from the page,
 * outputs to it.
 */
@Component({
  selector: 'wz-display-settings',
  imports: [Segmented, Setting, SwitchRow],
  templateUrl: './display-settings.html',
  styleUrl: './display-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplaySettings {
  readonly settings = input.required<RideSettings>();
  /** Whether this device asks for reduced motion (`prefers-reduced-motion: reduce`). */
  readonly deviceReducesMotion = input.required<boolean>();

  readonly reduceMotionChosen = output<ReduceMotionChoice>();
  readonly themeChosen = output<ThemeChoice>();
  readonly rideNumbersChosen = output<RideSettings['rideNumbers']>();
  readonly keepAwakeToggled = output<boolean>();
  readonly fullScreenOnStartToggled = output<boolean>();

  protected readonly motions = MOTIONS;
  protected readonly themes = THEMES;
  protected readonly rideNumbers = RIDE_NUMBERS;
}
