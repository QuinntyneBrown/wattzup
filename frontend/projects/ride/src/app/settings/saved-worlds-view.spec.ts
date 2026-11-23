// Unit test
// Traces to: L2-165 AC1, AC2
// Description: This device's Saved worlds row reads the number and size of the saved worlds and names them, or None
// saved; sizes read in whole megabytes from 10 MB and to one decimal place below.
import { type SavedWorld } from '@telo/api';
import { NONE_SAVED, savedWorldsView, worldSize } from './saved-worlds-view';

const world = (name: string, bytes: number): SavedWorld => ({ id: 'oldtown', name, bytes });

describe('savedWorldsView', () => {
  it('reads None saved, with nothing to clear, when no world is saved (AC2)', () => {
    expect(savedWorldsView([])).toEqual({ value: 'None saved', hint: NONE_SAVED, clear: false });
    expect(NONE_SAVED).toBe('Each world downloads again the next time you ride it.');
  });

  it.each([
    [
      [world('Old Town Criterium', 203_958)],
      '1 world · 0.2 MB',
      'Old Town Criterium opens in seconds, even offline.',
    ],
    [
      [world('Prairie Paceline', 18_900_000), world('Old Town Criterium', 24_300_000)],
      '2 worlds · 43 MB',
      'Prairie Paceline and Old Town Criterium open in seconds, even offline.',
    ],
    [
      [
        world('Prairie Paceline', 18_900_000),
        world('Old Town Criterium', 24_300_000),
        world('Cliffside Coast', 17_800_000),
      ],
      '3 worlds · 61 MB',
      'Prairie Paceline, Old Town Criterium and Cliffside Coast open in seconds, even offline.',
    ],
  ])('reads %#: the number, size and names of the saved worlds (AC1)', (worlds, value, hint) => {
    expect(savedWorldsView(worlds)).toEqual({ value, hint, clear: true });
  });
});

describe('worldSize', () => {
  it.each([
    [203_958, '0.2 MB'],
    [9_949_999, '9.9 MB'],
    [9_950_000, '10 MB'],
    [61_000_000, '61 MB'],
    [61_499_999, '61 MB'],
  ])('reads %i bytes as %s', (bytes, size) => {
    expect(worldSize(bytes)).toBe(size);
  });
});
