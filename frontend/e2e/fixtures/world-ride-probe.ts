// The test-only World Ride hook (#672), for the performance sweep and the race world's specs, which
// pin its cheapest tier and read the riders it drew (L2-064 AC3). `pin(tier)` sets
// `window.__wzWorldRide = { tier }` before the app boots. World Ride then draws at that tier
// from its first frame, its frame budget never lowers it, and the renderer writes what it draws
// to `__wzWorldRide.report`, which `report()` reads. Ultra on a WebGL2 screen draws at high, as
// L2-111 AC2 says.
//
// It is not a rider option: nothing in the app sets the global, and the README lists no such
// option. Only the lazy World Ride renderer reads it (core/world-ride-probe.ts).
import type { Page } from '@playwright/test';

export type Tier = 'low' | 'medium' | 'high' | 'ultra';

/** What the renderer reports while the hook is set. */
export interface WorldRideReport {
  tier: Tier;
  backend: 'webgpu' | 'webgl2';
  /** The time between each drawn frame and the one before, in ms, oldest first. */
  frames: number[];
  /** GPU time of each frame, in ms, from timer queries; null where the browser offers none. */
  gpuMs: number[] | null;
  /** Longitudinal displacement of the first marching band from its roadside section. */
  paradeMetres?: number;
  /** Draw calls in the latest frame, every pass included. */
  drawCalls: number;
  /** Shader programs alive. */
  programs: number;
  /** Shader programs alive when the scene had loaded, before its first frame. */
  programsBeforeRide: number | null;
  /** The scene's distinct materials by type and features, most shared first. */
  materials: Record<string, number>;
  /** Materials in the scene that should follow the bend but do not (L2-111 AC8). */
  unbent: number;
  /** Whether the post chain draws the ink outline pass (L2-111 technique 52). */
  outlines: boolean;
  /** Whether the sky is the flat three-stop gradient (L2-111 technique 53). */
  skyGradient: boolean;
  /** Materials cut by the ordered dither (L2-111 technique 54). */
  dithered: number;
  /** Shader programs and render pipelines the backend has built, ever: each one a compile. */
  compiled: number; /** The race's riders drawn in the latest frame, from furthest ahead (L2-064 AC3). */
  riders: DrawnRider[];
  /** `main`'s simulated pacers drawn in the latest frame: none in a race, which draws its own riders. */
  pacers: number;
}

/** A race rider the renderer drew: its jersey, its place, and the colour and opacity it wears. */
export interface DrawnRider {
  jersey: string;
  /** Metres ahead of the rider; negative is behind. */
  metres: number;
  /** `#rrggbb`. */
  colour: string;
  opacity: number;
}

export class WorldRideProbe {
  constructor(private readonly page: Page) {}

  async startAt(metres: number): Promise<void> {
    await this.page.evaluate((from) => {
      (window as unknown as { __wzWorldRide: { from: number } }).__wzWorldRide.from = from;
    }, metres);
  }

