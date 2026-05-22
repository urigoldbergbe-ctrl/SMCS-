import { describe, expect, it } from "vitest";
import { IntegrationQueue } from "../src/index";

describe("IntegrationQueue", () => {
  it("moves permanently failed events to dead letter", async () => {
    const queue = new IntegrationQueue({ maxAttempts: 2, baseBackoffMs: 1 });
    queue.enqueue({
      id: "evt-1",
      endpoint: "/orders/status",
      payload: { orderId: "o1" },
      createdAt: new Date().toISOString()
    });

    await queue.process(async () => {
      throw new Error("down");
    });
    await queue.process(async () => {
      throw new Error("still down");
    });

    expect(queue.listDeadLetter()).toHaveLength(1);
    expect(queue.listPending()).toHaveLength(0);
  });

  it("clears event when sending succeeds", async () => {
    const queue = new IntegrationQueue({ maxAttempts: 3, baseBackoffMs: 1 });
    queue.enqueue({
      id: "evt-2",
      endpoint: "/courier/location",
      payload: { courierId: "c1" },
      createdAt: new Date().toISOString()
    });

    const result = await queue.process(async () => {});
    expect(result.sent).toHaveLength(1);
    expect(queue.listPending()).toHaveLength(0);
  });
});
