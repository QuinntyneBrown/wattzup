import { creditFor } from './photoreal-tiles';

describe('creditFor (L2-066 AC7)', () => {
  it('credits Google alone while no tile with a credit is in view', () => {
    expect(creditFor([])).toBe('Google');
  });

  it('follows Google with the data credits of the tiles in view, leaving out pictures and blanks', () => {
    expect(
      creditFor([
        { type: 'image', value: 'logo.png' },
        { type: 'string', value: ' Data ©2026 Aerodata International Surveys ' },
        { type: 'string', value: '   ' },
      ]),
    ).toBe('Google · Data ©2026 Aerodata International Surveys');
  });
});
