// Unit test
// Traces to: L2-116 AC2, AC3; L2-117 AC1, AC4; L2-118 AC1, AC2, AC4
// Description: Send feedback's draft: Bug first with diagnostics on; the send waits for a message of at most 2,000
// characters; a bug report with diagnostics carries the last 1 MB of the packet log and the app version, and other
// kinds or an unticked box carry none; it is sent once while sending; a refusal keeps the message; Send another empties.
import { TestBed } from '@angular/core/testing';
import {
  BUILD_INFO,
  FEEDBACK_API,
  type FeedbackContext,
  type FeedbackRequest,
  PACKET_LOG,
  type PacketLog,
} from '@telo/api';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { FEEDBACK_PACKET_LOG_BYTES, FeedbackStore } from './feedback-store';

const CONTEXT: FeedbackContext = {
  screen: 'Ride',
  summary: 'HIIT · Recover · 6:52 in',
  facts: [{ term: 'Elapsed', value: '6:52 / 30:00' }],
};

describe('FeedbackStore', () => {
  let sent: FeedbackRequest[];
  let reply: () => Observable<void>;
  let tails: number[];
  let store: FeedbackStore;

  beforeEach(() => {
    sent = [];
    tails = [];
    reply = () => of(undefined);
    const packetLog = {
      tail: (maxBytes: number) => {
        tails.push(maxBytes);
        return '{"hex":"F0 B1 01 08"}\n';
      },
    } as Partial<PacketLog> as PacketLog;
    TestBed.configureTestingModule({
      providers: [
        FeedbackStore,
        {
          provide: FEEDBACK_API,
          useValue: {
            send: (request: FeedbackRequest) => {
              sent.push(request);
              return reply();
            },
          },
        },
        { provide: PACKET_LOG, useValue: packetLog },
        { provide: BUILD_INFO, useValue: { version: '2.0.0', commit: 'a1b2c3d' } },
      ],
    });
    store = TestBed.inject(FeedbackStore);
  });

  it('starts on Bug with diagnostics attached, waiting for a message', () => {
    expect(store.kind()).toBe('bug');
    expect(store.attachDiagnostics()).toBe(true);
    expect(store.copy().send).toBe('Report bug');
    expect(store.canSend()).toBe(false);
  });

  it.each([
    ['', false],
    ['   ', false],
    ['x', true],
    ['x'.repeat(2000), true],
    ['x'.repeat(2001), false],
  ])('a message of %#: can send is %s', (message, canSend) => {
    store.message.set(message);

    expect(store.canSend()).toBe(canSend);
    expect(store.tooLong()).toBe(message.length > 2000);
  });

  it('sends a bug report with the last 1 MB of the packet log and the app version', async () => {
    store.message.set('Resistance stuck.');
    await store.send(CONTEXT);

    expect(tails).toEqual([FEEDBACK_PACKET_LOG_BYTES]);
    expect(FEEDBACK_PACKET_LOG_BYTES).toBe(1048576);
    expect(sent).toEqual([
      {
        kind: 'bug',
        message: 'Resistance stuck.',
        context: CONTEXT.facts,
        diagnostics: { appVersion: '2.0.0 · client a1b2c3d', packetLog: '{"hex":"F0 B1 01 08"}\n' },
      },
    ]);
    expect(store.status()).toBe('sent');
  });

  it.each([
    ['an unticked bug report', 'bug', false],
    ['an idea', 'improvement', true],
    ['kudos', 'kudos', true],
  ] as const)('sends %s without diagnostics', async (_, kind, attach) => {
    store.kind.set(kind);
    store.attachDiagnostics.set(attach);
    store.message.set('Note.');
    await store.send(CONTEXT);

    expect(sent[0]).toMatchObject({ kind, diagnostics: null });
    expect(tails).toEqual([]);
  });

  it('sends once while sending, then keeps the message when refused', async () => {
    const answer = new Subject<void>();
    reply = () => answer;
    store.message.set('Let me save a ride.');
    const sending = store.send(CONTEXT);

    expect(store.status()).toBe('sending');
    expect(store.canSend()).toBe(false);
    await store.send(CONTEXT);
    expect(sent).toHaveLength(1);

    answer.error(new Error('503'));
    await sending;
    expect(store.status()).toBe('failed');
    expect(store.message()).toBe('Let me save a ride.');
    expect(store.canSend()).toBe(true);
  });

  it('treats a refusal from the start as failed', async () => {
    reply = () => throwError(() => new Error('offline'));
    store.message.set('Note.');
    await store.send(CONTEXT);

    expect(store.status()).toBe('failed');
  });

  it('starts again empty with Send another, keeping the kind', async () => {
    store.kind.set('kudos');
    store.message.set('Great.');
    await store.send(CONTEXT);
    store.sendAnother();

    expect(store.status()).toBe('editing');
    expect(store.message()).toBe('');
    expect(store.kind()).toBe('kudos');
  });
});
