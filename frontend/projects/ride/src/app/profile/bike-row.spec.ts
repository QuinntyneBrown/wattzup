// Unit test
// Traces to: L2-112 AC1, AC2
// Description: Profile's bike row: the paired bike's name with "Connected · diagnostics" once it is connected, "Not
// connected · diagnostics" until then, or the browser's words when it stops Bluetooth; "No bike yet" with "Pair your
// bike" when none is paired.
import { bikeRow } from './bike-row';

describe('bikeRow', () => {
  it('names a connected bike', () => {
    expect(bikeRow('connected', 'ready', 'Echelon EX-5s')).toEqual({
      title: 'Echelon EX-5s',
      body: 'Connected · diagnostics',
      paired: true,
    });
  });

  it.each(['idle', 'connecting', 'disconnected'] as const)(
    'reads a %s bike as not connected',
    (ble) => {
      expect(bikeRow(ble, 'ready', 'Echelon EX-5s').body).toBe('Not connected · diagnostics');
    },
  );

  it('says the browser stops Bluetooth', () => {
    expect(bikeRow('disconnected', 'adapter-off', 'Echelon EX-5s').body).toBe(
      'Bluetooth is off · diagnostics',
    );
  });

  it('has no bike yet when none is paired', () => {
    expect(bikeRow('disconnected', 'ready', null)).toEqual({
      title: 'No bike yet',
      body: 'Pair your bike',
      paired: false,
    });
  });
});