  async fenlandMotion(
    part: 'turbineAngle' | 'dustPosition' | 'shadowOffset' | 'cloudBearing',
  ): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async beachMotion(part: 'pickupZ' | 'gondolaY' | 'volleyballY' | 'breakerX'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async moorMotion(part: 'sheepX' | 'flagTip'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async mountainMotion(part: 'climberX' | 'chairX'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async harbourMotion(part: 'boatRoll' | 'gullY'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async commuterMotion(part: 'cargoPedalY' | 'markerCount'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async parkMotion(part: 'carRadius' | 'trainX' | 'horseStride' | 'clubDistance'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async comunaMotion(part: 'dancerY' | 'passengerY'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async comoMotion(part: 'ferryX' | 'foilX'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async ligurianMotion(part: 'hikerX' | 'boatRoll'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async chichenMotion(part: 'wingAngle' | 'walkerX'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async chicagoMotion(part: 'trainX' | 'steamHeight'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async champsMotion(part: 'flagAngle' | 'sprintLane'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async basinMotion(part: 'kiteAngle' | 'boatX' | 'haze'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async yardMotion(part: 'speakerDepth' | 'mistPosition'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async millMotion(part: 'paddleHeight' | 'valleyMist'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async coastalMotion(part: 'foamAdvance' | 'walkerStride'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async saltMotion(part: 'pushCarPosition' | 'mirageHeight'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async brickyardMotion(part: 'flagTip' | 'balloonHeight'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async brightonMotion(part: 'bannerTip' | 'floatPosition'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async brooklynMotion(part: 'cabPosition' | 'ferryPosition'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async bundMotion(part: 'boatPosition' | 'touristPosition'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async calobraMotion(part: 'coachDistance' | 'packDistance'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async campolongoMotion(part: 'chairDistance' | 'cowPitch'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async cabotMotion(part: 'boatHeel' | 'moosePitch'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async guitarHand(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { guitarHand?: number } } })
          .__wzWorldRide?.course?.guitarHand ?? null,
    );
  }

  async reefCrest(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { reefCrest?: number } } }).__wzWorldRide
          ?.course?.reefCrest ?? null,
    );
  }

  async ferryX(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { ferryX?: number } } }).__wzWorldRide
          ?.course?.ferryX ?? null,
    );
  }

  async eveningLight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { eveningLight?: number } } })
          .__wzWorldRide?.course?.eveningLight ?? null,
    );
  }

  async clubLane(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { clubLane?: number } } }).__wzWorldRide
          ?.course?.clubLane ?? null,
    );
  }

  async surfCrest(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { surfCrest?: number } } }).__wzWorldRide
          ?.course?.surfCrest ?? null,
    );
  }

  async tramMetres(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { tramMetres?: number } } })
          .__wzWorldRide?.course?.tramMetres ?? null,
    );
  }

  async headlandMotion(part: 'walkerX' | 'breakerHeight'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async pin(tier: Tier, backend: 'auto' | 'webgl2' = 'auto'): Promise<void> {
    await this.page.addInitScript(
      ([t, b]) => {
        (window as unknown as Record<string, unknown>)['__wzWorldRide'] = { tier: t, backend: b };
      },
      [tier, backend] as const,
    );
  }

  /**
   * Call before the page loads: World Ride opens at `tier` and its frame budget judges it as a rider's ride is judged,
   * so slow frames drop it (L2-159 AC4), while the renderer still reports what it draws.
   */
  async open(tier: Tier): Promise<void> {
    await this.page.addInitScript((t) => {
      (window as unknown as Record<string, unknown>)['__wzWorldRide'] = { tier: t, judged: true };
    }, tier);
  }

  /**
   * Call before the page loads: World Ride opens where the rider's settings say and is judged as a rider's ride is,
   * while the renderer reports what it draws (L2-159 AC5, L2-160).
   */
  async watch(): Promise<void> {
    await this.page.addInitScript(() => {
      (window as unknown as Record<string, unknown>)['__wzWorldRide'] = { judged: true };
    });
  }

  /** Lowers the drawn tier one step on the next frame, as a slow frame budget would (#882). */
  async dropTier(): Promise<void> {
    await this.page.evaluate(() => {
      const hook = (window as unknown as Record<string, { drop?: boolean }>)['__wzWorldRide'];
      if (hook) hook.drop = true;
    });
  }

  /** Straight-line distance between the visible ghost and rider in the submitted course scene. */
  async ghostSeparation(): Promise<number> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { ghostSeparationMetres: number } } })
          .__wzWorldRide?.course?.ghostSeparationMetres ?? 0,
    );
  }

  /** Height of the moored boats in the frame just submitted, when the course has them. */
  async boatHeight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { boatHeight?: number } } })
          .__wzWorldRide?.course?.boatHeight ?? null,
    );
  }

  /** Distance used to place the rider on the course in the submitted frame. */
  async courseMetres(): Promise<number | undefined> {
    return this.page.evaluate(
      () =>
        (
          window as unknown as {
            __wzWorldRide?: { course?: { metres: number } };
          }
        ).__wzWorldRide?.course?.metres,
    );
  }

  /** Height of the Dutch Corner smoke in the submitted scene. */
  async smokeHeight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { smokeHeight?: number } } })
          .__wzWorldRide?.course?.smokeHeight ?? null,
    );
  }

  /** Along-canal position of the tour boat in the submitted frame. */
  async tourBoatX(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { tourBoatX?: number } } }).__wzWorldRide
          ?.course?.tourBoatX ?? null,
    );
  }

  async cabinHeight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { cabinHeight?: number } } })
          .__wzWorldRide?.course?.cabinHeight ?? null,
    );
  }

  async marinaMotion(part: 'dhowRoll' | 'wheelAngle'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async fringeMotion(part: 'clubY' | 'torchAngle' | 'spectatorSections'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async engadinMotion(
    part: 'kiteHeight' | 'trainPosition' | 'villageFronts',
  ): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async etnaMotion(
    part: 'plumeHeight' | 'walkerPosition' | 'gondolaPosition' | 'busPosition' | 'heatPhase',
  ): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async report(): Promise<WorldRideReport | null> {
    return this.page.evaluate(
      () =>
        ((window as unknown as Record<string, { report?: WorldRideReport }>)['__wzWorldRide']
          ?.report ?? null) as WorldRideReport | null,
    );
  }
  /** Position of the first local training rider drawn in Girona. */
  async trainingRiderX(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { trainingRiderX?: number } } })
          .__wzWorldRide?.course?.trainingRiderX ?? null,
    );
  }
  /** Position of the tuk-tuk submitted to the course renderer. */
  async tukTukX(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { tukTukX?: number } } }).__wzWorldRide
          ?.course?.tukTukX ?? null,
    );
  }
  /** Rotation of the flag mesh submitted to the course renderer. */
  async asturiasFlagAngle(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { asturiasFlagAngle?: number } } })
          .__wzWorldRide?.course?.asturiasFlagAngle ?? null,
    );
  }
  /** Position of the lead rider in the crosswind echelon. */
  async echelonLeaderX(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { echelonLeaderX?: number } } })
          .__wzWorldRide?.course?.echelonLeaderX ?? null,
    );
  }
  /** Position of the commissaire motorcycle drawn on the sector. */
  async commissaireX(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { commissaireX?: number } } })
          .__wzWorldRide?.course?.commissaireX ?? null,
    );
  }
  /** Height of the first jogger on the granite steps. */
  async joggerHeight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { joggerHeight?: number } } })
          .__wzWorldRide?.course?.joggerHeight ?? null,
    );
  }
  async flagDisplacement(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { flagDisplacement?: number } } })
          .__wzWorldRide?.course?.flagDisplacement ?? null,
    );
  }
  /** Height of a feeding flamingo’s bill at Chaxa. */
  async flamingoBillHeight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { flamingoBillHeight?: number } } })
          .__wzWorldRide?.course?.flamingoBillHeight ?? null,
    );
  }
  /** Height of a grazing vicuña’s head on the dry shore. */
  async vicunaHeadHeight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { vicunaHeadHeight?: number } } })
          .__wzWorldRide?.course?.vicunaHeadHeight ?? null,
    );
  }
  /** Height of a breaking plume at the Storseisundet approach. */
  async sprayHeight(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { sprayHeight?: number } } })
          .__wzWorldRide?.course?.sprayHeight ?? null,
    );
  }
  /** Lane of the horse nearest the corniche. */
  async horseLane(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { horseLane?: number } } }).__wzWorldRide
          ?.course?.horseLane ?? null,
    );
  }
  async cirqueSun(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { cirqueSun?: number } } }).__wzWorldRide
          ?.course?.cirqueSun ?? null,
    );
  }
  /** Lane of the sheep nearest the riding line. */
  async sheepLane(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { sheepLane?: number } } }).__wzWorldRide
          ?.course?.sheepLane ?? null,
    );
  }
  async highlandSun(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { highlandSun?: number } } })
          .__wzWorldRide?.course?.highlandSun ?? null,
    );
  }
  async fallingWater(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { fallingWater?: number } } })
          .__wzWorldRide?.course?.fallingWater ?? null,
    );
  }
  async illumination(): Promise<number | null> {
    return this.page.evaluate(
      () =>
        (window as unknown as { __wzWorldRide?: { course?: { illumination?: number } } })
          .__wzWorldRide?.course?.illumination ?? null,
    );
  }

  async desertMotion(part: 'mirageOpacity' | 'ravenHeading'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async festivalMotion(part: 'taxiZ' | 'sparkY'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }

  async quayMotion(part: 'ferryRoll' | 'walkerZ'): Promise<number | null> {
    return this.page.evaluate(
      (name) =>
        (window as unknown as { __wzWorldRide?: { course?: Record<string, number> } }).__wzWorldRide
          ?.course?.[name] ?? null,
      part,
    );
  }
}
