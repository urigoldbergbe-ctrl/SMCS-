export interface OutboundEvent {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempt: number;
}

export interface IntegrationQueueOptions {
  maxAttempts: number;
  baseBackoffMs: number;
}

export interface QueueProcessResult {
  sent: OutboundEvent[];
  failed: OutboundEvent[];
}

type Sender = (event: OutboundEvent) => Promise<void>;

export class IntegrationQueue {
  private readonly queue: OutboundEvent[] = [];
  private readonly deadLetter: OutboundEvent[] = [];

  constructor(private readonly options: IntegrationQueueOptions) {}

  enqueue(event: Omit<OutboundEvent, "attempt">): void {
    this.queue.push({ ...event, attempt: 0 });
  }

  listPending(): OutboundEvent[] {
    return [...this.queue];
  }

  listDeadLetter(): OutboundEvent[] {
    return [...this.deadLetter];
  }

  async process(send: Sender): Promise<QueueProcessResult> {
    const sent: OutboundEvent[] = [];
    const failed: OutboundEvent[] = [];
    const remaining: OutboundEvent[] = [];

    for (const event of this.queue) {
      try {
        await send(event);
        sent.push(event);
      } catch {
        const retried: OutboundEvent = { ...event, attempt: event.attempt + 1 };
        if (retried.attempt >= this.options.maxAttempts) {
          this.deadLetter.push(retried);
          failed.push(retried);
        } else {
          await wait(this.options.baseBackoffMs * 2 ** (retried.attempt - 1));
          remaining.push(retried);
        }
      }
    }

    this.queue.length = 0;
    this.queue.push(...remaining);
    return { sent, failed };
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
