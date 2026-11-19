import type { ProgressReport, Segment, SessionDetail, SessionSummary } from '@wattzup/api';
import {
  calendarOf,
  dateLine,
  deltaOf,
  dipListView,
  endedEarly,
  totals,
  tracesView,
  weekLine,
} from './session-view';

const previous: SessionSummary = {
  id: 'aaaaaaaaaaa1',
  ended_at: '2026-11-17T18:10:00+00:00',
  class_id: 'hiit',
  title: 'HIIT',
  ridden_seconds: 600,
  planned_seconds: 600,
  completed: true,
  avg_power: 150,
  on_target_pct: 97,
  dip_count: 1,
};

function segment(
  kind: Segment['kind'],
  start: number,
  duration: number,
  cadence: number | null,
): Segment {
  return {
    kind,
    start,
    duration,
    level: 10,
    cadence,
    round: kind === 'work' ? 1 : null,
  } as Segment;
}

function session(change: Partial<SessionDetail> = {}): SessionDetail {
  return {
    previous,
    bests: [],
    id: 'aaaaaaaaaaa2',
    ended_at: '2026-11-18T18:10:00+00:00',
    class_id: 'hiit',
    title: 'HIIT',
    plan: {
      kind: 'flat',
      level: 10,
      minutes: 10,
      cadence: 80,
      video: null,
    },
    segments: [
      segment('warmup', 0, 120, 80),
      segment('work', 120, 60, 100),
      segment('rest', 180, 420, 70),
    ],
    planned_seconds: 600,
    ridden_seconds: 600,
    completed: true,
    avg_power: 162,
    max_power: 400,
    best_minute_power: 290,
    avg_cadence: 84,
    distance_km: 4.25,
    kcal: 90,
    on_target_pct: 96,
    dips: [],
    power_trace: [100, 200, 300],
    cadence_trace: [80, 100, 130],
    ...change,
  } as SessionDetail;
}

