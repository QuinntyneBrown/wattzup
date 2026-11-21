import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

/** What the World Ride HUD shows, computed by the page from the live state, the class and its world. */
export interface WorldRideView {
  /** The world's name, e.g. `Old Town Criterium`: the heading and the screen's accessible name. */
  readonly title: string;
  /** `<route> · <class title>`. */
  readonly classLine: string;
  /** The bike's name from the live state, rendered as text. */
  readonly bike: string | null;
  /** True while the ride is paused: the button reads Resume. */
  readonly paused: boolean;
  /** The live readouts, `--` when missing (L2-104). */
  readonly metrics: WorldRideMetrics;
  /** The current segment; null with no workout (L2-105). */
  readonly segment: WorldRideSegment | null;
  /** The resistance panel (L2-108). */
  readonly resistance: WorldRideResistance;
  /** The Riders nearby board's rows, furthest ahead first (L2-107). */
  readonly pacers: readonly WorldRidePacer[];
  /** The route profile; null with no workout (L2-106). */
  readonly profile: WorldRideProfile | null;
  /** Paused, the lost bike or the saved ride's end, over the HUD (L2-109). */
  readonly overlay: WorldRideOverlay | null;
}

/** An overlay over the scene: paused (a status), the lost bike or the ride's end (L2-109). */
export interface WorldRideOverlay {
  readonly kind: 'paused' | 'lost' | 'ended';
  readonly title: string;
  readonly text: string;
  /** The saved session `See your ride` opens, for `ended`. */
  readonly sessionHref: string | null;
}

/** A row of the Riders nearby board: a simulated pacer, or You (L2-107). */
export interface WorldRidePacer {
  readonly name: string;
  /** The rider colour, `--color-rider-<n>`. */
  readonly jersey: number;
  /** `+0:12` or `−0:04`; null for You. */
  readonly timeGap: string | null;
  readonly you: boolean;
}

/** The route-profile panel: the class drawn as terrain at the ride's moment (L2-106). */
export interface WorldRideProfile {
  /** `+0.5%`. */
  readonly gradeText: string;
  /** `9 m climbed`. */
  readonly climbedText: string;
  /** `1.56 km`. */
  readonly distanceText: string;
  /** `Route profile, <n> m of elevation`. */
  readonly label: string;
  /** The SVG's width, one unit per second of the plan. */
  readonly width: number;
  /** The terrain's path. */
  readonly area: string;
  /** The ridden part's width. */
  readonly doneWidth: number;
  readonly strip: readonly { readonly x: number; readonly width: number; readonly tone: string }[];
  readonly playhead: { readonly x: number; readonly y: number };
}

/** The resistance panel: the level, its caption and which steps are allowed (L2-108). */
export interface WorldRideResistance {
  readonly level: string;
  /** `Resistance / 32`, or `Manual` in manual mode. */
  readonly caption: string;
  readonly lowerDisabled: boolean;
  readonly raiseDisabled: boolean;
}

/** The current-segment panel's words (L2-105). */
export interface WorldRideSegment {
  /** `Work · 1 of 8`, `Recover · 1 of 8`, `Warm-up`, `Cool-down` or `Steady`. */
  readonly label: string;
  readonly tone: 'work' | 'rest' | 'easy';
  /** `Next: <name> · <m:ss> at level <n>`, or `Last stretch to the finish arch`. */
  readonly next: string;
}

/** The metrics panel: estimated power against target, cadence, heart and speed (L2-104). */
export interface WorldRideMetrics {
  readonly power: string;
  readonly target: string;
  /** `On target`, `+<n> W`, `-<n> W` or `Paused`, with its tone; null with no reading. */
  readonly delta: { readonly text: string; readonly tone: 'on' | 'high' | 'low' } | null;
  readonly cadence: string;
  readonly heart: string;
  readonly speed: string;
}

