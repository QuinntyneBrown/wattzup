/** A class's cover: its YouTube video's medium thumbnail (ADR 0028). */
export function classCover(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;
}