describe('session view (L2-085)', () => {
  it('writes the date line in local time, with Ride saved when just finished', () => {
    expect(dateLine('2026-11-18T18:10:00+00:00', false, 'UTC')).toBe('Wednesday 18 Nov at 18:10');
    expect(dateLine('2026-11-18T18:10:00+00:00', true, 'UTC')).toBe(
      'Ride saved · Wednesday 18 Nov at 18:10',
    );
    expect(dateLine('2026-11-18T03:05:00+00:00', false, 'America/New_York')).toBe(
      'Tuesday 17 Nov at 22:05',
    );
  });

  it('writes the change of average power with its sign, or nothing without a previous attempt', () => {
    expect(deltaOf(session(), 'UTC')).toEqual({
      text: '+12 W',
      direction: 'up',
      since: 'vs last time, 17 Nov',
    });
    expect(deltaOf(session({ avg_power: 146 }), 'UTC')?.text).toBe('−4 W');
    expect(deltaOf(session({ avg_power: 150 }), 'UTC')).toEqual(
      expect.objectContaining({ text: '0 W', direction: 'same' }),
    );
    expect(deltaOf(session({ previous: null }))).toBeNull();
  });

  it('says Ended early only for an unfinished ride', () => {
    expect(endedEarly(session())).toBeNull();
    expect(
      endedEarly(session({ completed: false, ridden_seconds: 1120, planned_seconds: 2160 })),
    ).toBe('Ended early · 18:40 of 36:00');
    expect(
      endedEarly(session({ completed: false, ridden_seconds: 3700, planned_seconds: 3720 })),
    ).toBe('Ended early · 1:01:40 of 1:02:00');
  });

  it('lists each dip with its kind, round, detail and drop', () => {
    const view = dipListView(
      session({
        dips: [
          { start: 697, duration: 15, target: 98, low: 86, kind: 'work', round: 3 },
          { start: 1027, duration: 13, target: 72, low: 60, kind: 'rest', round: null },
        ],
      }),
    );
    expect(view.onTarget).toBe('96% on target');
    expect(view.lead).toBe('2 times, 0:28 in all, your legs fell under target. Last time: 1.');
    expect(view.rows).toEqual([
      {
        time: '11:37',
        what: 'Work · round 3',
        detail: 'Down to 86 rpm for 15s · target 98',
        drop: '−12',
        dropLabel: '12 rpm under',
      },
      {
        time: '17:07',
        what: 'Recover',
        detail: 'Down to 60 rpm for 13s · target 72',
        drop: '−12',
        dropLabel: '12 rpm under',
      },
    ]);
  });

  it('writes one time and leaves out Last time without a previous attempt', () => {
    const view = dipListView(
      session({
        previous: null,
        dips: [{ start: 60, duration: 6, target: 98, low: 90, kind: 'steady', round: null }],
      }),
    );
    expect(view.lead).toBe('1 time, 0:06 in all, your legs fell under target.');
    expect(view.rows[0]!.what).toBe('Steady');
  });

  it('draws the traces on the ridden seconds with the aims of counted segments and the dips', () => {
    const view = tracesView(
      session({
        dips: [{ start: 130, duration: 8, target: 100, low: 88, kind: 'work', round: 1 }],
      }),
    );
    expect(view.total).toBe(600);
    expect(view.cadence).toBe('0,40 5,20 10,0');
    expect(view.aims).toEqual([
      { x1: 120, x2: 180, y: 20 },
      { x1: 180, x2: 600, y: 50 },
    ]);
    expect(view.bands).toEqual([{ x: 130, width: 8 }]);
    expect(view.work).toEqual([{ x: 120, width: 60 }]);
    expect(view.powerMax).toBe(500);
    expect(view.power).toBe('0,400 5,300 10,200');
    expect(view.grid).toEqual([60, 40, 20]);
    expect(view.yLabels).toEqual([
      { text: '100', at: 25 },
      { text: '80', at: 50 },
      { text: '60', at: 75 },
    ]);
    expect(view.ticks.map((t) => t.text)).toEqual(['0:00', '5:00', '10:00']);
    expect(view.label).toBe(
      'Cadence and power over the ride: average cadence 84 rpm, 1 dip; average power 162 W, peak 400 W',
    );
  });

  it('clips segments to an unfinished ride', () => {
    const view = tracesView(session({ ridden_seconds: 150, completed: false }));
    expect(view.total).toBe(150);
    expect(view.aims).toEqual([{ x1: 120, x2: 150, y: 20 }]);
    expect(view.work).toEqual([{ x: 120, width: 30 }]);
  });

  it('shows the six totals with distance to one decimal', () => {
    expect(totals(session({ ridden_seconds: 3725 }))).toEqual([
      { label: 'Time', value: '1:02:05', unit: null },
      { label: 'Best 1 min', value: '290', unit: 'W' },
      { label: 'Max power', value: '400', unit: 'W' },
      { label: 'Avg cadence', value: '84', unit: 'rpm' },
      { label: 'Distance', value: '4.3', unit: 'km' },
      { label: 'Energy', value: '90', unit: 'kcal' },
    ]);
  });

  it('writes the weekly line until the goal is hit', () => {
    expect(weekLine({ rides: 3, goal: 4 })).toEqual({
      before: '3 of 4 rides this week. ',
      emphasis: '1 more to hit your goal.',
      after: '',
      hit: false,
    });
    expect(weekLine({ rides: 0, goal: 4 }).emphasis).toBe('4 more to hit your goal.');
    expect(weekLine({ rides: 5, goal: 4 })).toEqual({
      before: '',
      emphasis: 'Weekly goal hit',
      after: ' — 5 rides this week.',
      hit: true,
    });
  });

  it('builds this week Monday to Sunday, naming each day', () => {
    const progress = {
      today: '2026-11-18',
      ride_days: ['2026-11-15', '2026-11-16', '2026-11-18'],
    } as ProgressReport;
    const days = calendarOf(progress);
    expect(days.map((d) => d.label)).toEqual([
      'Monday 16 Nov, ridden',
      'Tuesday 17 Nov, not ridden',
      'Wednesday 18 Nov, ridden',
      'Thursday 19 Nov, not ridden',
      'Friday 20 Nov, not ridden',
      'Saturday 21 Nov, not ridden',
      'Sunday 22 Nov, not ridden',
    ]);
    expect(days.map((d) => d.letter).join('')).toBe('MTWTFSS');
    expect(days.filter((d) => d.today).map((d) => d.label)).toEqual(['Wednesday 18 Nov, ridden']);
    expect(days.filter((d) => d.future)).toHaveLength(4);
  });

  it('builds several weeks, oldest first, across a month end', () => {
    const days = calendarOf(
      { today: '2026-12-01', ride_days: ['2026-11-30'] } as ProgressReport,
      2,
    );
    expect(days).toHaveLength(14);
    expect(days[0]!.label).toBe('Monday 23 Nov, not ridden');
    expect(days[7]!.label).toBe('Monday 30 Nov, ridden');
    expect(days[8]!.today).toBe(true);
  });
});
