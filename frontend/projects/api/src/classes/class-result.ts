/**
 * A finished class's result, which the class hands to Results in the navigation's state (L2-078 AC1,
 * docs/detailed-designs/results/show-results): the class, its title, its length, the output in kJ and the share of
 * running seconds on target.
 */
export interface ClassResult {
  readonly classId: string;
  readonly title: string;
  readonly elapsedSeconds: number;
  readonly outputKj: number;
  /** From 0 to 1. */
  readonly onTargetShare: number;
}
