"use client";

import { useEffect, useRef } from "react";
import viewEventCollector from "@/utils/viewEventCollector";

/**
 * calculateElementVisibleRatio computes the visible area ratio of an element in current viewport.
 */
function calculateElementVisibleRatio(el) {
  if (!el || typeof window === "undefined") return 0;
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  const vHeight = Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0));
  const vWidth = Math.max(0, Math.min(rect.right, windowWidth) - Math.max(rect.left, 0));
  const vArea = vHeight * vWidth;
  const tArea = rect.height * rect.width;
  if (tArea <= 0) return 0;
  return vArea / tArea;
}

/**
 * useQualifiedView tracks when a post element is at least 50% visible in viewport
 * continuously for at least 2 seconds (qualified view), while tab is foreground.
 * - Cancels measurement when tab becomes hidden.
 * - Restarts measurement when tab becomes visible again if post is still >= 50% visible (even without scroll).
 * - A new session is only started after post leaves viewport (< 50%) and re-enters.
 */
export default function useQualifiedView(domRef, postId, surface = "newsfeed", authorId = null) {
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const hasReportedRef = useRef(false);
  const hasReportedSkipRef = useRef(false);
  const visibleRatioRef = useRef(0);
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    const element = domRef?.current;
    if (!element || !postId || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const clearActiveTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
    };

    const startMeasurementIfNeeded = () => {
      if (document.visibilityState !== "visible") return;
      if (hasReportedRef.current || timerRef.current) return;

      const currentRatio = isIntersectingRef.current && visibleRatioRef.current >= 0.5
        ? visibleRatioRef.current
        : calculateElementVisibleRatio(element);

      if (currentRatio >= 0.5) {
        visibleRatioRef.current = currentRatio;
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
          if (document.visibilityState === "visible") {
            const recheckRatio = isIntersectingRef.current && visibleRatioRef.current >= 0.5
              ? visibleRatioRef.current
              : calculateElementVisibleRatio(element);

            if (recheckRatio >= 0.5) {
              const duration = Date.now() - (startTimeRef.current || Date.now());
              hasReportedRef.current = true;
              viewEventCollector.recordEvent({
                postId,
                visibleDurationMs: Math.max(duration, 2000),
                visibleRatio: visibleRatioRef.current,
                surface,
              });
            }
          }
          timerRef.current = null;
        }, 2000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        clearActiveTimer();
      } else {
        // Tab became visible again - recheck and restart timer if post is still >= 50% in view
        startMeasurementIfNeeded();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        isIntersectingRef.current = entry.isIntersecting;
        visibleRatioRef.current = entry.intersectionRatio;

        const isQualifiedRatio = entry.isIntersecting && entry.intersectionRatio >= 0.5;

        if (isQualifiedRatio) {
          startMeasurementIfNeeded();
        } else if (entry.intersectionRatio < 0.5) {
          if (
            startTimeRef.current &&
            !hasReportedRef.current &&
            !hasReportedSkipRef.current &&
            document.visibilityState === "visible"
          ) {
            const elapsed = Date.now() - startTimeRef.current;
            if (elapsed >= 150 && elapsed < 1000) {
              hasReportedSkipRef.current = true;
              viewEventCollector.recordNegativeSignal({
                postId,
                authorId,
                signalType: "quick_skip",
              });
            }
          }
          clearActiveTimer();
          // Reset reported flag once element leaves viewport so new session can be recorded
          hasReportedRef.current = false;
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    observer.observe(element);

    return () => {
      clearActiveTimer();
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [domRef, postId, surface, authorId]);
}
