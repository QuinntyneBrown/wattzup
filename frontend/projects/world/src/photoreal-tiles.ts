// Real-world scenery (L2-066): Google's photorealistic 3D Tiles of a map's real place, streamed with the rider's own
// Google Maps Platform key through 3d-tiles-renderer (ADR 0021's amendment). Built new on `main`'s renderer, which has
// no tiles: the renderer imports this file only when the rider presses "Stream it", so neither the world chunk nor the
// initial bundle carries the loader.
import type { RealPlace, SceneryState } from '@telo/api';
import { TilesRenderer } from '3d-tiles-renderer';
import { GoogleCloudAuthPlugin } from '3d-tiles-renderer/core/plugins';
import { GLTFExtensionsPlugin, ReorientationPlugin } from '3d-tiles-renderer/three/plugins';
import { type Camera, MathUtils } from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { WebGPURenderer } from 'three/webgpu';

/** Where the build copies the pinned `three` package's Draco decoder, on the app's own origin (ADR 0021). */
const DRACO_DECODER = 'draco/';

/** Google's attribution: its name, then the data credits of the tiles in view (AC7). */
export function creditFor(attributions: readonly { type: string; value: unknown }[]): string {
  const credits = attributions
    .filter((a) => a.type === 'string' && typeof a.value === 'string' && a.value.trim() !== '')
    .map((a) => (a.value as string).trim());
  return ['Google', ...credits].join(' · ');
}

/**
 * One place's tiles: a `TilesRenderer` whose requests carry the key to `tile.googleapis.com` and nowhere else, its
 * glTF decoded with Three.js's own `DRACOLoader`, and the place's latitude and longitude put at the scene's origin, up
 * the scene's Y axis. It reports `refused` when the root tileset fails or holds no root (Google refused the key, and
 * the built-in world stays, AC4), and `streaming` with Google's attribution each time the credits change.
 */
export class PhotorealTiles {
  private readonly tiles: TilesRenderer;
  private readonly draco = new DRACOLoader().setDecoderPath(DRACO_DECODER);
  private credit: string | null = null;
  private refused = false;

  constructor(
    place: RealPlace,
    key: string,
    private readonly report: (state: SceneryState) => void,
  ) {
    this.tiles = new TilesRenderer();
    this.tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: key, autoRefreshToken: true }));
    this.tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: this.draco }));
    this.tiles.registerPlugin(
      new ReorientationPlugin({
        lat: place.latitude * MathUtils.DEG2RAD,
        lon: place.longitude * MathUtils.DEG2RAD,
        recenter: true,
      }),
    );
    this.tiles.addEventListener('load-error', this.onError);
    this.tiles.addEventListener('load-root-tileset', this.onRoot);
    this.tiles.addEventListener('tile-visibility-change', this.onCredits);
  }

  /** The tiles' scene graph, which the renderer adds to its scene. */
  get group() {
    return this.tiles.group;
  }

  /** Loads and shows the tiles the camera sees; called once per drawn frame. */
  update(camera: Camera, renderer: WebGPURenderer): void {
    if (this.refused) return;
    if (!this.tiles.hasCamera(camera)) this.tiles.setCamera(camera);
    this.tiles.setResolutionFromRenderer(camera, renderer as never);
    this.tiles.update();
  }

  dispose(): void {
    this.tiles.removeEventListener('load-error', this.onError);
    this.tiles.removeEventListener('load-root-tileset', this.onRoot);
    this.tiles.removeEventListener('tile-visibility-change', this.onCredits);
    this.tiles.group.removeFromParent();
    this.tiles.dispose();
    this.draco.dispose();
  }

  private readonly onError = (event: { tile: unknown }) => {
    // A tile of an accepted tileset may fail on its own; only the root failing means the key was refused.
    if (event.tile === null) this.refuse();
  };

  private readonly onRoot = (event: { tileset: unknown }) => {
    const tileset = event.tileset as { root?: unknown } | null;
    if (!tileset?.root) this.refuse();
    else this.onCredits();
  };

  private readonly onCredits = () => {
    if (this.refused || this.tiles.rootTileset === null) return;
    const credit = creditFor(this.tiles.getAttributions());
    if (credit === this.credit) return;
    this.credit = credit;
    this.report({ status: 'streaming', credit });
  };

  private refuse(): void {
    if (this.refused) return;
    this.refused = true;
    this.report({ status: 'refused' });
  }
}
