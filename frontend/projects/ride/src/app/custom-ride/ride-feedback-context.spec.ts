// Unit test
// Traces to: L2-117 AC2
// Description: what Send feedback attaches from a custom ride: the summary, and each fact as text, with targets beside
// the readouts, "—" where nothing is known, the ride's state and view, and the last command or none.
import { type RideFeedbackInput, rideFeedbackContext } from './ride-feedback-context';

const RIDING: RideFeedbackInput = {
  workout: 'HIIT · 8 × 0:30',
  elapsed: '6:52',
  total: '30:00',
  segment: { kind: 'recover', left: 68 },
  resistance: 8,
  planLevel: 6,
  cadence: '73',
  aim: 80,
  power: '142',
  target: 150,
  heartRate: '128',
  distance: '2.24 km',
  state: 'riding',
  view: 'video',
  machine: 'Echelon EX-5s',
  bluetooth: 'Connected',
  last: { rideTime: 412, level: 6, source: 'plan', ackMs: 41 },
};

describe('rideFeedbackContext', () => {
  it('summarises the ride and lists every fact', () => {
    const context = rideFeedbackContext(RIDING);

    expect(context.screen).toBe('Ride');
    expect(context.summary).toBe('HIIT · 8 × 0:30 · Recover · 6:52 in');
    expect(context.facts).toEqual([
      { term: 'Workout', value: 'HIIT · 8 × 0:30' },
      { term: 'Elapsed', value: '6:52 / 30:00' },
      { term: 'Segment', value: 'Recover · 1:08 left' },
      { term: 'Resistance', value: 'L8' },
      { term: 'Plan level', value: 'L6' },
      { term: 'Cadence', value: '73 rpm · target 80' },
      { term: 'Power', value: '142 W · target 150 W' },
      { term: 'Heart rate', value: '128 bpm' },
      { term: 'Distance', value: '2.24 km' },
      { term: 'Ride state', value: 'Riding' },
      { term: 'View', value: 'Video' },
      { term: 'Machine', value: 'Echelon EX-5s' },
      { term: 'Bluetooth', value: 'Connected' },
      { term: 'Last command', value: 'RES 6 · plan · ack 41 ms' },
    ]);
  });

  it('writes "—" for what is not known before the ride starts, and no command', () => {
    const context = rideFeedbackContext({
      ...RIDING,
      elapsed: '0:00',
      segment: null,
      resistance: null,
      planLevel: null,
      cadence: '—',
      aim: null,
      power: '—',
      target: null,
      heartRate: '—',
      state: 'not-started',
      view: 'chart',
      machine: null,
      bluetooth: 'No bike connected',
      last: null,
    });
    const value = (term: string): string | undefined =>
      context.facts.find((fact) => fact.term === term)?.value;

    expect(context.summary).toBe('HIIT · 8 × 0:30 · 0:00 in');
    expect(value('Segment')).toBe('—');
    expect(value('Resistance')).toBe('—');
    expect(value('Cadence')).toBe('—');
    expect(value('Power')).toBe('—');
    expect(value('Heart rate')).toBe('—');
    expect(value('Ride state')).toBe('Not started');
    expect(value('View')).toBe('Power vs. plan');
    expect(value('Machine')).toBe('None');
    expect(value('Last command')).toBe('None sent yet');
  });

  it.each([
    ['paused', 'Paused'],
    ['finished', 'Finished'],
  ] as const)('names the %s ride', (state, words) => {
    expect(rideFeedbackContext({ ...RIDING, state }).facts[9]).toEqual({
      term: 'Ride state',
      value: words,
    });
  });
});
