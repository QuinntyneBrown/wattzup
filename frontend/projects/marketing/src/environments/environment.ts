/**
 * The address of the Telo Ride app, set at build time by `--define TELO_RIDE_APP_URL='"https://…"'`
 * where the release knows it; without it, links to the app are relative to this site (ADR 0027).
 */
declare const TELO_RIDE_APP_URL: string | undefined;

/** The marketing site in production (ADR 0027). */
export const environment = {
  appUrl: typeof TELO_RIDE_APP_URL === 'string' ? TELO_RIDE_APP_URL : '',
};
