import { metricItems } from './metric-items';
import { testState } from './test-state';

describe('metricItems (L2-022)', () => {
  it('is null while there is no state', () => {
    expect(metricItems(null)).toBeNull();
  });

  it('lists the bike metrics in order', () => {
    expect(metricItems(testState())?.map((m) => m.term)).toEqual([
      'Heart rate',
      'Avg power',
      'Speed',
      'Distance',
      'Energy',
    ]);
  });
});
