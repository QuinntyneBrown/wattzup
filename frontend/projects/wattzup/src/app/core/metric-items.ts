// The metric list under the trace: heart rate, avg power, speed, distance and energy (L2-022).
import type { BikeState } from '@wattzup/api';
import type { MetricItem } from '@wattzup/components';
import { formatCount, formatDistance, formatLive, formatSpeed } from './metric-format';

/** The items to show, or null while there is no state yet. */
export function metricItems(s: BikeState | null): MetricItem[] | null {
  if (!s) return null;
  return [
    { term: 'Heart rate', value: formatLive(s.heart_rate), unit: 'bpm', heart: true },
    { term: 'Avg power', value: formatCount(s.avg_power), unit: 'W', heart: false },
    {
      term: 'Speed',
      value: formatSpeed(s.speed_kmh),
      unit: `km/h · ${formatSpeed(s.speed_mph)} mph`,
      heart: false,
    },
    { term: 'Distance', value: formatDistance(s.distance_km), unit: 'km', heart: false },
    { term: 'Energy', value: formatCount(s.kcal), unit: 'kcal', heart: false },
  ];
}
