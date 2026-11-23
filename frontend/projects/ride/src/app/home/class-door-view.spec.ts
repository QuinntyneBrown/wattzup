// Unit test
// Traces to: L2-035 AC1, AC2
// Description: the Classes door features the first class on the 30 min shelf that the rider's level has opened, with
// its title, its length as minutes and seconds, and its cover; with none open there, it features nothing.
import type { ClassCatalogueDto, ClassDto } from '@telo/api';
import { classDoorView } from './class-door-view';

const lesson = (id: string, shelfId: string, opensAtLevel: number): ClassDto =>
  ({
    id,
    title: `Class ${id}`,
    lengthSeconds: 1800,
    opensAtLevel,
    shelfId,
    video: { videoId: 'QUoToFsMNig', syncOffsetSeconds: 0 },
  }) as ClassDto;

const catalogue = (...classes: ClassDto[]): ClassCatalogueDto => ({ shelves: [], classes });

describe('classDoorView', () => {
  it('features the first open class on the 30 min shelf, with its length and cover', () => {
    expect(classDoorView(catalogue(lesson('a', '45-min', 1), lesson('b', '30-min', 1)), 1)).toEqual(
      {
        classId: 'b',
        title: 'Class b',
        length: '30:00',
        coverUrl: 'https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg',
      },
    );
  });

  it('passes over a class the rider level has not opened', () => {
    const view = classDoorView(catalogue(lesson('b', '30-min', 5), lesson('c', '30-min', 1)), 4);
    expect(view?.classId).toBe('c');
  });

  it('features nothing when no class on the shelf is open', () => {
    expect(classDoorView(catalogue(lesson('b', '30-min', 5)), 1)).toBeNull();
  });
});
