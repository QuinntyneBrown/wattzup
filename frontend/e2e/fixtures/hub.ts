import type { Page, WebSocketRoute } from '@playwright/test';

const SEPARATOR = '\x1e';
const LOCAL = ['localhost', '127.0.0.1'];

interface HubMessage {
  type?: number;
  target?: string;
  arguments?: unknown[];
  invocationId?: string;
}

/**
 * Plays the backend's ride hub (`/hubs/ride`) for the page, speaking SignalR's JSON protocol: negotiation, the
 * handshake, invocations both ways and completions (L2-148 AC1). Until the spec calls `open()`, any request to a hub
 * is unanswered and fails the spec; so is an invocation awaiting a result that the spec did not `answer`.
 */
export class HubFixture {
  private opened = false;
  private readonly sockets: WebSocketRoute[] = [];
  private readonly received: HubMessage[] = [];
  private readonly results = new Map<string, (...args: unknown[]) => unknown>();
  private readonly missed: string[] = [];
  private negotiated = 0;

  private constructor() {}

  static async install(page: Page): Promise<HubFixture> {
    const hub = new HubFixture();
    await page.route(
      (url) => LOCAL.includes(url.hostname) && url.pathname.startsWith('/hubs/'),
      async (route) => {
        const url = new URL(route.request().url());
        if (!hub.opened || url.pathname !== '/hubs/ride/negotiate') {
          hub.missed.push(`${route.request().method()} ${url.pathname}`);
          await route.fulfill({ status: 501 });
          return;
        }
        hub.negotiated += 1;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            negotiateVersion: 1,
            connectionId: 'fake-connection',
            connectionToken: 'fake-token',
            availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text'] }],
          }),
        });
      },
    );
    await page.routeWebSocket(
      (url) => LOCAL.includes(url.hostname) && url.pathname.startsWith('/hubs/'),
      (socket) => hub.accept(socket),
    );
    return hub;
  }

  /** Lets the page negotiate and connect. */
  open(): void {
    this.opened = true;
  }

  /**
   * Answers an invocation of `method` that awaits a result (`connection.invoke`) with what `result` returns, or what it
   * resolves to: `() => page.evaluate(() => Date.now())` answers ServerTime on the page's installed clock.
   */
  answer(method: string, result: (...args: unknown[]) => unknown): void {
    this.results.set(method, result);
  }

  /** Sends `target(...args)` to every connected page, as the server's `Clients.Caller.SendAsync` would. */
  async send(target: string, ...args: unknown[]): Promise<void> {
    if (this.sockets.length === 0)
      throw new Error(`No page is connected to the ride hub to receive ${target}`);
    for (const socket of this.sockets) socket.send(frame({ type: 1, target, arguments: args }));
  }

  /** Closes every connection from the server's side, as a dropped network would (L2-120 AC3). */
  async drop(): Promise<void> {
    await Promise.all([...this.sockets].map((socket) => socket.close()));
  }

  /** How many connections the page holds now. */
  connections(): number {
    return this.sockets.length;
  }

  /** How many times the page negotiated a connection: once per connect and once per reconnect. */
  negotiations(): number {
    return this.negotiated;
  }

  /** The arguments of each invocation of `target` the page made, oldest first. */
  invocations(target: string): unknown[][] {
    return this.received.filter((m) => m.target === target).map((m) => m.arguments ?? []);
  }

  /** Hub requests and invocations nobody answered; the shared fixture fails the spec when there are any. */
  unanswered(): string[] {
    return [...this.missed];
  }

  private accept(socket: WebSocketRoute): void {
    if (!this.opened) {
      this.missed.push(`WebSocket ${new URL(socket.url()).pathname}`);
      void socket.close();
      return;
    }
    this.sockets.push(socket);
    let handshaken = false;
    socket.onClose(() => {
      const index = this.sockets.indexOf(socket);
      if (index >= 0) this.sockets.splice(index, 1);
    });
    socket.onMessage((data) => {
      for (const text of String(data).split(SEPARATOR).filter(Boolean)) {
        if (!handshaken) {
          handshaken = true;
          socket.send(`{}${SEPARATOR}`);
          continue;
        }
        const message = JSON.parse(text) as HubMessage;
        if (message.type === 1) this.invoked(socket, message);
      }
    });
  }

  private invoked(socket: WebSocketRoute, message: HubMessage): void {
    this.received.push(message);
    if (message.invocationId === undefined) return;
    const result = this.results.get(message.target ?? '');
    if (!result) {
      this.missed.push(`invocation ${message.target}`);
      socket.send(frame({ type: 3, invocationId: message.invocationId, error: 'unanswered' }));
      return;
    }
    const invocationId = message.invocationId;
    // An answer read from the page settles after the page has closed when the spec has ended; nobody awaits it then.
    void Promise.resolve(result(...(message.arguments ?? []))).then(
      (answer) => socket.send(frame({ type: 3, invocationId, result: answer })),
      () => undefined,
    );
  }
}

function frame(message: object): string {
  return `${JSON.stringify(message)}${SEPARATOR}`;
}
