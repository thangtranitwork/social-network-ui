"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Reusable hook for infinite scrolling using Intersection Observer.
 * 
 * @param {Function} loadMore - Function to call when target is in view
 * @param {Boolean} hasMore - Whether there are more items to load
 * @param {Boolean} isLoading - Whether a load operation is currently in progress
 * @param {Object} options - IntersectionObserver options
 */
export default function useInfiniteScroll(loadMore, hasMore, isLoading, options = {}) {
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersection = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [loadMore, hasMore, isLoading]
  );

  useEffect(() => {
    if (!loadMoreRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: options.root || null,
      rootMargin: options.rootMargin || "200px",
      threshold: options.threshold || 0.1,
    });

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, options.root, options.rootMargin, options.threshold]);

  return { loadMoreRef };
}
