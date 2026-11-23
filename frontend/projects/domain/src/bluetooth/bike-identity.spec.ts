// Unit test
// Traces to: L2-011 AC3; L2-013 AC4
// Description: the card's name and identifier for each kind of device the chooser can return.
import { bikeIdentity } from './bike-identity';

describe('bikeIdentity', () => {
  it.each([
    ['ECH-EX5S-141844', 'Echelon EX-5s', 'EX5S-141844'],
    ['ECH-EX3-20211', 'Echelon EX-3', 'EX3-20211'],
    ['ECH-EX8S-9', 'Echelon EX-8s', 'EX8S-9'],
    ['ECH-SPORT-77', 'Echelon Connect Sport', 'SPORT-77'],
    ['ech-ex5s-141844', 'Echelon EX-5s', 'EX5S-141844'],
    ['ECH-EX7-5', 'Echelon EX7', 'EX7-5'],
  ])('names the Echelon %s "%s" (%s)', (advertised, name, identifier) => {
    expect(bikeIdentity(advertised, 'id-1')).toEqual({ name, identifier });
  });

  it('names another device by its advertised name, with no identifier', () => {
    expect(bikeIdentity('KICKR BIKE 1A2B', 'id-1')).toEqual({
      name: 'KICKR BIKE 1A2B',
      identifier: null,
    });
  });

  it.each([[undefined], [''], ['  ']])(
    'names a device with no name (%j) by its browser id',
    (advertised) => {
      expect(bikeIdentity(advertised, 'kK3fA9==')).toEqual({ name: 'kK3fA9==', identifier: null });
    },
  );
});
