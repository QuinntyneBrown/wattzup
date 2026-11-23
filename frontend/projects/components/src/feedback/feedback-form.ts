import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { FeedbackContext, FeedbackKind } from '@telo/api';
import { Button } from '../button/button';
import { FeedbackContextDetails } from './feedback-context';

/** One kind's words: its field, example, send button and thanks. */
export interface FeedbackFormCopy {
  readonly field: string;
  readonly placeholder: string;
  readonly send: string;
  readonly thanks: string;
  readonly followUp: string;
}

/** Where the draft is (L2-118). */
export type FeedbackFormStatus = 'editing' | 'sending' | 'sent' | 'failed';

const KINDS: readonly {
  readonly kind: FeedbackKind;
  readonly name: string;
  readonly modifier: string;
}[] = [
  { kind: 'bug', name: 'Bug', modifier: 'bug' },
  { kind: 'improvement', name: 'Improvement', modifier: 'idea' },
  { kind: 'kudos', name: 'Kudos', modifier: 'kudos' },
];

/**
 * Send feedback's panel (docs/mocks/dialogs/feedback/, block `feedback`): "Type of feedback", the message and its count
 * past the limit, Attach diagnostics for a bug, the context it attaches, the footer, the sending state, the error, and
 * the thanks with Send another and Done (L2-116 to L2-118). The message and the context render as text, never as HTML.
 * The dialog that hosts it labels itself by the title's id, `feedback-title`.
 */
@Component({
  selector: 'wz-feedback-form',
  templateUrl: './feedback-form.html',
  styleUrl: './feedback-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, FeedbackContextDetails],
})
export class FeedbackForm {
  readonly kind = input.required<FeedbackKind>();
  readonly copy = input.required<FeedbackFormCopy>();
  readonly message = input.required<string>();
  readonly attachDiagnostics = input.required<boolean>();
  readonly context = input.required<FeedbackContext>();
  readonly status = input.required<FeedbackFormStatus>();
  readonly canSend = input.required<boolean>();
  readonly maxLength = input.required<number>();

  readonly kindChanged = output<FeedbackKind>();
  readonly messageChanged = output<string>();
  readonly attachChanged = output<boolean>();
  readonly sendRequested = output<void>();
  readonly anotherRequested = output<void>();
  /** "Close feedback" or "Done" was pressed. */
  readonly dismissed = output<void>();

  protected readonly kinds = KINDS;
  protected readonly sending = computed(() => this.status() === 'sending');
  protected readonly tooLong = computed(() => this.message().length > this.maxLength());
  protected readonly countText = computed(
    () =>
      `${this.message().length.toLocaleString('en-US')} / ${this.maxLength().toLocaleString('en-US')} characters`,
  );
  protected readonly badge = computed(
    () => KINDS.find((entry) => entry.kind === this.kind())?.modifier ?? 'bug',
  );

  protected typed(event: Event): void {
    this.messageChanged.emit((event.target as HTMLTextAreaElement).value);
  }

  protected checked(event: Event): void {
    this.attachChanged.emit((event.target as HTMLInputElement).checked);
  }

  /** The radio group's arrow keys move the choice, as a radio group's do. */
  protected step(event: KeyboardEvent, index: number): void {
    const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (by === undefined) return;
    event.preventDefault();
    const next = (index + by + KINDS.length) % KINDS.length;
    this.kindChanged.emit(KINDS[next]!.kind);
    const group = (event.currentTarget as HTMLElement).parentElement;
    (group?.children[next] as HTMLElement | undefined)?.focus();
  }
}
