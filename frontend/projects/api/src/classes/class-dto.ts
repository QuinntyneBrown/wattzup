import type { Plan } from '../workout/plan';
import type { VideoDto } from './video-dto';

/**
 * A class as the catalogue serves it (L2-080, ADR 0028): what the library shows and the class ride follows, from its
 * shelf and the rider level it opens at to the world it rides in.
 */
export interface ClassDto {
  readonly id: string;
  readonly title: string;
  readonly channel: string;
  readonly focus: string;
  readonly lengthSeconds: number;
  readonly opensAtLevel: number;
  readonly shelfId: string;
  readonly summary: string;
  readonly world: string;
  readonly plan: Plan;
  readonly video: VideoDto;
}
