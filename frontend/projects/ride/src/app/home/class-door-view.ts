import type { ClassCatalogueDto } from '@telo/api';
import { formatClock } from '@telo/components';
import { classCover } from '../classes/class-cover';

/** The Classes door's featured class (L2-035 AC2): its title, its length ("30:00") and its cover. */
export interface ClassDoorView {
  readonly classId: string;
  readonly title: string;
  readonly length: string;
  readonly coverUrl: string;
}

/** The shelf the featured class comes from until group sessions name one (slice 14.2). */
const FEATURED_SHELF = '30-min';

/**
 * The Classes door's featured class: the first class on the 30 min shelf that the rider's level has opened, or none
 * (docs/detailed-designs/home/choose-the-next-ride, Featured class).
 */
export function classDoorView(catalogue: ClassCatalogueDto, level: number): ClassDoorView | null {
  const featured = catalogue.classes.find(
    (lesson) => lesson.shelfId === FEATURED_SHELF && lesson.opensAtLevel <= level,
  );
  return featured
    ? {
        classId: featured.id,
        title: featured.title,
        length: formatClock(featured.lengthSeconds),
        coverUrl: classCover(featured.video.videoId),
      }
    : null;
}
