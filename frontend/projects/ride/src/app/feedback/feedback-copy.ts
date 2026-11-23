import type { FeedbackKind } from '@telo/api';

/** One kind's words in Send feedback (L2-116 AC2, L2-118 AC2, AC3). */
export interface FeedbackKindCopy {
  /** The radio's name. */
  readonly name: string;
  readonly field: string;
  readonly placeholder: string;
  readonly send: string;
  readonly thanks: string;
  readonly followUp: string;
}

/** Each kind's field, example, send button and thanks (docs/detailed-designs/feedback/send-feedback). */
export const FEEDBACK_KIND_COPY: Record<FeedbackKind, FeedbackKindCopy> = {
  bug: {
    name: 'Bug',
    field: 'What went wrong?',
    placeholder: 'e.g. Resistance stayed at L8 when the video dropped to recovery.',
    send: 'Report bug',
    thanks: 'Thanks — we’re on it.',
    followUp: 'Bug reports go straight to the team. If we need more detail, we’ll email you.',
  },
  improvement: {
    name: 'Improvement',
    field: 'What could be better?',
    placeholder: 'e.g. Let me save a custom ride so I don’t rebuild it every week.',
    send: 'Send idea',
    thanks: 'Thanks — that’s a good one.',
    followUp: 'Every idea is read by the team that decides what we build next.',
  },
  kudos: {
    name: 'Kudos',
    field: 'What’s working for you?',
    placeholder: 'e.g. The resistance landing on the beat makes the HIIT videos so much better.',
    send: 'Send kudos',
    thanks: 'Thanks — that made our day.',
    followUp: 'Kudos go straight to the people who built it.',
  },
};
