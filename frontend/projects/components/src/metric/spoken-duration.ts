/**
 * Whole seconds as a screen reader says them: "29 seconds", "1 minute", "2 minutes 59 seconds". Zero reads
 * "0 seconds".
 */
export function spokenDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const parts = [
    minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : '',
    rest > 0 || minutes === 0 ? `${rest} ${rest === 1 ? 'second' : 'seconds'}` : '',
  ];
  return parts.filter(Boolean).join(' ');
}
