"use client"

import api from "@/utils/axios"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import CommonPostSkeleton from "@/components/social-app-component/PostCardSkeleton";
import PostCard from "@/components/social-app-component/PostCard"
import usePostActions from "@/hooks/usePostAction"
import toast from "react-hot-toast"
import adminApi from "@/utils/adminInterception";

export default function ViewPostPage() {
  const router = useRouter()

  // Core states
  const [posts, setPosts] = useState([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [error, setError] = useState("")

  // Pagination states
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentSkip, setCurrentSkip] = useState(0)

  // Refs for optimization
  const abortControllerRef = useRef(null)
  const hasInitialized = useRef(false) // ✅ Thêm ref để track initialization

  const LIMIT = 20

  // Use the same hook as ProfilePage for consistency
  const { toggleLike } = usePostActions({ posts, setPosts })

  // Memoize current user để tránh re-calculation
  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null

    const storedUsername = localStorage.getItem("userName")
    const storedUserId = localStorage.getItem("userId")

    if (storedUsername && storedUserId) {
      return {
        username: storedUsername,
        id: storedUserId
      }
    }
    return null
  }, [])

  // Handle post deletion - consistent with ProfilePage
  const handlePostDeleted = useCallback((deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId))
    setTotalPosts(prev => Math.max(0, prev - 1))
  }, [])

  // ✅ Tách fetchTotalPosts ra khỏi useCallback dependencies
  const fetchTotalPosts = useCallback(async () => {
    const controller = new AbortController()

    try {
      const res = await adminApi.get("/v1/statistics/posts", {
        signal: controller.signal
      })
      setTotalPosts(res.data.body?.totalPosts || 0)
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Error fetching total posts:", err)
      }
    }

    return () => controller.abort()
  }, []) // ✅ Không có dependencies

  // ✅ Tách fetchPosts ra khỏi useCallback dependencies
  const fetchPosts = useCallback(async (skipValue = 0, isLoadMore = false) => {
    const token = localStorage.getItem("admin_accessToken")
    if (!token) {
      console.warn("Không có token đăng nhập")
      return
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError("")

      const res = await adminApi.get(
          `/v1/posts?skip=${skipValue}&limit=${LIMIT}`,
          { signal: abortControllerRef.current.signal }
      )
      console.log(res.data.body)
      if (res.data.code === 200) {
        const newPosts = res.data.body || []

        // Use functional update to avoid stale closure
        setPosts(prevPosts => {
          if (isLoadMore) {
            // Prevent duplicate posts
            const existingIds = new Set(prevPosts.map(p => p.id))
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id))
            return [...prevPosts, ...uniqueNewPosts]
          } else {
            return newPosts
          }
        })

        // Update hasMore and currentSkip based on returned data
        setHasMore(newPosts.length === LIMIT)
        setCurrentSkip(skipValue + newPosts.length)

        console.log(`Loaded ${newPosts.length} posts, skip: ${skipValue}`)
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(`Không thể tải danh sách posts: ${err.message}`)
        console.error("Lỗi khi tải bài viết:", err)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, []) // ✅ Không có dependencies

  // Handle load more button click
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(currentSkip, true)
    }
  }, [currentSkip, hasMore, loadingMore, fetchPosts])

  // ✅ Sử dụng useEffect với empty dependency array và hasInitialized ref
  useEffect(() => {
    if (hasInitialized.current) return // ✅ Prevent double initialization

    console.log('Initial posts and stats load...')
    hasInitialized.current = true // ✅ Mark as initialized

    fetchTotalPosts()
    fetchPosts(0, false)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // ✅ Empty dependency array

  const handleBackToStats = useCallback(() => {
    router.back()
  }, [router])

  // Memoized skeleton components for better performance
  const PostsLoadingSkeleton = useMemo(() => {
    const Component = ({ count = 3 }) => (
        <div className="space-y-6 flex flex-col items-center">
          {Array.from({ length: count }).map((_, index) => (
              <CommonPostSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
    )
    Component.displayName = "PostsLoadingSkeleton"
    return Component
  }, [])

  return (
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl admin-card shadow-sm">
          <div className="flex items-center gap-3">
            <button
                onClick={handleBackToStats}
                className="admin-btn-back flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Thống kê
            </button>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Danh sách bài đăng ({totalPosts})
              </h2>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        )}

        {/* Posts List */}
        <section className="space-y-4">
          {loading && posts.length === 0 ? (
              <PostsLoadingSkeleton count={5} />
          ) : posts.length > 0 ? (
              <div className="flex flex-col items-center w-full">
                <div className="w-full space-y-6">
                  {posts.reduce((acc, post) => {
                    if (!acc.some(p => p.id === post.id)) acc.push(post);
                    return acc;
                  }, []).map(post => (
                      <PostCard
                          key={post.id}
                          post={post}
                          liked={post.liked}
                          likeCount={post.likeCount}
                          onLikeToggle={() => toggleLike(post.id)}
                          onPostDeleted={handlePostDeleted}
                          isAdmin={true}
                          isOwnProfile={currentUser?.username === post.user?.username}
                          isFriend={post.user?.isFriend}
                      />
                  ))}
                </div>

                {loadingMore && <PostsLoadingSkeleton count={3} />}

                {/* Load More Button or End Message */}
                <div className="flex justify-center py-8">
                  {hasMore ? (
                      <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="btn-primary"
                      >
                        {loadingMore ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading...
                            </>
                        ) : (
                            <>
                              Load More Posts
                              <span className="text-sm opacity-80">({posts.length} / {totalPosts})</span>
                            </>
                        )}
                      </button>
                  ) : (
                      <div className="bg-[var(--card)] rounded-full px-6 py-3 shadow-sm border border-[var(--border)]">
                        <p className="text-[var(--muted-foreground)] text-sm font-medium">
                          🎉 Bạn đã xem hết bài viết!
                        </p>
                      </div>
                  )}
                </div>
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-8 text-center max-w-md">
                  <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    No posts available
                  </h3>
                  <p className="text-[var(--muted-foreground)]">
                    There are no posts to display at the moment.
                  </p>
                </div>
              </div>
          )}
        </section>
      </div>
  )
}