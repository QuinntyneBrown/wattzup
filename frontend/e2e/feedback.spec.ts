import type { Request } from '@playwright/test';
import type { ApiReply } from './fixtures/api';
import { startCustomRide } from './fixtures/custom-ride';
import { expect, test } from './fixtures/test';
import { FeedbackDialog } from './pages/feedback.dialog';

// Slice 26.1, Send feedback (L2-116, L2-117, L2-118): a bug, an idea or kudos from the middle of a custom ride.
//
// Given a custom ride, when the rider presses Feedback, then the ride pauses and "Send feedback" opens with "Close
//   feedback"; Bug, Improvement and Kudos each change the field, its example and the send button; Bug alone offers
//   "Attach diagnostics", checked; the context reads "Attached from Ride" with the ride's state; the footer reads
//   "Context is sent with your note." (L2-116 AC1, AC2; L2-117 AC1 to AC3).
// Given an empty message or one over 2,000 characters, then the send button is disabled, the count shown (L2-116 AC3).
// Given a phone, then the dialog is a bottom sheet; from sm a 400 px popover under the button (L2-116 AC4).
// Given a bug report with diagnostics, when it is sent, then every control is disabled, the button reads "Sending…"
//   with aria-busy and a hidden status reads "Sending your feedback…"; the report carries the packet log and the app
//   version and no token; once accepted the thanks reads "Thanks — we’re on it." with Send another and Done, and Done
//   leaves the ride paused (L2-117 AC4; L2-118 AC1, AC2, AC5).
// Given kudos accepted, then the thanks fits it, and Send another starts again (L2-118 AC3).
// Given a failed send, then the message is kept, an error announced and the button enabled again (L2-118 AC4).

const CONTEXT_TERMS = [
  'Workout',
  'Elapsed',
  'Segment',
  'Resistance',
  'Plan level',
  'Cadence',
  'Power',
  'Heart rate',
  'Distance',
  'Ride state',
  'View',
  'Machine',
  'Bluetooth',
  'Last command',
];

/** A handler that answers only once `release` is called. */
function held(reply: ApiReply): {
  handler: (request: Request) => Promise<ApiReply>;
  release: () => void;
} {
  let release = (): void => undefined;
  const answer = new Promise<ApiReply>((resolve) => (release = () => resolve(reply)));
  return { handler: () => answer, release };
}

test('Feedback pauses the ride and offers a bug, an idea or kudos, with the ride’s context (L2-116 AC1, AC2; L2-117 AC1 to AC3)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  // The dialog's code loads on demand and a zoneless app renders on a timer: let time run, as it does for a rider.
  await page.clock.resume();
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);

  await expect(feedback.heading).toHaveText('Send feedback');
  await expect(feedback.close).toBeVisible();
  await expect(ride.resumeBehindDialog).toBeVisible();
  await expect(feedback.kinds).toHaveText(['Bug', 'Improvement', 'Kudos']);
  await expect(feedback.kind('Bug')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('What went wrong?')).toBeVisible();
  await expect(feedback.message).toHaveAttribute(
    'placeholder',
    'e.g. Resistance stayed at L8 when the video dropped to recovery.',
  );
  await expect(feedback.send).toHaveText('Report bug');
  await expect(feedback.send).toBeDisabled();
  await expect(feedback.attach).toBeChecked();
  await expect(feedback.attachHint).toHaveText(
    'Bike connection log and app version, so we can reproduce it.',
  );

  await feedback.kind('Improvement').click();
  await expect(page.getByLabel('What could be better?')).toBeVisible();
  await expect(feedback.message).toHaveAttribute(
    'placeholder',
    'e.g. Let me save a custom ride so I don’t rebuild it every week.',
  );
  await expect(feedback.send).toHaveText('Send idea');
  await expect(feedback.attach).toHaveCount(0);

  await feedback.kind('Kudos').click();
  await expect(page.getByLabel('What’s working for you?')).toBeVisible();
  await expect(feedback.message).toHaveAttribute(
    'placeholder',
    'e.g. The resistance landing on the beat makes the HIIT videos so much better.',
  );
  await expect(feedback.send).toHaveText('Send kudos');
  await expect(feedback.attach).toHaveCount(0);

  await expect(feedback.contextFrom).toHaveText('Attached from Ride');
  await expect(feedback.contextSummary).toHaveText(/ · Warm-up · \d+:\d\d in$/);
  await expect(feedback.contextToggle).toHaveAttribute('aria-expanded', 'false');
  await feedback.contextToggle.click();
  await expect(feedback.contextToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(feedback.contextTerms).toHaveText(CONTEXT_TERMS);
  await expect(feedback.note).toHaveText('Context is sent with your note.');

  await feedback.close.click();
  await expect(feedback.root).toHaveCount(0);
  await expect(ride.resume).toBeVisible();
});

test('the send button waits for a message of at most 2,000 characters, and shows the count past it (L2-116 AC3)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);

  await feedback.message.fill('x'.repeat(2000));
  await expect(feedback.send).toBeEnabled();
  await expect(feedback.count).toHaveCount(0);
  await feedback.message.fill('x'.repeat(2001));
  await expect(feedback.send).toBeDisabled();
  await expect(feedback.count).toHaveText('2,001 / 2,000 characters');
  await expect(feedback.message).toHaveAttribute('aria-invalid', 'true');
});