/** The segment's countdown, interpolated as the dashboard's (L2-024). */
export interface WorldRideCountdown {
  /** The time left, `m:ss`. */
  readonly left: string;
  /** Whole seconds ridden of the segment, out of `duration`. */
  readonly ridden: number;
  readonly duration: number;
  /** The bar's width, e.g. `50.00%`. */
  readonly width: string;
}

/** The ride's clock, `<elapsed> / <total>`, interpolated as the dashboard's (L2-024). */
export interface WorldRideClock {
  readonly elapsed: string;
  readonly total: string;
}

/**
 * The World Ride block: the HUD drawn over a class's scene (L2-102 to L2-109). The scene is
 * projected into `[slot=scene]`. Links carry real `href`s; a plain click is emitted as `navigate`
 * so the page routes without the component knowing the router.
 */
@Component({
  selector: 'wz-world-ride',
  imports: [Icon],
  templateUrl: './world-ride.html',
  styleUrl: './world-ride.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldRide {
  readonly view = input.required<WorldRideView>();
  readonly clock = input.required<WorldRideClock>();
  readonly countdown = input.required<WorldRideCountdown>();
  /** Where `Class` leads: the class page. */
  readonly classHref = input.required<string>();
  /** Where the lockup leads: the dashboard. */
  readonly homeHref = input('/');

  readonly pauseToggled = output<void>();
  readonly endRequested = output<void>();
  /** Whether ride sound is on: the `Ride sound` button's pressed state (L2-129 AC1). */
  readonly soundOn = input(false);
  /** The rider pressed `Ride sound`, which opens its dialog (L2-129 AC2). */
  readonly soundPressed = output<void>();
  /** Whether the world's track is on: the `Music` toggle's pressed state (L2-128 AC4). */
  readonly musicOn = input(true);
  /** The rider pressed `Music` (L2-128 AC4). */
  readonly musicToggled = output<void>();
  /** − or + on the resistance panel. */
  readonly stepped = output<-1 | 1>();
  /** A plain click on a link, with its `href`. */
  readonly navigate = output<string>();
  /** A plain click on `See your ride`, with its `href`: the summary opens as just finished. */
  readonly sessionOpened = output<string>();
  /** `Reconnect` on the lost-bike overlay. */
  readonly reconnected = output<void>();
  /** True while a reconnect is in flight. */
  readonly reconnecting = input(false);
  /** True when this screen can't draw the scene: the notice shows instead (L2-110 AC4). */
  readonly sceneUnavailable = input(false);

  /** The HUD is inert under the lost-bike and end overlays (L2-109 AC2, AC5). */
  protected readonly inert = computed(() => {
    const kind = this.view().overlay?.kind;
    return kind === 'lost' || kind === 'ended';
  });

  private readonly lockup = viewChild<ElementRef<HTMLElement>>('lockup');
  private readonly reconnectButton = viewChild<ElementRef<HTMLElement>>('reconnect');
  private readonly seeYourRide = viewChild<ElementRef<HTMLElement>>('seeYourRide');
  private shownKind: WorldRideOverlay['kind'] | null = null;

  constructor() {
    // Focus moves to the overlay's action, and back to the app bar once the bike returns
    // (L2-109 AC4; L2-084 AC3).
    afterRenderEffect(() => {
      const kind = this.view().overlay?.kind ?? null;
      const reconnect = this.reconnectButton();
      const seeYourRide = this.seeYourRide();
      untracked(() => {
        if (kind === this.shownKind) return;
        const was = this.shownKind;
        this.shownKind = kind;
        if (kind === 'lost') reconnect?.nativeElement.focus();
        else if (kind === 'ended') seeYourRide?.nativeElement.focus();
        else if (was === 'lost') this.lockup()?.nativeElement.focus();
      });
    });
  }

  protected follow(event: MouseEvent, href: string, session = false): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    (session ? this.sessionOpened : this.navigate).emit(href);
  }
}
