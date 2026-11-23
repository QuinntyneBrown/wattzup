/** What a readout shows for a value that is not known: never a stale or made-up number (L2-020 AC5, L2-023 AC2). */
const UNKNOWN = '—';

/** A readout's value to `digits` decimals ("317", "30.0"), or "—" when it is unknown. */
export function formatMetric(value: number | null, digits = 0): string {
  return value === null ? UNKNOWN : value.toFixed(digits);
}

/** Distance in km with two decimals ("2.24 km", L2-022 AC4), or "—" when it is unknown. */
export function formatDistance(km: number | null): string {
  return km === null ? UNKNOWN : `${formatMetric(km, 2)} km`;
}
