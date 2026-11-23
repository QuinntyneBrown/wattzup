// Unit test (the slice's acceptance table: no screen shows totals until slice 5.2)
// Traces to: L2-023 AC4
// Description: energy is round(average power × running seconds ÷ 1000 ÷ 0.24 ÷ 4.184) kcal, the work done in kJ over
// a 24% efficient rider, in kilocalories. One case per row, plus the edges.
import { EnergyModel } from './energy-model';

describe('EnergyModel', () => {
  it('shows 208 W after 760 running seconds as round(208 × 760 ÷ 1000 ÷ 0.24 ÷ 4.184) = 157 kcal (AC4)', () => {
    expect(EnergyModel.kcal(208, 760)).toBe(157);
  });

  it.each([
    [0, 600, 0],
    [208, 0, 0],
    [200, 3600, 717],
  ])('shows %d W over %d s as %d kcal', (watts, seconds, kcal) => {
    expect(EnergyModel.kcal(watts, seconds)).toBe(kcal);
  });
});