for (const [width, form] of [
  [390, 'a bottom sheet'],
  [1024, 'a 400 px popover under the button'],
] as const) {
  test(`at ${width} px the dialog is ${form} (L2-116 AC4)`, async ({ page, bluetooth }) => {
    await page.setViewportSize({ width, height: 800 });
    const ride = await startCustomRide(page, bluetooth);
    await page.clock.resume();
    await ride.feedback.click();
    const panel = await new FeedbackDialog(page).panel.boundingBox();
    const button = await ride.feedback.boundingBox();

    if (width === 390) {
      expect(panel).toMatchObject({ x: 0, width: 390 });
      expect(panel!.y + panel!.height).toBeCloseTo(800, 0);
    } else {
      expect(panel!.width).toBe(400);
      expect(panel!.y).toBeGreaterThanOrEqual(button!.y + button!.height);
      expect(panel!.y).toBeLessThan(button!.y + button!.height + 24);
    }
  });
}

test('a bug report sends with diagnostics, then thanks; Done leaves the ride paused (L2-117 AC4; L2-118 AC1, AC2, AC5) @critical', async ({
  page,
  bluetooth,
  api,
}) => {
  const answer = held({ status: 201, body: { id: 'fb-1' } });
  api.answer('POST', '/api/feedback', answer.handler);
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);

  await feedback.message.fill('Resistance stayed at L8 after the sprint ended.');
  await feedback.send.click();
  await expect(feedback.send).toHaveText('Sending…');
  await expect(feedback.send).toHaveAttribute('aria-busy', 'true');
  await expect(feedback.send).toBeDisabled();
  await expect(feedback.sending).toHaveText('Sending your feedback…');
  for (const radio of await feedback.kinds.all()) await expect(radio).toBeDisabled();
  await expect(feedback.message).toBeDisabled();
  await expect(feedback.attach).toBeDisabled();
  await expect(feedback.close).toBeDisabled();

  const [sent] = api.sentBodies('POST', '/api/feedback') as {
    kind: string;
    message: string;
    context: { term: string; value: string }[];
    diagnostics: { appVersion: string; packetLog: string } | null;
  }[];
  expect(sent.kind).toBe('bug');
  expect(sent.message).toBe('Resistance stayed at L8 after the sprint ended.');
  expect(sent.context.map((fact) => fact.term)).toEqual(CONTEXT_TERMS);
  expect(sent.diagnostics?.appVersion).toMatch(/^\d+\.\d+\.\d+ · client \S+$/);
  const lines = sent.diagnostics!.packetLog.trim().split('\n');
  expect(lines.map((line) => (JSON.parse(line) as { hex: string }).hex)).toEqual(
    bluetooth
      .writes()
      .map((write) => write.hex)
      .slice(0, lines.length),
  );
  expect(JSON.stringify(sent)).not.toMatch(/token|cookie|session/i);

  answer.release();
  await expect(feedback.heading).toHaveText('Feedback sent');
  await expect(feedback.thanks).toHaveText('Thanks — we’re on it.');
  await expect(feedback.followUp).toHaveText(
    'Bug reports go straight to the team. If we need more detail, we’ll email you.',
  );
  await expect(feedback.sendAnother).toBeVisible();
  await feedback.done.click();
  await expect(feedback.root).toHaveCount(0);
  await expect(ride.resume).toBeVisible();
});

test('kudos sent reads thanks that fit it, and Send another starts again (L2-118 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  api.answer('POST', '/api/feedback', () => ({ status: 201, body: { id: 'fb-1' } }));
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);

  await feedback.kind('Kudos').click();
  await feedback.message.fill('The resistance landing on the beat is great.');
  await feedback.send.click();
  await expect(feedback.thanks).toHaveText('Thanks — that made our day.');
  await expect(feedback.followUp).toHaveText('Kudos go straight to the people who built it.');
  const [sent] = api.sentBodies('POST', '/api/feedback') as {
    kind: string;
    diagnostics: unknown;
  }[];
  expect(sent).toMatchObject({ kind: 'kudos', diagnostics: null });

  await feedback.sendAnother.click();
  await expect(feedback.heading).toHaveText('Send feedback');
  await expect(feedback.message).toHaveValue('');
});

test('a failed send keeps the message, says so and lets the rider try again (L2-118 AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  api.answer('POST', '/api/feedback', () => ({ status: 503, body: { code: 'unavailable' } }));
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await ride.feedback.click();
  const feedback = new FeedbackDialog(page);

  await feedback.kind('Improvement').click();
  await feedback.message.fill('Let me save a custom ride.');
  await feedback.send.click();

  await expect(feedback.error).toHaveText(
    'Your feedback didn’t send. Check your connection and try again.',
  );
  await expect(feedback.message).toHaveValue('Let me save a custom ride.');
  await expect(feedback.send).toHaveText('Send idea');
  await expect(feedback.send).toBeEnabled();
});
