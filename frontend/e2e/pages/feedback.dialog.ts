import type { Locator, Page } from '@playwright/test';

/**
 * Send feedback (docs/mocks/dialogs/feedback/): the kind, the message, Attach diagnostics for a bug, the ride's context,
 * the send button, and the sent state with its thanks (L2-116 to L2-118).
 */
export class FeedbackDialog {
  readonly root: Locator;
  /** The panel itself, to measure the bottom sheet and the popover. */
  readonly panel: Locator;
  readonly heading: Locator;
  readonly close: Locator;
  readonly kinds: Locator;
  readonly message: Locator;
  /** "2,001 / 2,000 characters", once the message is too long. */
  readonly count: Locator;
  readonly attach: Locator;
  readonly attachHint: Locator;
  readonly contextToggle: Locator;
  readonly contextFrom: Locator;
  readonly contextSummary: Locator;
  readonly contextTerms: Locator;
  readonly note: Locator;
  readonly send: Locator;
  readonly sending: Locator;
  readonly error: Locator;
  readonly thanks: Locator;
  readonly followUp: Locator;
  readonly sendAnother: Locator;
  readonly done: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: /^(Send feedback|Feedback sent)$/ });
    this.panel = this.root.locator('.feedback');
    this.heading = this.root.getByRole('heading', { level: 1 });
    this.close = this.root.getByRole('button', { name: 'Close feedback' });
    this.kinds = this.root.getByRole('radiogroup', { name: 'Type of feedback' }).getByRole('radio');
    this.message = this.root.locator('#feedback-message');
    this.count = this.root.locator('.feedback__count');
    this.attach = this.root.getByRole('checkbox', { name: /^Attach diagnostics/ });
    this.attachHint = this.root.locator('.feedback__check-hint');
    this.contextToggle = this.root.locator('.feedback-context__toggle');
    this.contextFrom = this.root.locator('.feedback-context__from');
    this.contextSummary = this.root.locator('.feedback-context__summary');
    this.contextTerms = this.root.locator('.feedback-context__details dt');
    this.note = this.root.locator('.feedback__note');
    this.send = this.root.locator('.feedback__send');
    this.sending = this.root.getByRole('status').filter({ hasText: 'Sending your feedback…' });
    this.error = this.root.getByRole('alert');
    this.thanks = this.root.locator('.feedback__thanks');
    this.followUp = this.root.locator('.feedback__follow-up');
    this.sendAnother = this.root.getByRole('button', { name: 'Send another' });
    this.done = this.root.getByRole('button', { name: 'Done' });
  }

  kind(name: 'Bug' | 'Improvement' | 'Kudos'): Locator {
    return this.kinds.filter({ hasText: name });
  }
}
