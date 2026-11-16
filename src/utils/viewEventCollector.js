import api, { getUserId } from "./axios";

export class ViewEventCollector {
  constructor(options = {}) {
    this.queue = [];
    this.timer = null;
    this.isFlushing = false;
    this.flushIntervalMs = options.flushIntervalMs || 2000;
    this.maxBatchSize = options.maxBatchSize || 20;
    this.maxRetryAgeMs = options.maxRetryAgeMs || 10 * 60 * 1000; // 10 minutes
    if (!options.skipAutoInit) {
      this.init();
    }
  }

  init() {
    if (typeof window === "undefined") return;

    this.timer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush();
      }
    });

    window.addEventListener("beforeunload", () => {
      this.flush();
    });
  }

  recordEvent({ postId, visibleDurationMs, visibleRatio, surface = "newsfeed" }) {
    if (!postId || typeof window === "undefined") return;

    const currentUserId = getUserId();
    if (!currentUserId) {
      // Never record view events without an active user session
      return;
    }

    const eventId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const event = {
      eventId,
      postId: String(postId),
      observedAt: new Date().toISOString(),
      visibleDurationMs: Math.round(visibleDurationMs),
      visibleRatio: parseFloat(Number(visibleRatio).toFixed(2)),
      surface,
      schemaVersion: 1,
      userId: currentUserId, // Tagged strictly with the creating user session
    };

    this.queue.push(event);

    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.isFlushing || typeof window === "undefined") return;

    const currentUserId = getUserId();
    if (!currentUserId) {
      // User logged out: immediately clear any pending events from previous session
      this.queue = [];
      return;
    }

    const now = Date.now();
    // 1. Purge events that belong to a different account (prevent leakage after logout/account switch)
    // 2. Purge events older than 10 minutes
    this.queue = this.queue.filter(
      (ev) => ev.userId === currentUserId && (now - new Date(ev.observedAt).getTime() < this.maxRetryAgeMs)
    );

    if (this.queue.length === 0) return;

    this.isFlushing = true;
    const batch = this.queue.slice(0, this.maxBatchSize);

    // Retain exact eventId, observedAt, and payload fields across retries
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
      const res = await api.post(
        "/v1/posts/view-events",
        { events: eventsPayload },
        { _sessionUserId: currentUserId }
      );
      if (res.status === 200 || res.status === 202) {
        // When response returns, strictly remove ONLY the events belonging to the confirmed batch
        const confirmedIds = new Set(batch.map((e) => e.eventId));
        this.queue = this.queue.filter((ev) => !confirmedIds.has(ev.eventId));
      }
    } catch (err) {
      if (err?.message?.includes("Session mismatch")) {
        // Session changed during request or retry: drop stale events of that batch
        const staleIds = new Set(batch.map((e) => e.eventId));
        this.queue = this.queue.filter((ev) => !staleIds.has(ev.eventId));
      } else {
        // On network failure or 503, items remain in queue with original eventId and payload for retry
        console.warn("failed to flush qualified view events:", err?.message || err);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  async recordMediaWatch({
    postId,
    authorId,
    mediaId,
    mediaType = "video",
    watchDurationMs = 0,
    totalDurationMs = 0,
    progressRatio = 0,
    muted = false,
    replayCount = 0,
  }) {
    if (!postId || typeof window === "undefined" || !getUserId()) return;
    try {
      await api.post("/v1/posts/engagement/media-watch", {
        postId: String(postId),
        authorId: authorId ? String(authorId) : "",
        mediaId: mediaId ? String(mediaId) : "",
        mediaType,
        watchDurationMs: Math.round(watchDurationMs),
        totalDurationMs: Math.round(totalDurationMs),
        progressRatio: Math.min(1, Math.max(0, Number(progressRatio) || 0)),
        muted: Boolean(muted),
        replayCount: Number(replayCount) || 0,
      });
    } catch {
      // Best-effort telemetry
    }
  }

  async recordNegativeSignal({ postId, authorId, signalType }) {
    if (!postId || !signalType || typeof window === "undefined" || !getUserId()) return;
    try {
      await api.post("/v1/posts/engagement/negative", {
        postId: String(postId),
        authorId: authorId ? String(authorId) : "",
        signalType,
      });
    } catch {
      // Best-effort telemetry
    }
  }

  async recordSearchCTR({ query, resultType = "post", resultId, position = 0, clicked = true }) {
    if (!query || !resultId || typeof window === "undefined" || !getUserId()) return;
    try {
      await api.post("/v1/search/ctr", {
        query: String(query),
        resultType,
        resultId: String(resultId),
        position: Number(position) || 0,
        clicked: Boolean(clicked),
      });
    } catch {
      // Best-effort telemetry
    }
  }
}

const viewEventCollector = new ViewEventCollector();
export default viewEventCollector;
