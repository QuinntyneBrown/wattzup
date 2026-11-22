import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { GraphicsApi, QualityChoice, RideSettings } from '@telo/api';
import { Pill } from '../pill/pill';
import { Segmented, type SegmentedOption } from '../segmented/segmented';
import { Setting } from '../settings/setting';
import { SwitchRow } from '../switch/switch-row';

/** The level names as the cards and the step-down text write them. */
const LEVEL_NAME: Record<QualityChoice, string> = {
  auto: 'Auto',
  ultra: 'Ultra',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** The five Quality cards, Auto first (L2-159 AC2). */
const QUALITIES: readonly { value: QualityChoice; text: string }[] = [
  {
    value: 'auto',
    text: 'Starts at Low, the drawn look, or at the level this device’s check found, and steps down a level whenever frames drop, so the ride stays smooth.',
  },
  {
    value: 'ultra',
    text: 'Volumetric clouds and fog, ray-traced reflections and global light. For a strong graphics card.',
  },
  { value: 'high', text: 'Reflections, motion blur, ambient occlusion and contact shadows.' },
  { value: 'medium', text: 'Shadows, physically based materials, foliage and wind.' },
  {
    value: 'low',
    text: 'The drawn look: toon shading and ink outlines. Lightest on battery and older laptops.',
  },
];

const FRAME_RATES: readonly SegmentedOption<RideSettings['frameRate']>[] = [
  { value: 'display', label: 'Match display' },
  { value: '30', label: '30 fps' },
];

/**
 * Settings' World controls (docs/mocks/pages/settings/, L2-159, L2-160, L2-161): Quality as five cards with real
 * radios, Step down when frames drop, Frame rate, Resolution and Graphics. With WebGL 2 only, Ultra needs WebGPU; with
 * neither API, every control is disabled. Inputs from the page, outputs to it.
 */
@Component({
  selector: 'wz-world-settings',
  imports: [Pill, Segmented, Setting, SwitchRow],
  templateUrl: './world-settings.html',
  styleUrl: './world-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldSettings {
  readonly settings = input.required<RideSettings>();
  readonly api = input.required<GraphicsApi>();

  readonly qualityChosen = output<QualityChoice>();
  readonly stepDownToggled = output<boolean>();
  readonly frameRateChosen = output<RideSettings['frameRate']>();
  readonly resolutionChanged = output<number>();
  readonly graphicsChosen = output<RideSettings['graphics']>();

  protected readonly qualities = QUALITIES;
  protected readonly levelName = LEVEL_NAME;
  protected readonly frameRates = FRAME_RATES;
  protected readonly none = computed(() => this.api() === 'none');

  /** The step-down switch: always on with Auto, the rider's with a fixed level (L2-160 AC1, AC2). */
  protected readonly stepDown = computed(() => {
    const { quality, stepDown } = this.settings();
    if (this.none()) {
      return { on: false, locked: true, text: 'Comes back when this browser can draw 3D worlds.' };
    }
    if (quality === 'auto') {
      return {
        on: true,
        locked: true,
        text: 'Always on with Auto: four slow seconds in a row drop one level for the rest of the ride.',
      };
    }
    return {
      on: stepDown,
      locked: false,
      text: `Four slow seconds in a row drop one level for the rest of the ride. Turn it off to keep ${LEVEL_NAME[quality]} even if the world stutters.`,
    };
  });

  /** The graphics select's options, choice and words (L2-161 AC1, AC2, AC4). */
  protected readonly graphics = computed(() => {
    const api = this.api();
    if (api === 'none') {
      return {
        value: 'auto',
        options: [{ value: 'auto', label: 'Not available', disabled: false }],
        hint: 'Neither WebGPU nor WebGL 2 is on in this browser.',
      };
    }
    if (api === 'webgl2') {
      return {
        value: 'auto',
        options: [
          { value: 'auto', label: 'Automatic · WebGL 2', disabled: false },
          { value: 'webgpu', label: 'WebGPU · not available here', disabled: true },
        ],
        hint: 'This browser has no WebGPU, so worlds use WebGL 2 and go up to High.',
      };
    }
    return {
      value: this.settings().graphics,
      options: [
        { value: 'auto', label: 'Automatic · WebGPU', disabled: false },
        { value: 'webgl2', label: 'WebGL 2', disabled: false },
      ],
      hint: 'Choose WebGL 2 if the world flickers or won’t load. WebGL 2 goes up to High.',
    };
  });

  protected chooseQuality(event: Event): void {
    this.qualityChosen.emit((event.target as HTMLInputElement).value as QualityChoice);
  }

  protected changeResolution(event: Event): void {
    this.resolutionChanged.emit(Number((event.target as HTMLInputElement).value));
  }

  protected chooseGraphics(event: Event): void {
    this.graphicsChosen.emit((event.target as HTMLSelectElement).value as RideSettings['graphics']);
  }
}
