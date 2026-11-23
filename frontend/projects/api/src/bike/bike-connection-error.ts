/** Why the bike could not be chosen or reached; a screen branches on `code`, the rider reads plain words. */
export type BikeConnectionErrorCode = 'blocked' | 'failed' | 'read-only';

/** A refusal from `BikeConnection` (L2-012 AC4): `blocked` when a policy keeps the chooser shut, `read-only`
 * when the bike does not give control of its resistance (L2-014 AC3). */
export class BikeConnectionError extends Error {
  constructor(
    readonly code: BikeConnectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BikeConnectionError';
  }
}
