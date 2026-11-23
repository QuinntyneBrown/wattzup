// Unit test (the slice's acceptance table: no screen shows readouts until slice 5.2)
// Traces to: L2-020 AC5; L2-022 AC4; L2-023 AC2
// Description: every readout shows its value to a fixed number of decimals, or "—" when the value is unknown, and
// distance with two decimals in km. One case per row.
import { formatDistance, formatMetric } from './format-metric';

describe('formatMetric', () => {
  it.each([
    [317, 0, '317'],
    [30, 1, '30.0'],
    [28.46, 1, '28.5'],
    [0, 0, '0'],
  ])('shows %d to %d decimals as %s', (value, digits, text) => {
    expect(formatMetric(value, digits)).toBe(text);
  });

  it('shows an unknown value as "—" (L2-020 AC5, L2-023 AC2)', () => {
    expect(formatMetric(null)).toBe('—');
  });
});

describe('formatDistance', () => {
  it.each([
    [2.2449, '2.24 km'],
    [0, '0.00 km'],
    [12.5, '12.50 km'],
  ])('shows %d km with two decimals as %s (L2-022 AC4)', (km, text) => {
    expect(formatDistance(km)).toBe(text);
  });

  it('shows an unknown distance as "—"', () => {
    expect(formatDistance(null)).toBe('—');
  });
});
