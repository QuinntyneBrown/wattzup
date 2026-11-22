/** Where one of World loading's steps stands (L2-152 AC1): each is said in words, never by colour alone. */
export type LoadStepState = 'done' | 'current' | 'waiting' | 'failed' | 'skipped';

/** One of the load card's three steps: "Download the world", with its state and its detail ("7.6 of 18.9 MB"). */
export interface LoadStepView {
  readonly label: string;
  readonly state: LoadStepState;
  readonly detail: string;
}
