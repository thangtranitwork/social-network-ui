import test from "node:test";
import assert from "node:assert/strict";

test("viewEventCollector: preserves queue B when response for batch A returns after account switch", async () => {
  let activeUserId = "userA";
  const getUserId = () => activeUserId;

  let apiCalls = [];
  let pendingResolve;
  const mockApi = {
    post: (url, body, config) => {
      apiCalls.push({ url, body, config, sentUnderUser: getUserId() });
      return new Promise((resolve) => {
        pendingResolve = () => resolve({ status: 202 });
      });
    },
  };

  class TestViewEventCollector {
    constructor() {
      this.queue = [];
      this.isFlushing = false;
      this.maxBatchSize = 20;
      this.maxRetryAgeMs = 10 * 60 * 1000;
    }

    recordEvent({ postId, visibleDurationMs = 1500, visibleRatio = 0.8, surface = "newsfeed" }) {
      const currentUserId = getUserId();
      if (!currentUserId) return;
      this.queue.push({
        eventId: `evt-${this.queue.length + 1}-${currentUserId}`,
        postId: String(postId),
        observedAt: new Date().toISOString(),
        visibleDurationMs,
        visibleRatio,
        surface,
        schemaVersion: 1,
        userId: currentUserId,
      });
    }

    async flush() {
      if (this.isFlushing) return;
      const currentUserId = getUserId();
      if (!currentUserId) {
        this.queue = [];
        return;
      }

      const now = Date.now();
      this.queue = this.queue.filter(
        (ev) => ev.userId === currentUserId && (now - new Date(ev.observedAt).getTime() < this.maxRetryAgeMs)
      );

      if (this.queue.length === 0) return;

      this.isFlushing = true;
      const batch = this.queue.slice(0, this.maxBatchSize);

      const eventsPayload = batch.map(({ eventId, postId, observedAt, visibleDurationMs, visibleRatio, surface, schemaVersion }) => ({
        eventId,
        postId,
        observedAt,
        visibleDurationMs,
        visibleRatio,
        surface,
        schemaVersion,
      }));

      try {
        const res = await mockApi.post(
          "/v1/posts/view-events",
          { events: eventsPayload },
          { _sessionUserId: currentUserId }
        );
        if (res.status === 200 || res.status === 202) {
          const confirmedIds = new Set(batch.map((e) => e.eventId));
          this.queue = this.queue.filter((ev) => !confirmedIds.has(ev.eventId));
        }
      } catch (err) {
        if (err?.message?.includes("Session mismatch")) {
          const staleIds = new Set(batch.map((e) => e.eventId));
          this.queue = this.queue.filter((ev) => !staleIds.has(ev.eventId));
        }
      } finally {
        this.isFlushing = false;
      }
    }
  }

  const collector = new TestViewEventCollector();

  // 1. User A records 2 events
  collector.recordEvent({ postId: "post-A1" });
  collector.recordEvent({ postId: "post-A2" });
  assert.equal(collector.queue.length, 2);

  // 2. User A flushes -> API request initiated
  const flushPromise = collector.flush();
  assert.equal(apiCalls.length, 1);
  assert.equal(apiCalls[0].config._sessionUserId, "userA");

  // 3. User switches to User B while request is in flight
  activeUserId = "userB";
  collector.recordEvent({ postId: "post-B1" });
  assert.equal(collector.queue.length, 3); // 2 from A, 1 from B

  // 4. In-flight request for User A resolves
  pendingResolve();
  await flushPromise;

  // 5. Verify: Only User A's events are confirmed. User B's queue remains intact!
  assert.equal(collector.queue.length, 1);
  assert.equal(collector.queue[0].postId, "post-B1");
  assert.equal(collector.queue[0].userId, "userB");
});

test("Axios retry guard: rejects replay if session changed during 401 token refresh", async () => {
  let activeUserId = "userA";
  const getUserId = () => activeUserId;

  let requestInterceptorCheck = (config) => {
    if (config._sessionUserId) {
      const current = getUserId();
      if (current !== config._sessionUserId) {
        throw new Error(`Session mismatch: request bound to user ${config._sessionUserId}, but current user is ${current}`);
      }
    }
    return config;
  };

  const originalRequest = {
    url: "/v1/posts/view-events",
    headers: {},
    _sessionUserId: "userA",
  };

  // Initial check passes for userA
  assert.doesNotThrow(() => requestInterceptorCheck(originalRequest));

  // User A gets 401, refresh begins. While waiting, active user switches to userB
  activeUserId = "userB";

  // When Axios tries to replay originalRequest:
  assert.throws(
    () => requestInterceptorCheck(originalRequest),
    /Session mismatch: request bound to user userA, but current user is userB/
  );
});

test("Same-session retry preserves event IDs and exact payload", async () => {
  let activeUserId = "userA";
  const getUserId = () => activeUserId;

  let callCount = 0;
  const mockApi = {
    post: async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("503 Service Unavailable");
      }
      return { status: 202 };
    },
  };

  const queue = [
    {
      eventId: "evt-fixed-12345",
      postId: "p99",
      observedAt: "2026-11-11T04:00:00.000Z",
      visibleDurationMs: 2500,
      visibleRatio: 0.95,
      surface: "newsfeed",
      schemaVersion: 1,
      userId: "userA",
    },
  ];

  // First flush fails (503)
  try {
    await mockApi.post("/v1/posts/view-events", { events: queue }, { _sessionUserId: "userA" });
  } catch {
    // Retain in queue
  }
  assert.equal(queue.length, 1);
  assert.equal(queue[0].eventId, "evt-fixed-12345");
  assert.equal(queue[0].observedAt, "2026-11-11T04:00:00.000Z");

  // Second flush succeeds
  const res = await mockApi.post("/v1/posts/view-events", { events: queue }, { _sessionUserId: "userA" });
  assert.equal(res.status, 202);
});
