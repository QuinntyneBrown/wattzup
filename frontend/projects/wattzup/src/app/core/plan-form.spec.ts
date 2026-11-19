import {
  DEFAULT_DRAFT,
  PRESETS,
  applyPreset,
  editDraft,
  formatClock,
  parseClock,
  parseUnit,
  stepDraft,
  toPlan,
  validateDraft,
} from './plan-form';

describe('plan-form (L2-029)', () => {
  it('defaults to an 18-round HIIT plan with no preset and flat 12 / 30 / 85 (AC1, AC3)', () => {
    expect(DEFAULT_DRAFT).toEqual({
      mode: 'hiit',
      preset: null,
      rounds: '18',
      work: '0:40',
      rest: '0:20',
      workLevel: 26,
      restLevel: 18,
      warmup: true,
      cooldown: true,
      flatLevel: 12,
      minutes: '30 min',
      cadence: '85 rpm',
    });
    expect(validateDraft(DEFAULT_DRAFT)).toEqual([]);
  });

  it.each([
    ['tabata', '8', '0:20', '0:10'],
    ['40-20', '8', '0:40', '0:20'],
    ['minute-on', '10', '1:00', '1:00'],
    ['long-climbs', '4', '4:00', '2:00'],
  ] as const)('preset %s fills rounds, work and recover (AC2)', (id, rounds, work, rest) => {
    const d = applyPreset({ ...DEFAULT_DRAFT, preset: null }, id);
    expect([d.rounds, d.work, d.rest, d.preset]).toEqual([rounds, work, rest, id]);
  });

  it('lists the four presets in order', () => {
    expect(PRESETS.map((p) => p.label)).toEqual(['Tabata', '40 / 20', 'Minute on', 'Long climbs']);
  });

  it.each(['rounds', 'work', 'rest'] as const)('editing %s clears the preset (AC2)', (field) => {
    expect(editDraft(applyPreset(DEFAULT_DRAFT, '40-20'), { [field]: '9' }).preset).toBeNull();
  });

  it('editing a level keeps the preset', () => {
    expect(editDraft(applyPreset(DEFAULT_DRAFT, '40-20'), { workLevel: 20 }).preset).toBe('40-20');
  });

  it.each([
    ['rounds', '0', 'Enter 1 to 30 rounds.', 'Rounds — enter 1 to 30'],
    ['rounds', '31', 'Enter 1 to 30 rounds.', 'Rounds — enter 1 to 30'],
    ['rounds', 'x', 'Enter a whole number.', 'Rounds — enter 1 to 30'],
    ['work', '0:04', 'Work must be at least 0:05.', 'Work — at least 0:05'],
    ['work', '60:01', 'Work must be at most 60:00.', 'Work — at most 60:00'],
    ['rest', '0:00', 'Recover must be at least 0:05.', 'Recover — at least 0:05'],
    ['rest', '61:00', 'Recover must be at most 60:00.', 'Recover — at most 60:00'],
    ['workLevel', 33, 'Level must be 1 to 32.', 'Work resistance — 1 to 32'],
    ['restLevel', 0, 'Level must be 1 to 32.', 'Recover resistance — 1 to 32'],
  ] as const)('rejects hiit %s = %s with "%s" (AC4)', (field, value, message, link) => {
    expect(validateDraft({ ...DEFAULT_DRAFT, [field]: value })).toEqual([{ field, message, link }]);
  });

  it.each([
    ['flatLevel', 0, 'Level must be 1 to 32.', 'Resistance level — 1 to 32'],
    ['minutes', '0 min', 'Enter 1 to 180 minutes.', 'Duration — 1 to 180 min'],
    ['minutes', '181 min', 'Enter 1 to 180 minutes.', 'Duration — 1 to 180 min'],
    ['cadence', '39 rpm', 'Cadence goal must be 40 to 150 rpm.', 'Cadence goal — 40 to 150 rpm'],
    ['cadence', '151', 'Cadence goal must be 40 to 150 rpm.', 'Cadence goal — 40 to 150 rpm'],
  ] as const)('rejects flat %s = %s (AC4)', (field, value, message, link) => {
    expect(validateDraft({ ...DEFAULT_DRAFT, mode: 'flat', [field]: value })).toEqual([
      { field, message, link },
    ]);
  });

  it('validates only the fields of the current mode', () => {
    expect(validateDraft({ ...DEFAULT_DRAFT, mode: 'flat', rounds: '0' })).toEqual([]);
  });

  it.each([
    ['rounds', 1, '19'],
    ['work', 1, '0:45'],
    ['rest', -1, '0:15'],
    ['minutes', 1, '35 min'],
    ['cadence', -1, '80 rpm'],
    ['workLevel', 1, 27],
  ] as const)('steps %s by %i (AC9)', (field, dir, value) => {
    expect(stepDraft(DEFAULT_DRAFT, field, dir)[field]).toBe(value);
  });

  it('parses and formats clock and unit text', () => {
    expect(parseClock('0:40')).toBe(40);
    expect(parseClock('4:00')).toBe(240);
    expect(parseClock('45')).toBe(45);
    expect(parseClock('a:b')).toBeNull();
    expect(parseClock('0:60')).toBeNull();
    expect(formatClock(40)).toBe('0:40');
    expect(formatClock(3600)).toBe('60:00');
    expect(parseUnit('30 min')).toBe(30);
    expect(parseUnit('85 rpm')).toBe(85);
    expect(parseUnit('85')).toBe(85);
    expect(parseUnit('1.5')).toBeNull();
    expect(parseUnit('')).toBeNull();
  });

  it('turns a valid draft into a plan', () => {
    expect(toPlan(DEFAULT_DRAFT)).toEqual({
      kind: 'hiit',
      video: null,
      rounds: 18,
      work_seconds: 40,
      rest_seconds: 20,
      work_level: 26,
      rest_level: 18,
      warmup: true,
      cooldown: true,
    });
    expect(toPlan({ ...DEFAULT_DRAFT, mode: 'flat' })).toEqual({
      kind: 'flat',
      video: null,
      level: 12,
      minutes: 30,
      cadence: 85,
    });
    expect(toPlan({ ...DEFAULT_DRAFT, rounds: '0' })).toBeNull();
  });
});
