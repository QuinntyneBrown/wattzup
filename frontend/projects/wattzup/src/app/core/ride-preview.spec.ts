import { previewOf, withVideoRow } from './ride-preview';
import { testIntervalsPlan } from './test-state';

describe('previewOf (L2-059)', () => {
  it('previews the Descending recoveries plan (AC5)', () => {
    const p = previewOf(testIntervalsPlan());
    expect(p.total).toBe('30:00');
    expect(p.structure).toBe('5 sets · 8 efforts');
    expect(p.timeUnderLoad).toBe('4:00');
    expect(p.peakLevel).toBe(24);
    expect(p.avgPower).toBe(179);
    expect(p.kcal).toBe(321);
    expect(p.legend).toEqual(['work', 'rest']);
    expect(p.profile).toHaveLength(17);
    expect(p.profileLabel).toBe('Resistance profile: 5 sets · 8 efforts');
  });

  it('names one set and one effort in the singular', () => {
    const plan = { ...testIntervalsPlan() };
    plan.sets = [{ ...plan.sets[0], rest_seconds: 0 }];
    expect(previewOf(plan).structure).toBe('1 set · 1 effort');
  });

  it('previews the default plan', () => {
    const p = previewOf({
      kind: 'hiit',
      video: null,
      rounds: 8,
      work_seconds: 40,
      rest_seconds: 20,
      work_level: 18,
      rest_level: 6,
      warmup: true,
      cooldown: true,
    });
    expect(p.total).toBe('12:40');
    expect(p.totalSeconds).toBe(760);
    expect(p.structure).toBe('8 × 0:40 / 0:20');
    expect(p.timeUnderLoad).toBe('5:20');
    expect(p.peakLevel).toBe(18);
    expect(p.avgPower).toBe(211);
    expect(p.kcal).toBe(160);
    expect(p.legend).toEqual(['work', 'rest']);
  });

  it('previews a flat plan without time under load', () => {
    const p = previewOf({
      kind: 'flat',
      video: null,
      level: 12,
      minutes: 30,
      cadence: 85,
    });
    expect(p.total).toBe('30:00');
    expect(p.structure).toBe('Level 12 throughout');
    expect(p.timeUnderLoad).toBeNull();
    expect(p.peakLevel).toBe(12);
    expect(p.avgPower).toBe(205);
    expect(p.kcal).toBe(367);
    expect(p.legend).toEqual(['steady']);
  });

  it('draws one profile bar per segment in a 0 0 <total> 32 box', () => {
    const p = previewOf({
      kind: 'hiit',
      video: null,
      rounds: 8,
      work_seconds: 40,
      rest_seconds: 20,
      work_level: 18,
      rest_level: 6,
      warmup: true,
      cooldown: true,
    });
    expect(p.profile.length).toBe(17);
    const [warmup, work, rest] = p.profile;
    expect(warmup).toEqual({ x: 1.52, width: 176.96, y: 24, height: 8, tone: 'is-easy' });
    expect(work).toEqual({ x: 181.52, width: 36.96, y: 14, height: 18, tone: 'is-work' });
    expect(rest).toEqual({ x: 221.52, width: 16.96, y: 26, height: 6, tone: 'is-rest' });
    expect(p.profile.at(-1)?.tone).toBe('is-easy');
  });
});

describe('withVideoRow (L2-059 AC6)', () => {
  const hiit = previewOf(testIntervalsPlan());
  const flat = previewOf({
    kind: 'flat',
    video: null,
    level: 12,
    minutes: 30,
    cadence: 85,
  });

  it('adds Video Synced from <m:ss.s> right after Time under load', () => {
    const terms = withVideoRow(hiit, 12)!.rows.map((r) => r.term);
    expect(terms.indexOf('Video')).toBe(terms.indexOf('Time under load') + 1);
    expect(withVideoRow(hiit, 12)!.rows.find((r) => r.term === 'Video')?.value).toBe(
      'Synced from 0:12.0',
    );
  });

  it('adds it after Structure when the plan has no time under load', () => {
    expect(
      withVideoRow(flat, 61.5)!
        .rows.map((r) => r.term)
        .slice(0, 2),
    ).toEqual(['Structure', 'Video']);
  });

  it('leaves the preview as it is with no video', () => {
    expect(withVideoRow(hiit, null)).toBe(hiit);
    expect(withVideoRow(null, 12)).toBeNull();
  });
});
