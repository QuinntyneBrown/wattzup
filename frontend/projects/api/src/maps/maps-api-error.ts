/** Why the maps could not be read; a screen branches on `code`, the rider reads plain words. */
export type MapsApiErrorCode = 'maps_unavailable';

/**
 * A refusal from `MapsApi`: `maps_unavailable` when the backend cannot be reached and no catalogue has been kept on the
 * device yet (L2-046 AC7, L2-135 AC3).
 */
export class MapsApiError extends Error {
  constructor(
    readonly code: MapsApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'MapsApiError';
  }
}
