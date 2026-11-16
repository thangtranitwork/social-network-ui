"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PostCard from "@/components/social-app-component/PostCard";
import PostSkeleton from "@/components/social-app-component/PostCardSkeleton";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { History, Clock, RefreshCw, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function ViewHistoryPage() {
  const t = useTranslations("settings.history");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (cursor = "", isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = { limit: 20 };
      if (cursor) {
        params.cursor = cursor;
      }
      const response = await api.get("/v1/posts/view-history", { params });
      const data = response.data?.body || {};
      const newItems = Array.isArray(data.items) ? data.items : [];

      if (isInitial) {
        setItems(newItems);
      } else {
        setItems((prev) => [...prev, ...newItems]);
      }

      setNextCursor(data.nextCursor || "");
      setHasMore(Boolean(data.hasMore && data.nextCursor));
    } catch (err) {
      console.error("Lỗi khi tải lịch sử xem bài viết:", err);
      const errMsg = err.response?.data?.message || err.message;
      if (isInitial) {
        setError(errMsg);
      } else {
        toast.error(t("loadError"));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    fetchHistory("", true);
  }, [fetchHistory]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && nextCursor) {
      fetchHistory(nextCursor, false);
    }
  };

  const handleLikeToggle = useCallback(async (postId) => {
    const targetItem = items.find((it) => it.post?.id === postId);
    if (!targetItem || !targetItem.post) return;
    const wasLiked = targetItem.post.liked;

    setItems((prev) =>
      prev.map((it) => {
        if (it.post?.id === postId) {
          return {
            ...it,
            post: {
              ...it.post,
              liked: !wasLiked,
              likeCount: (it.post.likeCount || 0) + (wasLiked ? -1 : 1),
            },
          };
        }
        return it;
      })
    );

    try {
      if (wasLiked) {
        await api.delete(`/v1/posts/unlike/${postId}`);
      } else {
        await api.post(`/v1/posts/like/${postId}`);
      }
    } catch (err) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.post?.id === postId) {
            return {
              ...it,
              post: {
                ...it.post,
                liked: wasLiked,
                likeCount: it.post.likeCount || 0,
              },
            };
          }
          return it;
        })
      );
      toast.error("Thao tác thích bài viết thất bại");
    }
  }, [items]);

  const handlePostDeleted = useCallback((deletedPostId) => {
    setItems((prev) => prev.filter((it) => it.post?.id !== deletedPostId));
  }, []);

  return (
    <div className="space-y-6 w-full max-w-2xl animate-fadeIn p-2 sm:p-4">
      {/* Page Header */}
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : error ? (
        <div className="bg-[var(--card-elevated)]/40 rounded-2xl border border-[var(--border)] p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">{t("loadError")}</h3>
          <p className="text-xs text-[var(--muted-foreground)]">{error}</p>
          <button
            onClick={() => fetchHistory("", true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--card-elevated)]/40 rounded-2xl border border-[var(--border)] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[var(--foreground)]">{t("empty")}</h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              {t("emptyDesc")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, idx) => {
            if (!item.post) return null;
            return (
              <div key={item.eventId || `${item.post.id}-${idx}`} className="space-y-1">
                {/* Viewed at timestamp pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card-elevated)]/60 border border-[var(--border)] text-[11px] text-[var(--muted-foreground)] w-fit">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>
                    {t("viewedAt")} {dayjs(item.observedAt).fromNow()}
                  </span>
                </div>

                {/* Hydrated PostCard */}
                <PostCard
                  post={item.post}
                  liked={item.post.liked}
                  likeCount={item.post.likeCount}
                  onLikeToggle={() => handleLikeToggle(item.post.id)}
                  onPostDeleted={handlePostDeleted}
                  isOwnProfile={false}
                />
              </div>
            );
          })}

          {/* Load More Button or End of List Indicator */}
          {hasMore ? (
            <div className="pt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-5 py-2.5 rounded-xl bg-[var(--card-elevated)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loadingMore && <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />}
                <span>{loadingMore ? t("loading") : t("loadMore")}</span>
              </button>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
              {t("noMore")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
