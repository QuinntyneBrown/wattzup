/**
 * Where an arrow key moves the choice in a WAI-ARIA radio group: ArrowDown or ArrowRight to the next option, ArrowUp or
 * ArrowLeft to the one before, wrapping at either end and passing over any option that cannot be chosen. `null` for
 * another key, or when no other option can be chosen.
 */
export function radioStep(key: string, index: number, disabled: readonly boolean[]): number | null {
  const step =
    key === 'ArrowDown' || key === 'ArrowRight'
      ? 1
      : key === 'ArrowUp' || key === 'ArrowLeft'
        ? -1
        : 0;
  if (step === 0) return null;
  const count = disabled.length;
  for (let offset = 1; offset < count; offset++) {
    const next = (index + step * offset + count) % count;
    if (!disabled[next]) return next;
  }
  return null;
}
