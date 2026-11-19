import type { ClassCatalogue, ClassEntry, WorkoutPlan } from '@wattzup/api';
import { cardView, countLabel, nextTab, thumbnailUrl, visibleShelves } from './class-library-view';

const shelf = { id: 'short', title: '20 min', tagline: 'Short.' };

function entry(plan: WorkoutPlan, change: Partial<ClassEntry> = {}): ClassEntry {
  return {
    id: 'a-class',
    title: 'A Class',
    channel: 'Wattzup Studio',
    focus: 'HIIT',
    description: '',
    shelf,
    plan,
    ...change,
  };
}

const flat: WorkoutPlan = {
  kind: 'flat',
  level: 12,
  minutes: 60,
  cadence: 85,
  video: null,
};

const intervals: WorkoutPlan = {
  kind: 'intervals',
  warmup: { seconds: 300, level: 9, cadence: 80 },
  sets: [
    {
      rounds: 6,
      work_seconds: 60,
      work_level: 22,
      work_cadence: 100,
      rest_seconds: 60,
      rest_level: 7,
      rest_cadence: 72,
    },
  ],
  cooldown: { seconds: 180, level: 7, cadence: 70 },
  video: { video_id: 'QUoToFsMNig', start_seconds: 12 },
};

const hiit: WorkoutPlan = {
  kind: 'hiit',
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: true,
  video: null,
};

describe('class-library-view (L2-079)', () => {
  it('builds an intervals card with its thumbnail, length, meta and strip (AC5, AC6)', () => {
    const view = cardView(entry(intervals));
    expect(view.href).toBe('/classes/a-class');
    expect(view.length).toBe('20:00');
    expect(view.meta).toBe('Wattzup Studio · HIIT · Peak L22');
    expect(view.cover).toBe('https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg');
    expect(view.noVideo).toBe(false);
    expect(view.profileTotal).toBe(1200);
    expect(view.profileLabel).toBe('Resistance profile: 1 set · 6 efforts');
    expect(view.profile).toHaveLength(14);
  });

  it('builds a flat card with the poster and h:mm:ss from one hour (AC5, AC7)', () => {
    const view = cardView(entry(flat));
    expect(view.length).toBe('1:00:00');
    expect(view.meta).toBe('Wattzup Studio · HIIT · Peak L12');
    expect(view.cover).toBeNull();
    expect(view.noVideo).toBe(true);
  });

  it('builds a hiit card with its peak level', () => {
    expect(cardView(entry(hiit)).meta).toBe('Wattzup Studio · HIIT · Peak L18');
  });

  it('builds the thumbnail only from a valid video id (ADR 0014)', () => {
    expect(thumbnailUrl('QUoToFsMNig')).toBe('https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg');
    expect(thumbnailUrl('../evil/x00')).toBeNull();
    expect(thumbnailUrl('short')).toBeNull();
    expect(thumbnailUrl(null)).toBeNull();
  });

  it('counts classes', () => {
    expect(countLabel(1)).toBe('1 class');
    expect(countLabel(2)).toBe('2 classes');
  });

  it('shows every shelf under All and one shelf under its tab (AC3)', () => {
    const catalogue: ClassCatalogue = {
      shelves: [
        { ...shelf, classes: [] },
        { id: 'long', title: '60 min', tagline: '', classes: [] },
      ],
    };
    expect(visibleShelves(catalogue, 'all').map((s) => s.id)).toEqual(['short', 'long']);
    expect(visibleShelves(catalogue, 'long').map((s) => s.id)).toEqual(['long']);
  });

  it('moves between the tabs with the arrow keys, Home and End, wrapping around (AC2)', () => {
    const tabs = ['all', 'short', 'long'];
    expect(nextTab(tabs, 'all', 'ArrowRight')).toBe(1);
    expect(nextTab(tabs, 'long', 'ArrowRight')).toBe(0);
    expect(nextTab(tabs, 'all', 'ArrowLeft')).toBe(2);
    expect(nextTab(tabs, 'short', 'Home')).toBe(0);
    expect(nextTab(tabs, 'short', 'End')).toBe(2);
    expect(nextTab(tabs, 'short', 'Enter')).toBeNull();
  });
});
