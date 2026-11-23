/**
 * A class's video as the catalogue serves it (ADR 0012, ADR 0014): the YouTube video id, validated by the backend,
 * and the sync offset, the second of the video at which the ride's 0:00 falls.
 */
export interface VideoDto {
  readonly videoId: string;
  readonly syncOffsetSeconds: number;
}
